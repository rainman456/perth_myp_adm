import { Router } from "express";
import * as returnController from "../controllers/return";
import { requireAdmin } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { Permission } from "../types/roles";

const router = Router();

// Admin routes
router.use(requireAdmin);

router.get(
  "/",
  requirePermission(Permission.VIEW_RETURNS),
  returnController.getAllReturns
);

router.post(
  "/:id/escalate",
  requirePermission(Permission.MANAGE_DISPUTES),
  returnController.adminEscalate
);

router.post(
  "/:id/approve-refund",
  requirePermission(Permission.APPROVE_REFUNDS),
  returnController.adminApproveRefund
);

export default router;
