// src/controllers/admin/order_controller.ts
import type { Request, Response } from "express";
import * as orderStatusService from "../services/order_status_service";
import { logger } from "../utils/logger";

/**
 * @swagger
 * /admin/orders/{id}/cancel:
 *   post:
 *     summary: Cancel order with full refund and inventory restock
 *     tags: [Admin Orders]
 *     security:
 *       - AdminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for cancellation
 *                 example: Customer requested cancellation
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Order cancelled successfully
 *                 order:
 *                   type: object
 *                 refundId:
 *                   type: string
 *                 itemsRestocked:
 *                   type: integer
 *       400:
 *         description: Cannot cancel order (already completed/delivered)
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
export const cancelOrder = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;
  const adminId = req.user?.id;

  if (!adminId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    logger.info(`Admin ${adminId} cancelling order ${id}`, { reason });

    const result = await orderStatusService.cancelOrder(
      parseInt(id),
      adminId,
      reason
    );

    res.json({
      message: "Order cancelled successfully",
      ...result,
    });
  } catch (error: any) {
    logger.error(`Failed to cancel order ${id}:`, {
      error: error.message,
      adminId,
    });

    if (error.message?.includes("not found")) {
      return res.status(404).json({ error: error.message });
    }

    if (error.message?.includes("Cannot cancel")) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({
      error: error.message || "Failed to cancel order",
      ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
    });
  }
};

/**
 * @swagger
 * /admin/orders/{id}/items/{itemId}/fulfillment:
 *   patch:
 *     summary: Update order item fulfillment status (admin)
 *     tags: [Admin Orders]
 *     security:
 *       - AdminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Order ID
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Order Item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Processing, Confirmed, Declined, Shipped]
 *                 description: New fulfillment status
 *                 example: Shipped
 *             required:
 *               - status
 *     responses:
 *       200:
 *         description: Item fulfillment status updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 orderItem:
 *                   type: object
 *                 order:
 *                   type: object
 *       400:
 *         description: Invalid status or unauthorized action
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order item not found
 */
export const updateItemFulfillment = async (req: Request, res: Response) => {
  const { id, itemId } = req.params;
  const { status } = req.body;
  const adminId = req.user?.id;

  if (!adminId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!status) {
    return res.status(400).json({ error: "Status is required" });
  }

  const validStatuses = ["Processing", "Confirmed", "Declined", "Shipped"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
    });
  }

  try {
    logger.info(
      `Admin ${adminId} updating order ${id} item ${itemId} to ${status}`
    );

    const updatedItem = await orderStatusService.updateOrderItemFulfillment(
      parseInt(itemId),
      status,
      adminId,
      "admin"
    );

    // Get updated order with all items
    const order = await orderStatusService.getOrderWithItems(parseInt(id));

    res.json({
      message: "Order item fulfillment status updated",
      orderItem: updatedItem,
      order,
    });
  } catch (error: any) {
    logger.error(`Failed to update order item ${itemId}:`, {
      error: error.message,
      adminId,
    });

    if (error.message?.includes("not found")) {
      return res.status(404).json({ error: error.message });
    }

    if (error.message?.includes("can only")) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({
      error: error.message || "Failed to update order item",
      ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
    });
  }
};

/**
 * @swagger
 * /admin/orders/{id}/items/bulk-fulfillment:
 *   patch:
 *     summary: Bulk update order items fulfillment status
 *     tags: [Admin Orders]
 *     security:
 *       - AdminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               itemIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array of order item IDs to update
 *                 example: [1, 2, 3]
 *               status:
 *                 type: string
 *                 enum: [Processing, Confirmed, Declined, Shipped]
 *                 example: Shipped
 *             required:
 *               - itemIds
 *               - status
 *     responses:
 *       200:
 *         description: Items updated successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
export const bulkUpdateItemsFulfillment = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;
  const { itemIds, status } = req.body;
  const adminId = req.user?.id;

  if (!adminId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!Array.isArray(itemIds) || itemIds.length === 0) {
    return res.status(400).json({ error: "itemIds array is required" });
  }

  if (!status) {
    return res.status(400).json({ error: "Status is required" });
  }

  try {
    logger.info(
      `Admin ${adminId} bulk updating ${itemIds.length} items to ${status}`
    );

    const updatedItems =
      await orderStatusService.bulkUpdateOrderItemsFulfillment(
        itemIds,
        status,
        adminId,
        "admin"
      );

    const order = await orderStatusService.getOrderWithItems(parseInt(id));

    res.json({
      message: `${updatedItems.length} items updated successfully`,
      updatedItems,
      order,
    });
  } catch (error: any) {
    logger.error("Failed to bulk update items:", {
      error: error.message,
      adminId,
    });

    res.status(500).json({
      error: error.message || "Failed to bulk update items",
      ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
    });
  }
};

/**
 * @swagger
 * /admin/orders/{id}:
 *   get:
 *     summary: Get order with items and fulfillment details
 *     tags: [Admin Orders]
 *     security:
 *       - AdminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order details with items
 *       404:
 *         description: Order not found
 */
export const getOrder = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const order = await orderStatusService.getOrderWithItems(parseInt(id));
    res.json(order);
  } catch (error: any) {
    logger.error(`Failed to get order ${id}:`, error);

    if (error.message?.includes("not found")) {
      return res.status(404).json({ error: error.message });
    }

    res.status(500).json({
      error: error.message || "Failed to get order",
    });
  }
};

/**
 * @swagger
 * /admin/orders/{id}/mark-delivered:
 *   post:
 *     summary: Mark all order items as delivered (triggers order completion)
 *     tags: [Admin Orders]
 *     security:
 *       - AdminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order marked as delivered and completed
 */
export const markOrderDelivered = async (req: Request, res: Response) => {
  const { id } = req.params;
  const adminId = req.user?.id;

  if (!adminId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    logger.info(`Admin ${adminId} marking order ${id} as delivered`);

    // Get all items for this order
    const order = await orderStatusService.getOrderWithItems(parseInt(id));

    if (!order.items || order.items.length === 0) {
      return res.status(400).json({ error: "Order has no items" });
    }

    // Mark all items as Shipped (which will trigger order completion)
    const itemIds = order.items.map((item) => item.id);
    await orderStatusService.bulkUpdateOrderItemsFulfillment(
      itemIds,
      "Delivered",
      adminId,
      "admin"
    );

    // Get updated order
    const updatedOrder = await orderStatusService.getOrderWithItems(
      parseInt(id)
    );

    res.json({
      message: "Order marked as delivered and completed",
      order: updatedOrder,
    });
  } catch (error: any) {
    logger.error(`Failed to mark order ${id} as delivered:`, {
      error: error.message,
      adminId,
    });

    res.status(500).json({
      error: error.message || "Failed to mark order as delivered",
      ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
    });
  }
};