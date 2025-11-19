import { Router } from "express";
import * as adminController from "../controllers/admin";
import * as orderController from "../controllers/order_controller";

import { requireAdmin } from "../middleware/auth";
import { requirePermission, requireSuperAdmin } from "../middleware/rbac";
import { Permission } from "../types/roles";

const router = Router();

// Public routes
router.post("/login", adminController.adminSignIn);

// Protected routes - require authentication
router.use(requireAdmin);

// Admin management routes - require specific permissions
router.get(
  "/admins",
  requirePermission(Permission.VIEW_ADMINS),
  adminController.getAllAdmins
);
router.post(
  "/admins",
  requirePermission(Permission.CREATE_ADMINS),
  adminController.createAdmin
);
router.patch(
  "/admins/:id/role",
  requireSuperAdmin,
  adminController.updateAdminRole
);



router.get(
  "/order/:id",
  requirePermission(Permission.VIEW_ORDERS),
  orderController.getOrder
);

// Cancel order (with refund and restock)
router.post(
  "/order/:id/cancel",
  requirePermission(Permission.REFUND_ORDERS),
  orderController.cancelOrder
);

// Update single order item fulfillment status
router.patch(
  "/order/:id/items/:itemId/fulfillment",
  requirePermission(Permission.EDIT_ORDERS),
  orderController.updateItemFulfillment
);

// Bulk update order items fulfillment
router.patch(
  "/order/:id/items/bulk-fulfillment",
  requirePermission(Permission.EDIT_ORDERS),
  orderController.bulkUpdateItemsFulfillment
);

// Mark entire order as delivered
router.post(
  "/order/:id/mark-delivered",
  requirePermission(Permission.EDIT_ORDERS),
  orderController.markOrderDelivered
);

export default router;
