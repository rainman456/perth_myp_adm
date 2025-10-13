import type { Request, Response } from "express"
import * as merchantService from "../services/merchant_service"
import { v4 as uuid } from 'uuid';



/**
 * @swagger
 * /merchants/applications:
 *   get:
 *     summary: Get all merchant applications
 *     tags: [Merchants]
 *     security:
 *       - AdminAuth: []
 *     responses:
 *       200:
 *         description: List of applications
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   storeName:
 *                     type: string
 *       500:
 *         description: Server error
 */
export const getApplications = async (req: Request, res: Response) => {
  try {
    const applications = await merchantService.getAllApplications()
    res.json(applications)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
}



export const getPendingApplications = async (req: Request, res: Response) => {
  try {
    const applications = await merchantService.getPendingApplications()
    res.json(applications)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
}





/**
 * @swagger
 * /merchants/applications/{id}/approve:
 *   post:
 *     summary: Approve a merchant application
 *     tags: [Merchants]
 *     security:
 *       - AdminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Application ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tempPassword:
 *                 type: string
 *                 format: password
 *                 example: temp123pass
 *             required:
 *               - tempPassword
 *     responses:
 *       200:
 *         description: Application approved and merchant created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 application:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       example: 123e4567-e89b-12d3-a456-426614174000
 *                     status:
 *                       type: string
 *                       example: approved
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: 2025-09-13T11:00:00Z
 *                 merchant:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       example: 456e7890-f12c-34d5-a678-426614174001
 *                     merchantId:
 *                       type: string
 *                       format: uuid
 *                       example: 789f0123-g45h-67i8-j901-426614174002
 *                     storeName:
 *                       type: string
 *                       example: Test Store
 *                     status:
 *                       type: string
 *                       example: active
 *                     commissionTier:
 *                       type: string
 *                       example: standard
 *                     commissionRate:
 *                       type: number
 *                       format: float
 *                       example: 5.00
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Application not found or already processed
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Unauthorized
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Internal server error
 */
export const approveApplication = async (req: Request, res: Response) => {
  try {
    // if (!req.user?.id) {
    //   //return res.status(400).json({ error: "Unauthorized: No user data found" })
    //    const testAdminId = "ff710920-dc5b-4588-8f6e-578406707a55" // Generate valid UUID
    //   req.user = { id: testAdminId, role: "admin", email: "admin@mail.com", username: "admin" };
    // }
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const { application, merchant } = await merchantService.approveApplication(req.params.id, req.user.id)
    res.json({ application, merchant })
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
}



/**
 * @swagger
 * /merchants/applications/{id}/reject:
 *   post:
 *     summary: Reject a merchant application
 *     tags: [Merchants]
 *     security:
 *       - AdminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Application ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 example: Incomplete documentation
 *             required:
 *               - reason
 *     responses:
 *       200:
 *         description: Application rejected
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 application:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       example: 123e4567-e89b-12d3-a456-426614174000
 *                     status:
 *                       type: string
 *                       example: rejected
 *                     rejectionReason:
 *                       type: string
 *                       example: Incomplete documentation
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: 2025-09-13T11:00:00Z
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Application not found or already processed
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Unauthorized
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Internal server error
 */
export const rejectApplication = async (req: Request, res: Response) => {
  try {
     if (!req.user) {
       return res.status(401).json({ error: "Unauthorized: No user data found" })
     }
    const { reason } = req.body
    if (!reason) {
      return res.status(400).json({ error: "Reason is required" })
    }
    const application = await merchantService.rejectApplication(req.params.id, reason, req.user.id)
    res.json(application)
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
}


/**
 * @swagger
 * /merchants/applications/{id}/more-info:
 *   post:
 *     summary: Request more information for a merchant application
 *     tags: [Merchants]
 *     security:
 *       - AdminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Application ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: Please provide updated business registration certificate
 *             required:
 *               - message
 *     responses:
 *       200:
 *         description: More info request sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 application:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       example: 123e4567-e89b-12d3-a456-426614174000
 *                     status:
 *                       type: string
 *                       example: pending
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: 2025-09-13T11:00:00Z
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Application not found
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Unauthorized
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Internal server error
 */
export const requestMoreInfo = async (req: Request, res: Response) => {
  try {
     if (!req.user) {
       return res.status(401).json({ error: "Unauthorized: No user data found" })
     }
    const { message } = req.body
    if (!message) {
      return res.status(400).json({ error: "Message is required" })
    }
    const application = await merchantService.requestMoreInfo(req.params.id, message, req.user.id)
    res.json(application)
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
}



export const getMerchants = async (req: Request, res: Response) => {
  try {
    const merchants = await merchantService.getAllMerchants()
    res.json(merchants)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
}


/**
 * @swagger
 * /merchants/{id}/suspend:
 *   post:
 *     summary: Suspend a merchant
 *     tags: [Merchants]
 *     security:
 *       - AdminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Merchant ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 example: Violation of terms
 *             required:
 *               - reason
 *     responses:
 *       200:
 *         description: Merchant suspended
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 merchant:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       example: 456e7890-f12c-34d5-a678-426614174001
 *                     status:
 *                       type: string
 *                       example: suspended
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: 2025-09-13T11:00:00Z
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Merchant not found
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Unauthorized
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Internal server error
 */
export const suspendMerchant = async (req: Request, res: Response) => {
  try {
     if (!req.user) {
       return res.status(401).json({ error: "Unauthorized: No user data found" })
     }
    const { reason } = req.body
    if (!reason) {
      return res.status(400).json({ error: "Reason is required" })
    }
    const merchant = await merchantService.suspendMerchant(req.params.id, reason, req.user.id)
    res.json(merchant)
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
}

/**
 * @swagger
 * /merchants/{id}/commission:
 *   patch:
 *     summary: Update merchant commission tier
 *     tags: [Merchants]
 *     security:
 *       - AdminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Merchant ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               commissionTier:
 *                 type: string
 *                 enum: [standard, premium, enterprise]
 *                 example: premium
 *               commissionRate:
 *                 type: number
 *                 format: float
 *                 minimum: 0
 *                 maximum: 100
 *                 example: 3.5
 *             required:
 *               - commissionTier
 *               - commissionRate
 *     responses:
 *       200:
 *         description: Commission tier updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 merchant:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       example: 456e7890-f12c-34d5-a678-426614174001
 *                     commissionTier:
 *                       type: string
 *                       example: premium
 *                     commissionRate:
 *                       type: number
 *                       format: float
 *                       example: 3.5
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: 2025-09-13T11:00:00Z
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Invalid tier or rate
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Unauthorized
 *       404:
 *         description: Merchant not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Merchant not found
 */
export const updateCommissionTier = async (req: Request, res: Response) => {
  try {
     if (!req.user) {
       return res.status(401).json({ error: "Unauthorized: No user data found" })
     }
    const { tier } = req.body
    if (!tier || !["standard", "premium"].includes(tier)) {
      return res.status(400).json({ error: "Valid tier is required (standard or premium)" })
    }
    const merchant = await merchantService.updateCommissionTier(req.params.id, tier, req.user.id)
    res.json(merchant)
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
}





