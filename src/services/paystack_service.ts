import axios from "axios";
import { config } from "../config/index.js";
import { logger } from "../utils/logger.js";

const paystackApi = axios.create({
  baseURL: "https://api.paystack.co",
  headers: {
    Authorization: `Bearer ${config.paystack.secretKey}`,
    "Content-Type": "application/json",
  },
});

export interface PaystackTransferRecipient {
  type: "nuban" | "ghipss" | "mobile_money";
  name: string;
  account_number: string;
  bank_code: string;
  currency?: string;
}

export interface PaystackTransfer {
  source: string;
  amount: number;
  recipient: string;
  reason?: string;
  reference?: string;
}

// Create transfer recipient
export const createTransferRecipient = async (
  recipient: PaystackTransferRecipient
) => {
  if (!config.paystack.enabled) {
    logger.warn("Paystack not configured, skipping recipient creation");
    return { recipient_code: "mock-recipient-" + Date.now() };
  }

  try {
    const response = await paystackApi.post("/transferrecipient", recipient);
    return response.data.data;
  } catch (error: any) {
    logger.error("Failed to create transfer recipient:", error.response?.data || error.message);
    throw new Error(`Paystack error: ${error.response?.data?.message || error.message}`);
  }
};

// Initiate transfer (payout)
export const initiateTransfer = async (transfer: PaystackTransfer) => {
  if (!config.paystack.enabled) {
    logger.warn("Paystack not configured, skipping transfer");
    return { transfer_code: "mock-transfer-" + Date.now(), status: "success" };
  }

  try {
    const response = await paystackApi.post("/transfer", transfer);
    return response.data.data;
  } catch (error: any) {
    logger.error("Failed to initiate transfer:", error.response?.data || error.message);
    throw new Error(`Paystack error: ${error.response?.data?.message || error.message}`);
  }
};

// Create refund
export const createRefund = async (transactionReference: string, amount?: number) => {
  if (!config.paystack.enabled) {
    logger.warn("Paystack not configured, skipping refund");
    return { id: "mock-refund-" + Date.now(), status: "success" };
  }

  try {
    const response = await paystackApi.post("/refund", {
      transaction: transactionReference,
      amount: amount ? amount * 100 : undefined, // Convert to kobo
    });
    return response.data.data;
  } catch (error: any) {
    logger.error("Failed to create refund:", error.response?.data || error.message);
    throw new Error(`Paystack error: ${error.response?.data?.message || error.message}`);
  }
};

// Split payment among multiple recipients
export const createSplitPayment = async (splitData: {
  name: string;
  type: "percentage" | "flat";
  currency: string;
  subaccounts: Array<{
    subaccount: string;
    share: number;
  }>;
  bearer_type: "all" | "account" | "subaccount";
  bearer_subaccount?: string;
}) => {
  if (!config.paystack.enabled) {
    logger.warn("Paystack not configured, skipping split creation");
    return { split_code: "mock-split-" + Date.now() };
  }

  try {
    const response = await paystackApi.post("/split", splitData);
    return response.data.data;
  } catch (error: any) {
    logger.error("Failed to create split:", error.response?.data || error.message);
    throw new Error(`Paystack error: ${error.response?.data?.message || error.message}`);
  }
};

// Verify webhook signature
export const verifyWebhookSignature = (payload: string, signature: string): boolean => {
  const crypto = require("crypto");
  const hash = crypto
    .createHmac("sha512", config.paystack.webhookSecret)
    .update(payload)
    .digest("hex");
  return hash === signature;
};

// Forward webhook to merchant API
export const forwardWebhookToMerchantAPI = async (eventData: any) => {
  try {
    await axios.post(config.merchantApiWebhookUrl, eventData, {
      headers: {
        "Content-Type": "application/json",
        "X-Paystack-Signature": "forwarded",
      },
      timeout: 5000,
    });
    logger.info(`Forwarded webhook event ${eventData.event} to merchant API`);
  } catch (error: any) {
    logger.error(`Failed to forward webhook to merchant API: ${error.message}`);
    // Don't throw - webhook forwarding failures shouldn't break our processing
  }
};
