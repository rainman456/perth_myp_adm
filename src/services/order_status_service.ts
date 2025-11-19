// src/services/order_status_service.ts
import { db } from "../config/database";
import { orders } from "../models/order";
import { orderItems } from "../models/order_item";
import { inventories } from "../models/inventory";
import { payments } from "../models/payment";
import { eq, and, inArray, sql } from "drizzle-orm";
import { logger } from "../utils/logger";
import * as paystackService from "./paystack_service";
import * as auditService from "./audit_service";

/**
 * Automatically update order status based on item fulfillment states
 */
export const updateOrderStatusFromItems = async (orderId: number) => {
  try {
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    // Get all order items
    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    if (items.length === 0) {
      logger.warn(`Order ${orderId} has no items`);
      return order;
    }

    // Check fulfillment status of all items
    const allSentOrShipped = items.every(
      (item) =>
        item.fulfillmentStatus === "SentToAronovaHub" || item.fulfillmentStatus === "OutForDelivery" 
    );

    const allDelivered = items.every(
      (item) => item.fulfillmentStatus === "Delivered"
    );

    let newOrderStatus = order.status;

    // Rule: If all items are SentToAronovaHub or OutForDelivery → Order = Shipped
    if (allSentOrShipped && order.status !== "Pending" && order.status !== "Cancelled" && order.status !== "Completed") {
      newOrderStatus = "Shipped";
      logger.info(`Order ${orderId}: All items sent/shipped, updating to OutForDelivery`);
    }

    // Rule: If all items are Delivered (Shipped) → Order = Completed
    if (allDelivered && order.status !== "Completed") {
      newOrderStatus = "Completed";
      logger.info(`Order ${orderId}: All items delivered, updating to Completed`);
    }

    // Update order status if changed
    if (newOrderStatus !== order.status) {
      const [updatedOrder] = await db
        .update(orders)
        .set({
          status: newOrderStatus,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId))
        .returning();

      logger.info(
        `Order ${orderId} status updated: ${order.status} → ${newOrderStatus}`
      );

      return updatedOrder;
    }

    return order;
  } catch (error: any) {
    logger.error(`Failed to update order status for ${orderId}:`, error);
    throw error;
  }
};

/**
 * Cancel order with full refund and inventory restock
 */
export const cancelOrder = async (orderId: number, adminId: string, reason?: string) => {
  try {
    return await db.transaction(async (tx) => {
      // 1. Get order
      const [order] = await tx
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      if (!order) {
        throw new Error(`Order ${orderId} not found`);
      }

      // 2. Prevent cancellation of already completed/delivered orders
      if (order.status === "Completed" || order.status === "Paid") {
        throw new Error(
          `Cannot cancel order ${orderId}: Order is already ${order.status}`
        );
      }

      // 3. Get all order items
      const items = await tx
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId));

      logger.info(`Cancelling order ${orderId} with ${items.length} items`);

      // 4. Restock inventory for each item
      for (const item of items) {
        if (item.variantId) {
          // Restock variant inventory
          await tx
            .update(inventories)
            .set({
              quantity: sql`${inventories.quantity} + ${item.quantity}`,
              reservedQuantity: sql`${inventories.reservedQuantity} - ${item.quantity}`,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(inventories.variantId, item.variantId),
                eq(inventories.merchantId, item.merchantId)
              )
            );

          logger.info(
            `Restocked variant ${item.variantId}: +${item.quantity} units`
          );
        } else if (item.productId) {
          // Restock simple product inventory
          await tx
            .update(inventories)
            .set({
              quantity: sql`${inventories.quantity} + ${item.quantity}`,
              reservedQuantity: sql`${inventories.reservedQuantity} - ${item.quantity}`,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(inventories.productId, item.productId),
                eq(inventories.merchantId, item.merchantId)
              )
            );

          logger.info(
            `Restocked product ${item.productId}: +${item.quantity} units`
          );
        }
      }

      // 5. Process refund if payment was made
      const [payment] = await tx
        .select()
        .from(payments)
        .where(
          and(
            eq(payments.orderId, orderId),
            eq(payments.status, "Completed")
          )
        )
        .limit(1);

      let refundId: string | undefined;

      if (payment?.transactionId) {
        try {
          const refundAmount = parseFloat(order.totalAmount || "0");

          const refund = await paystackService.createRefund(
            payment.transactionId,
            refundAmount
          );

          refundId = refund.id?.toString();

          // Update payment status
          await tx
            .update(payments)
            .set({
              status: "Refunded",
              updatedAt: new Date(),
            })
            .where(eq(payments.id, payment.id));

          logger.info(
            `Refund initiated for order ${orderId}: ₦${refundAmount} (Refund ID: ${refundId})`
          );
        } catch (refundError: any) {
          logger.error(
            `Failed to process refund for order ${orderId}:`,
            refundError
          );
          // Don't throw - continue with cancellation even if refund fails
          // The refund can be processed manually later
        }
      }

      // 6. Update order status to Cancelled
      const [cancelledOrder] = await tx
        .update(orders)
        .set({
          status: "Cancelled",
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId))
        .returning();

      // 7. Create audit log
      await auditService.createAuditLog({
        adminId,
        action: "CANCEL_ORDER",
        targetType: "order",
        targetId: orderId.toString(),
        details: {
          reason,
          refundId,
          itemsRestocked: items.length,
          refundAmount: order.totalAmount,
        },
      });

      logger.info(
        `Order ${orderId} cancelled successfully. Items restocked, refund ${
          refundId ? "processed" : "pending"
        }`
      );

      return {
        order: cancelledOrder,
        refundId,
        itemsRestocked: items.length,
      };
    });
  } catch (error: any) {
    logger.error(`Failed to cancel order ${orderId}:`, error);
    throw error;
  }
};

