import type { Request, Response } from "express";
import * as returnService from "../services/return_service";

/**
 * @swagger
 * /returns:
 *   post:
 *     summary: Create a return request (customer)
 *     tags: [Returns]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderItemId:
 *                 type: string
 *                 format: uuid
 *                 example: 123e4567-e89b-12d3-a456-426614174000
 *               reason:
 *                 type: string
 *                 example: Damaged product
 *               description:
 *                 type: string
 *                 example: The product arrived damaged and is not usable
 *             required:
 *               - orderItemId
 *               - reason
 *     responses:
 *       201:
 *         description: Return request created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 returnRequest:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     orderItemId:
 *                       type: string
 *                       format: uuid
 *                     customerId:
 *                       type: string
 *                       format: uuid
 *                     reason:
 *                       type: string
 *                     status:
 *                       type: string
 *                       example: pending
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
// Create return request (customer)
export const createReturn = async (req: Request, res: Response) => {
  try {
    const { orderItemId, reason, description } = req.body;
    const customerId = req.user?.id; // Assuming customer auth

    if (!orderItemId || !reason) {
      return res.status(400).json({ error: "Order item ID and reason are required" });
    }

    const returnRequest = await returnService.createReturnRequest({
      orderItemId,
      customerId: customerId || "guest",
      reason,
      description,
    });

    res.status(201).json({ returnRequest });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * @swagger
 * /returns/{id}/merchant-review:
 *   post:
 *     summary: Merchant reviews return
 *     tags: [Returns]
 *     security:
 *       - MerchantAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Return request ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               decision:
 *                 type: string
 *                 enum: [approved, rejected]
 *                 example: approved
 *               merchantNotes:
 *                 type: string
 *                 example: Customer provided sufficient evidence
 *             required:
 *               - decision
 *     responses:
 *       200:
 *         description: Return request reviewed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 returnRequest:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     status:
 *                       type: string
 *                       example: approved
 *                     merchantNotes:
 *                       type: string
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// Merchant reviews return
export const merchantReview = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { decision, merchantNotes } = req.body;
    const merchantId = req.user?.id;

    if (!merchantId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!decision || !["approved", "rejected"].includes(decision)) {
      return res.status(400).json({ error: "Valid decision required (approved/rejected)" });
    }

    const returnRequest = await returnService.merchantReviewReturn(
      id,
      merchantId,
      decision,
      merchantNotes
    );

    res.json({ returnRequest });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * @swagger
 * /returns/{id}/admin-escalate:
 *   post:
 *     summary: Admin escalates return
 *     tags: [Returns]
 *     security:
 *       - AdminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Return request ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               escalationNotes:
 *                 type: string
 *                 example: Requires higher authority review
 *             required:
 *               - escalationNotes
 *     responses:
 *       200:
 *         description: Return request escalated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 returnRequest:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     status:
 *                       type: string
 *                       example: escalated
 *                     escalationNotes:
 *                       type: string
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// Admin escalates return
export const adminEscalate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { escalationNotes } = req.body;
    const adminId = req.user?.id;

    if (!adminId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const returnRequest = await returnService.adminEscalateReturn(
      id,
      adminId,
      escalationNotes
    );

    res.json({ returnRequest });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * @swagger
 * /returns/{id}/admin-approve-refund:
 *   post:
 *     summary: Admin approves refund
 *     tags: [Returns]
 *     security:
 *       - AdminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Return request ID
 *     responses:
 *       200:
 *         description: Refund approved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 returnRequest:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     status:
 *                       type: string
 *                       example: refunded
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                 message:
 *                   type: string
 *                   example: Refund processed successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// Admin approves refund
export const adminApproveRefund = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = req.user?.id;

    if (!adminId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const returnRequest = await returnService.adminApproveRefund(id, adminId);

    res.json({ returnRequest, message: "Refund processed successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * @swagger
 * /returns:
 *   get:
 *     summary: Get all returns (admin view)
 *     tags: [Returns]
 *     security:
 *       - AdminAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected, escalated, refunded]
 *         description: Filter by return status
 *       - in: query
 *         name: merchantId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by merchant ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Limit the number of results
 *     responses:
 *       200:
 *         description: List of returns
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 returns:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       orderItemId:
 *                         type: string
 *                         format: uuid
 *                       customerId:
 *                         type: string
 *                         format: uuid
 *                       reason:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [pending, approved, rejected, escalated, refunded]
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       500:
 *         description: Server error
 */
// Get all returns (admin view)
export const getAllReturns = async (req: Request, res: Response) => {
  try {
    const { status, merchantId, limit } = req.query;

    const returns = await returnService.getAllReturns({
      status: status as string,
      merchantId: merchantId as string,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.json({ returns });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
