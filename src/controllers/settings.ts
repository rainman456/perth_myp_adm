import { Request, Response } from 'express';
import * as settingsService from '../services/settings_service';



/**
 * @swagger
 * /settings:
 *   get:
 *     summary: Get global settings
 *     tags: [Settings]
 *     security:
 *       - AdminAuth: []
 *     responses:
 *       200:
 *         description: Global settings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: global
 *                 fees:
 *                   type: number
 *                   format: float
 *                   example: 5.00
 *                 taxRate:
 *                   type: number
 *                   format: float
 *                   example: 0.00
 *                 shippingOptions:
 *                   type: object
 *                   example: { "standard": "5.00", "express": "15.00" }
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
export const getSettings = async (req: Request, res: Response) => {
  try {
    
    const theset = await settingsService.getSettings();
    res.json(theset);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};


/**
 * @swagger
 * /settings:
 *   patch:
 *     summary: Update global settings
 *     tags: [Settings]
 *     security:
 *       - AdminAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fees:
 *                 type: number
 *                 format: float
 *                 example: 5.00
 *               taxRate:
 *                 type: number
 *                 format: float
 *                 example: 0.00
 *               shippingOptions:
 *                 type: object
 *                 example: { "standard": "5.00", "express": "15.00" }
 *     responses:
 *       200:
 *         description: Settings updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: global
 *                 fees:
 *                   type: number
 *                   format: float
 *                   example: 5.00
 *                 taxRate:
 *                   type: number
 *                   format: float
 *                   example: 0.00
 *                 shippingOptions:
 *                   type: object
 *                   example: { "standard": "5.00", "express": "15.00" }
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Invalid settings data
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
 */

export const updateSettings = async (req: Request, res: Response) => {
  try {
     if (!req.user) {
       return res.status(401).json({ error: 'Unauthorized' });
     }
    const updated = await settingsService.updateSettings(req.body, req.user.id);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};