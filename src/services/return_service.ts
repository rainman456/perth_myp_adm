import { db } from "../config/database.js";
import { returnRequests } from "../models/return_request.js";
import { orderItems } from "../models/order_item.js";
import { orders } from "../models/order.js";
import { inventories } from "../models/inventory.js";
import { eq, and } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import * as paystackService from "./paystack_service.js";
import * as auditService from "./audit_service.js";
import { logger } from "../utils/logger.js";

export interface CreateReturnRequest {
  orderItemId: string;
  customerId: string;
  reason: string;
  description?: string;
}

// Customer creates return request
export const createReturnRequest = async (data: CreateReturnRequest) => {
  const [returnRequest] = await db.insert(returnRequests).values({
    id: uuid(),
    orderItemId: data.orderItemId,
    customerId: data.customerId,
    reason: data.reason,
    description: data.description,
    status: "pending",
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning();

  // Notify merchant (would send email in production)
  logger.info(`Return request created: ${returnRequest.id}`);
  return returnRequest;
};

// Merchant reviews return request
export const merchantReviewReturn = async (
  returnId: string,
  merchantId: string,
  decision: "approved" | "rejected",
  merchantNotes?: string
) => {
  // Verify merchant owns this return
  const [returnRequest] = await db
    .select()
    .from(returnRequests)
    .where(eq(returnRequests.id, returnId));

  if (!returnRequest) {
    throw new Error("Return request not found");
  }

  // Get order item to verify merchant
  const [orderItem] = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.id, returnRequest.orderItemId));

  if (!orderItem || orderItem.merchantId !== merchantId) {
    throw new Error("Unauthorized: Not your return request");
  }

  const newStatus = decision === "approved" ? "merchant_approved" : "merchant_rejected";

  const [updated] = await db
    .update(returnRequests)
    .set({
      status: newStatus,
      merchantReviewedAt: new Date(),
      merchantNotes,
      updatedAt: new Date(),
    })
    .where(eq(returnRequests.id, returnId))
    .returning();

  // If approved, process automatically
  if (decision === "approved") {
    await processReturnRefund(returnId);
  }

  return updated;
};

// Admin escalates return (when merchant rejects or customer disputes)
export const adminEscalateReturn = async (
  returnId: string,
  adminId: string,
  escalationNotes?: string
) => {
  const [updated] = await db
    .update(returnRequests)
    .set({
      status: "admin_review",
      adminEscalatedAt: new Date(),
      adminNotes: escalationNotes,
      updatedAt: new Date(),
    })
    .where(eq(returnRequests.id, returnId))
    .returning();

  await auditService.createAuditLog({
    adminId,
    action: "ESCALATE_RETURN",
    targetType: "return",
    targetId: returnId,
    details: { notes: escalationNotes },
  });

  return updated;
};

// Admin approves refund for return
export const adminApproveRefund = async (returnId: string, adminId: string) => {
  const [returnRequest] = await db
    .select()
    .from(returnRequests)
    .where(eq(returnRequests.id, returnId));

  if (!returnRequest) {
    throw new Error("Return request not found");
  }

  const [updated] = await db
    .update(returnRequests)
    .set({
      status: "admin_approved",
      adminReviewedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(returnRequests.id, returnId))
    .returning();

  // Process refund
  await processReturnRefund(returnId, adminId);

  await auditService.createAuditLog({
    adminId,
    action: "APPROVE_REFUND",
    targetType: "return",
    targetId: returnId,
    details: { orderItemId: returnRequest.orderItemId },
  });

  return updated;
};

// Process refund and restock inventory
async function processReturnRefund(returnId: string, adminId?: string) {
  const [returnRequest] = await db
    .select()
    .from(returnRequests)
    .where(eq(returnRequests.id, returnId));

  if (!returnRequest) return;

  // Get order item details
  const [orderItem] = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.id, returnRequest.orderItemId));

  if (!orderItem) return;

  // Get order for payment reference
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderItem.orderId));

  if (!order) return;

  try {
    // Process refund through Paystack
    if (order.paymentReference) {
      const refund = await paystackService.createRefund(
        order.paymentReference,
        parseFloat(orderItem.price) * orderItem.quantity
      );

      logger.info(`Refund processed: ${refund.id} for return ${returnId}`);

      // Update return status
      await db
        .update(returnRequests)
        .set({
          status: "refunded",
          refundedAt: new Date(),
          refundReference: refund.id?.toString(),
          updatedAt: new Date(),
        })
        .where(eq(returnRequests.id, returnId));
    }

    // Restock inventory
    const [inventory] = await db
      .select()
      .from(inventories)
      .where(eq(inventories.variantId, orderItem.variantId));

    if (inventory) {
      await db
        .update(inventories)
        .set({
          quantity: inventory.quantity + orderItem.quantity,
          updatedAt: new Date(),
        })
        .where(eq(inventories.variantId, orderItem.variantId));

      logger.info(`Restocked inventory for variant ${orderItem.variantId}: +${orderItem.quantity}`);
    }

    if (adminId) {
      await auditService.createAuditLog({
        adminId,
        action: "PROCESS_REFUND",
        targetType: "return",
        targetId: returnId,
        details: {
          orderItemId: orderItem.id,
          refundAmount: parseFloat(orderItem.price) * orderItem.quantity,
          quantityRestocked: orderItem.quantity,
        },
      });
    }
  } catch (error: any) {
    logger.error(`Failed to process refund for return ${returnId}: ${error.message}`);
    throw error;
  }
}

// Get all return requests (admin view)
export const getAllReturns = async (filters?: {
  status?: string;
  merchantId?: string;
  limit?: number;
}) => {
  let query = db.select().from(returnRequests);

  if (filters?.status) {
    query = query.where(eq(returnRequests.status, filters.status)) as any;
  }

  if (filters?.limit) {
    query = query.limit(filters.limit) as any;
  }

  return await query;
};
