
// import { Request, Response } from 'express';
// import * as disputeService from '../services/dispute_service';

// /**
//  * @swagger
//  * /disputes:
//  *   get:
//  *     summary: Get all disputes
//  *     tags: [Disputes]
//  *     security:
//  *       - AdminAuth: []
//  *     responses:
//  *       200:
//  *         description: List of disputes
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: array
//  *               items:
//  *                 type: object
//  *                 properties:
//  *                   id:
//  *                     type: string
//  *                     format: uuid
//  *                   orderId:
//  *                     type: string
//  *                     format: uuid
//  *                   customerId:
//  *                     type: string
//  *                     format: uuid
//  *                   reason:
//  *                     type: string
//  *                   description:
//  *                     type: string
//  *                   status:
//  *                     type: string
//  *                     enum: [pending, under_review, escalated, resolved, rejected]
//  *                   createdAt:
//  *                     type: string
//  *                     format: date-time
//  *       500:
//  *         description: Server error
//  */
// export const getAllDisputes = async (req: Request, res: Response) => {
//   try {
//     const disputes = await disputeService.getAllDisputes();
//     res.json(disputes);
//   } catch (error: any) {
//     res.status(500).json({ error: error.message });
//   }
// };

// /**
//  * @swagger
//  * /disputes/{id}/escalate:
//  *   post:
//  *     summary: Escalate a dispute
//  *     tags: [Disputes]
//  *     security:
//  *       - AdminAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *           format: uuid
//  *         description: Dispute ID
//  *     responses:
//  *       200:
//  *         description: Dispute escalated
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 id:
//  *                   type: string
//  *                   format: uuid
//  *                 status:
//  *                   type: string
//  *                   example: escalated
//  *                 updatedAt:
//  *                   type: string
//  *                   format: date-time
//  *       400:
//  *         description: Bad request
//  *       401:
//  *         description: Unauthorized
//  *       500:
//  *         description: Server error
//  */
// export const escalateDispute = async (req: Request, res: Response) => {
//   try {
//     if (!req.user?.id) {
//       return res.status(401).json({ error: 'Unauthorized' });
//     }
//     const dispute = await disputeService.escalateDispute(req.params.id, req.user.id);
//     res.json(dispute);
//   } catch (error: any) {
//     res.status(400).json({ error: error.message });
//   }
// };

// /**
//  * @swagger
//  * /disputes/{id}/approve-refund:
//  *   post:
//  *     summary: Approve refund for a dispute
//  *     tags: [Disputes]
//  *     security:
//  *       - AdminAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *           format: uuid
//  *         description: Dispute ID
//  *     responses:
//  *       200:
//  *         description: Refund approved
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 dispute:
//  *                   type: object
//  *                   properties:
//  *                     id:
//  *                       type: string
//  *                       format: uuid
//  *                     status:
//  *                       type: string
//  *                       example: resolved
//  *                 order:
//  *                   type: object
//  *                   properties:
//  *                     id:
//  *                       type: string
//  *                       format: uuid
//  *                     status:
//  *                       type: string
//  *                       example: refunded
//  *       400:
//  *         description: Bad request
//  *       401:
//  *         description: Unauthorized
//  *       500:
//  *         description: Server error
//  */
// export const approveRefund = async (req: Request, res: Response) => {
//   try {
//     if (!req.user?.id) {
//       return res.status(401).json({ error: 'Unauthorized' });
//     }
//     const { dispute, order } = await disputeService.approveRefund(req.params.id, req.user.id);
//     res.json({ dispute, order });
//   } catch (error: any) {
//     res.status(400).json({ error: error.message });
//   }
// };

// /**
//  * @swagger
//  * /disputes:
//  *   post:
//  *     summary: Create a new dispute
//  *     tags: [Disputes]
//  *     security:
//  *       - BearerAuth: []
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               orderItemId:
//  *                 type: string
//  *                 format: uuid
//  *                 example: 123e4567-e89b-12d3-a456-426614174000
//  *               reason:
//  *                 type: string
//  *                 example: Damaged product
//  *               description:
//  *                 type: string
//  *                 example: The product arrived damaged and is not usable
//  *             required:
//  *               - orderItemId
//  *               - reason
//  *     responses:
//  *       200:
//  *         description: Dispute created
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 dispute:
//  *                   type: object
//  *                   properties:
//  *                     id:
//  *                       type: string
//  *                       format: uuid
//  *                     orderItemId:
//  *                       type: string
//  *                       format: uuid
//  *                     customerId:
//  *                       type: string
//  *                       format: uuid
//  *                     reason:
//  *                       type: string
//  *                     status:
//  *                       type: string
//  *                       example: pending
//  *                     createdAt:
//  *                       type: string
//  *                       format: date-time
//  *       400:
//  *         description: Bad request
//  *       401:
//  *         description: Unauthorized
//  *       500:
//  *         description: Server error
//  */
// export const createDispute = async (req: Request, res: Response) => {
//   try {
//     if (!req.user?.id) {
//       return res.status(401).json({ error: 'Unauthorized' });
//     }
//     const { dispute } = await disputeService.createDispute({ ...req.body, customerId: req.user.id });
//     res.json(dispute);
//   } catch (error: any) {
//     res.status(400).json({ error: error.message });
//   }
// };

// /**
//  * @swagger
//  * /disputes/{id}/review:
//  *   post:
//  *     summary: Review a dispute
//  *     tags: [Disputes]
//  *     security:
//  *       - AdminAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *           format: uuid
//  *         description: Dispute ID
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               status:
//  *                 type: string
//  *                 enum: [under_review, rejected]
//  *                 example: under_review
//  *               notes:
//  *                 type: string
//  *                 example: Reviewing the evidence provided
//  *             required:
//  *               - status
//  *     responses:
//  *       200:
//  *         description: Dispute reviewed
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 id:
//  *                   type: string
//  *                   format: uuid
//  *                 status:
//  *                   type: string
//  *                   example: under_review
//  *                 adminNotes:
//  *                   type: string
//  *                 updatedAt:
//  *                   type: string
//  *                   format: date-time
//  *       400:
//  *         description: Bad request
//  *       401:
//  *         description: Unauthorized
//  *       500:
//  *         description: Server error
//  */
// export const reviewDispute = async (req: Request, res: Response) => {
//   try {
//     if (!req.user?.id) {
//       return res.status(401).json({ error: 'Unauthorized' });
//     }
//     const dispute = await disputeService.reviewDispute(req.params.id, req.body, req.user.id);
//     res.json(dispute);
//   } catch (error: any) {
//     res.status(400).json({ error: error.message });
//   }
// };

