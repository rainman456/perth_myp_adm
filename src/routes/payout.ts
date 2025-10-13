import { Router } from "express"
import * as payoutController from "../controllers/payout.js"
import { requireAdmin } from "../middleware/auth.js"
import { requirePermission } from "../middleware/rbac.js"
import { Permission } from "../types/roles.js"

const router = Router()

// All payout routes require authentication
router.use(requireAdmin)

// Get all payouts
router.get("/", requirePermission(Permission.VIEW_PAYOUTS), payoutController.getAllPayouts)

// Get merchant payout summary
router.get(
  "/merchant/:merchantId",
  requirePermission(Permission.VIEW_PAYOUTS),
  payoutController.getMerchantPayoutSummary,
)

// Trigger manual payout aggregation
router.post("/aggregate", requirePermission(Permission.PROCESS_PAYOUTS), payoutController.aggregatePayouts)

// Process a specific payout
router.post("/:id/process", requirePermission(Permission.PROCESS_PAYOUTS), payoutController.processPayout)

export default router
