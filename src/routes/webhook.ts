import { Router } from "express"
import crypto from "crypto"
import axios from "axios"
import { config } from "../config/index"
import { handleTransferWebhook } from "../services/payout_service"
import { logger } from "../utils/logger"
import type { Request, Response } from "express"

const router = Router()

// Verify Paystack webhook signature
const verifyPaystackSignature = (req: Request): boolean => {
  if (!config.paystack.webhookSecret) return true; // Skip verification in dev
  const hash = crypto.createHmac("sha512", config.paystack.webhookSecret).update(JSON.stringify(req.body)).digest("hex")
  return hash === req.headers["x-paystack-signature"]
}

// Forward webhook to merchant API
// Forward webhook to merchant API
const forwardToMerchantAPI = async (rawBody: Buffer, signature: string) => {
  try {
    await axios.post(config.merchantApiWebhookUrl, rawBody, {
      headers: {
        "Content-Type": "application/json",
        "X-Paystack-Signature": signature,
      },
      timeout: 10000,
    });
    logger.info(`Forwarded webhook event to merchant API`);
  } catch (error: any) {
    logger.error(`Failed to forward webhook to merchant API: ${error.message}`);
  }
}

/**
 * @swagger
 * /webhook/paystack:
 *   post:
 *     summary: Paystack webhook endpoint
 *     tags: [Webhook]
 *     description: Receives webhook events from Paystack for transfer status updates
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       400:
 *         description: Invalid signature
 */
router.post("/paystack", async (req: Request, res: Response) => {
  try {
    // Verify webhook signature using raw body (Buffer)
    const receivedSignature = req.headers["x-paystack-signature"] as string;
    if (!config.paystack.webhookSecret) {
      // Skip verification in dev (but log for awareness)
      logger.warn("Skipping signature verification in dev mode");
    } else {
      const hash = crypto.createHmac("sha512", config.paystack.webhookSecret)
        .update(req.body)  // Use raw Buffer here
        .digest("hex");

      const receivedSignature = req.headers["x-paystack-signature"] as string;
      if (hash !== receivedSignature) {
        logger.warn("Invalid Paystack webhook signature", {
          computedHash: hash,
          receivedSignature,
        });
        return res.status(400).json({ error: "Invalid signature" });
      }
    }

    // Now safely parse the raw body to JSON
    const rawBody = req.body;
    //const event = JSON.parse(rawBody.toString("utf-8"));
    const event = JSON.parse(req.body.toString("utf-8"));

    logger.info(`Paystack webhook received: ${event.event}`, {
      event: event.event,
      data: event.data,
    });

    // Forward to merchant API (non-blocking)
    forwardToMerchantAPI(rawBody, receivedSignature).catch(() => {})

    // Handle different event types
    switch (event.event) {
      case "transfer.success":
      case "transfer.failed":
      case "transfer.reversed":
        await handleTransferWebhook(event);
        break;

      case "charge.success":
        // Handle successful payment (if needed for order processing)
        logger.info("Charge success event received", { reference: event.data.reference });
        break;

      default:
        logger.info(`Unhandled webhook event: ${event.event}`);
    }

    // Always return 200 to acknowledge receipt
    res.status(200).json({ status: "success" });
  } catch (error: any) {
    logger.error("Error processing Paystack webhook:", error);
    // Still return 200 to prevent Paystack from retrying
    res.status(200).json({ status: "error", message: error.message });
  }
});

export default router
