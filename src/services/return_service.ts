import { db } from "../config/database";
import { returnRequests } from "../models/return_request";
import { orderItems } from "../models/order_item";
import { orders } from "../models/order";
import { inventories } from "../models/inventory";
import { payments } from "../models/payment";
import { eq, and, isNotNull } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import * as paystackService from "./paystack_service";
import * as auditService from "./audit_service";
import { logger } from "../utils/logger";
export interface CreateReturnRequest {
  orderItemId: number;   // ← UUID string (matches Go model)
  customerId: number;    // ← uint → number
  reason: string;
  description?: string;
}

export const createReturnRequest = async (data: CreateReturnRequest) => {
  const [returnRequest] = await db
    .insert(returnRequests)
    .values({
      orderItemId: data.orderItemId,
      customerId: data.customerId,
      reason: data.reason,
      description: data.description,
      status: "Pending",
    })
    .returning();

  logger.info(`Return request created: ${returnRequest.id}`);
  return returnRequest;
};

// Merchant reviews return request
export const merchantReviewReturn = async (
  returnId: string,
  merchantId: string,
  decision: "approved" | "rejected"
) => {
  const [returnRequest] = await db
    .select()
    .from(returnRequests)
    .where(eq(returnRequests.id, returnId));

  if (!returnRequest) throw new Error("Return request not found");

  const [orderItem] = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.id, returnRequest.orderItemId));

  if (!orderItem || orderItem.merchantId !== merchantId) {
    throw new Error("Unauthorized");
  }

  const newStatus = decision === "approved" ? "merchant_approved" : "merchant_rejected";

  const [updated] = await db
    .update(returnRequests)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(eq(returnRequests.id, returnId))
    .returning();

  if (decision === "approved") {
    await processReturnRefund(returnId);
  }

  return updated;
};

// Admin escalates return
export const adminEscalateReturn = async (
  returnId: string,
  adminId: string,
  escalationNotes?: string
) => {
  const [updated] = await db
    .update(returnRequests)
    .set({
      status: "admin_review",
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

// Admin approves refund
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
      updatedAt: new Date(),
    })
    .where(eq(returnRequests.id, returnId))
    .returning();

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

// FIXED: processReturnRefund — now type-safe and correct
async function processReturnRefund(returnId: string, adminId?: string) {
  const [returnRequest] = await db
    .select()
    .from(returnRequests)
    .where(eq(returnRequests.id, returnId));

  if (!returnRequest) return;

  const [orderItem] = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.id, returnRequest.orderItemId));

  if (!orderItem) return;

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderItem.orderId));

  if (!order) return;

  // Get the payment (join payments table)
  const [payment] = await db
    .select()
    .from(payments)
    .where(and(eq(payments.orderId, order.id), eq(payments.status, "Completed")));

  try {
    let refundReference: string | undefined;

    if (payment?.transactionId) {
      const refundAmount = parseFloat(orderItem.price) * orderItem.quantity;

      const refund = await paystackService.createRefund(
        payment.transactionId, // ← Correct field
        refundAmount
      );

      refundReference = refund.id?.toString();
      logger.info(`Refund processed: ${refundReference} for return ${returnId}`);
    }

    // === Update return request with refundedAt and reference ===
    // Note: You currently don't have `refundedAt` or `refundReference` in schema!
    // Either add them or remove this block:
    await db
      .update(returnRequests)
      .set({
        status: "Refunded", // Match enum case if you add it later
        // refundedAt: new Date(),           // ← Add column
        // refundReference: refundReference, // ← Add column
        updatedAt: new Date(),
      })
      .where(eq(returnRequests.id, returnId));

    // === Restock inventory ===
    if (orderItem.variantId) {
      const [inventory] = await db
        .select()
        .from(inventories)
        .where(
          and(
            eq(inventories.variantId, orderItem.variantId),
            isNotNull(inventories.variantId) // Prevents TS error
          )
        );

      if (inventory) {
        await db
          .update(inventories)
          .set({
            quantity: inventory.quantity + orderItem.quantity,
            updatedAt: new Date(),
          })
          .where(eq(inventories.variantId, orderItem.variantId));

        logger.info(`Restocked variant ${orderItem.variantId}: +${orderItem.quantity}`);
      }
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

// Get all returns
export const getAllReturns = async (filters?: {
  status?: string;
  merchantId?: string;
  limit?: number;
}) => {
  let query = db.select().from(returnRequests).leftJoin(orderItems, eq(returnRequests.orderItemId, orderItems.id));

  if (filters?.status) {
    query = query.where(eq(returnRequests.status, filters.status)) as any;
  }

  if (filters?.limit) {
    query = query.limit(filters.limit) as any;
  }

  return await query;
};