/**
 * Update order item fulfillment status and cascade to order status
 */
export const updateOrderItemFulfillment = async (
  orderItemId: number,
  newStatus: "Processing" | "Confirmed" | "Declined" | "SentToAronovaHub" | "OutForDelivery" |"Delivered",
  updatedBy: string,
  role: "merchant" | "admin"
) => {
  try {
    // 1. Validate status transition based on role
    if (role === "merchant" && newStatus === "Confirmed") {
      throw new Error("Merchants can only mark items as SentToAronovaHub, not Shipped");
    }

    if (role === "admin" && newStatus === "SentToAronovaHub") {
      throw new Error("Admins should mark items as Shipped, not SentToAronovaHub");
    }

    // 2. Update order item status
    const [updatedItem] = await db
      .update(orderItems)
      .set({
        fulfillmentStatus: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(orderItems.id, orderItemId))
      .returning();

    if (!updatedItem) {
      throw new Error(`Order item ${orderItemId} not found`);
    }

    logger.info(
      `Order item ${orderItemId} updated to ${newStatus} by ${role} ${updatedBy}`
    );

    // 3. Handle inventory reservation on confirmation/decline
    if (newStatus === "Confirmed") {
      // Item confirmed - inventory already reserved at order creation
      logger.info(`Item ${orderItemId} confirmed`);
    } else if (newStatus === "Declined") {
      // Item declined - release reserved inventory
      if (updatedItem.variantId) {
        await db
          .update(inventories)
          .set({
            reservedQuantity: sql`${inventories.reservedQuantity} - ${updatedItem.quantity}`,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(inventories.variantId, updatedItem.variantId),
              eq(inventories.merchantId, updatedItem.merchantId)
            )
          );
      } else if (updatedItem.productId) {
        await db
          .update(inventories)
          .set({
            reservedQuantity: sql`${inventories.reservedQuantity} - ${updatedItem.quantity}`,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(inventories.productId, updatedItem.productId),
              eq(inventories.merchantId, updatedItem.merchantId)
            )
          );
      }

      logger.info(`Released reserved inventory for declined item ${orderItemId}`);
    }

    // 4. Cascade update to order status
    await updateOrderStatusFromItems(updatedItem.orderId);

    return updatedItem;
  } catch (error: any) {
    logger.error(`Failed to update order item ${orderItemId}:`, error);
    throw error;
  }
};

/**
 * Bulk update order items (e.g., all items for a merchant in an order)
 */
export const bulkUpdateOrderItemsFulfillment = async (
  orderItemIds: number[],
  newStatus: "Processing" | "Confirmed" | "Declined" | "SentToAronovaHub" | "OutForDelivery" |"Delivered",
  updatedBy: string,
  role: "merchant" | "admin"
) => {
  try {
    const updatedItems = [];

    for (const itemId of orderItemIds) {
      const item = await updateOrderItemFulfillment(
        itemId,
        newStatus,
        updatedBy,
        role
      );
      updatedItems.push(item);
    }

    logger.info(
      `Bulk updated ${updatedItems.length} order items to ${newStatus}`
    );

    return updatedItems;
  } catch (error: any) {
    logger.error("Failed to bulk update order items:", error);
    throw error;
  }
};

/**
 * Get order with items and fulfillment status
 */
export const getOrderWithItems = async (orderId: number) => {
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!order) {
    throw new Error(`Order ${orderId} not found`);
  }

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  return {
    ...order,
    items,
  };
};