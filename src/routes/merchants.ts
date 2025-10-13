// Merchant routes
/*
import { Router } from 'express';
import * as controller from '../controllers/merchant';

const router = Router();
router.get('/applications', controller.getApplications);
router.get('/applications/pending', controller.getPendingApplications);
router.post('/applications/:id/approve', controller.approveApplication);
router.post('/applications/:id/reject', controller.rejectApplication);
router.post('/applications/:id/more-info', controller.requestMoreInfo);
router.get('/', controller.getMerchants);
router.post('/:id/suspend', controller.suspendMerchant);
router.put('/:id/commission', controller.updateCommissionTier);

export default router;
*/
import { Router } from "express";
import * as controller from "../controllers/merchant.js"; // Fixed: merchant.ts
//import { authMiddleware } from "../middleware/auth";

const router = Router();

// Public routes (if needed)
router.get("/applications", controller.getApplications);
router.get("/applications/pending", controller.getPendingApplications);

// Admin routes
router.post("/applications/:id/approve",  controller.approveApplication);
router.post("/applications/:id/reject",  controller.rejectApplication);
router.post("/applications/:id/more-info",  controller.requestMoreInfo);
router.get("/merchants",  controller.getMerchants);
router.post("/merchants/:id/suspend",  controller.suspendMerchant);
router.put("/merchants/:id/commission",controller.updateCommissionTier);

export default router;