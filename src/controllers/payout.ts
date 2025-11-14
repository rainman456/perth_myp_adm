import type { Request, Response } from "express";
import * as payoutService from "../services/payout_service";

/**
 * @swagger
 * /payouts:
 *   get:
 *     summary: Get all payouts
 *     tags: [Payouts]
 *     security:
 *       - AdminAuth: []
 *     parameters:
 *       - in: query
 *         name: merchantId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by merchant ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, completed, failed]
 *         description: Filter by payout status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Limit the number of results
 *     responses:
 *       200:
 *         description: List of payouts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 payouts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       merchantId:
 *                         type: string
 *                         format: uuid
 *                       amount:
 *                         type: number
 *                         format: float
 *                       currency:
 *                         type: string
 *                         example: NGN
 *                       status:
 *                         type: string
 *                         enum: [pending, processing, completed, failed]
 *                       reference:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       500:
 *         description: Server error
 */
export const getAllPayouts = async (req: Request, res: Response) => {
  try {
    const { merchantId, status, limit } = req.query;

    const payouts = await payoutService.getAllPayouts({
      merchantId: merchantId as string,
      status: status as string,
      limit: limit ? Number.parseInt(limit as string) : undefined,
    });

    res.json({ payouts });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * @swagger
 * /payouts/summary/{merchantId}:
 *   get:
 *     summary: Get merchant payout summary
 *     tags: [Payouts]
 *     security:
 *       - AdminAuth: []
 *     parameters:
 *       - in: path
 *         name: merchantId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Merchant ID
 *     responses:
 *       200:
 *         description: Payout summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalPayouts:
 *                   type: number
 *                 totalAmount:
 *                   type: number
 *                   format: float
 *                 pendingPayouts:
 *                   type: number
 *                 pendingAmount:
 *                   type: number
 *                   format: float
 *                 completedPayouts:
 *                   type: number
 *                 completedAmount:
 *                   type: number
 *                   format: float
 *       500:
 *         description: Server error
 */
export const getMerchantPayoutSummary = async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    const summary = await payoutService.getMerchantPayoutSummary(merchantId);
    res.json(summary);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * @swagger
 * /payouts/aggregate:
 *   post:
 *     summary: Aggregate eligible payouts
 *     tags: [Payouts]
 *     security:
 *       - AdminAuth: []
 *     responses:
 *       200:
 *         description: Payout aggregation completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Payout aggregation completed
 *                 results:
 *                   type: object
 *                   properties:
 *                     processed:
 *                       type: integer
 *                     totalAmount:
 *                       type: number
 *                       format: float
 *       500:
 *         description: Server error
 */
export const aggregatePayouts = async (req: Request, res: Response) => {
  try {
    const results = await payoutService.aggregateEligiblePayouts();
    res.json({
      message: "Payout aggregation completed",
      results,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * @swagger
 * /payouts/{id}/process:
 *   post:
 *     summary: Process a payout
 *     tags: [Payouts]
 *     security:
 *       - AdminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Payout ID
 *     responses:
 *       200:
 *         description: Payout processing initiated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Payout processing initiated
 *                 result:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     status:
 *                       type: string
 *                       example: processing
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
export const processPayout = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await payoutService.processPayout(id, req.user!.id);
    res.json({
      message: "Payout processing initiated",
      result,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
