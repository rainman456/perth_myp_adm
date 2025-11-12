import { Router } from "express";
import * as adminController from "../controllers/admin";
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

export default router;
