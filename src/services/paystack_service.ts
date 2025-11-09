import axios from "axios";
import { config } from "../config/index.js";
import { logger } from "../utils/logger.js";
import { z } from "zod";

// Paystack API client configuration
const paystackApi = axios.create({
  baseURL: "https://api.paystack.co",
  headers: {
    Authorization: `Bearer ${config.paystack.secretKey}`,
    "Content-Type": "application/json",
  },
  timeout: 10000, // Set a reasonable timeout (10s) for API calls
});

// Input validation schema for transfer recipient
const transferRecipientSchema = z.object({
  type: z.enum(["nuban", "mobile_money"]),
  name: z.string().min(1, "Recipient name is required"),
  account_number: z
    .string()
    .regex(/^\d{10}$/, "Account number must be a 10-digit number"), // NUBAN is typically 10 digits
  bank_code: z
    .string()
    .regex(/^\d{3}$/, "Bank code must be a 3-digit code"), // Paystack bank codes are 3 digits
  currency: z.enum(["NGN"]).optional().default("NGN"), // Default to NGN
});

// Input validation schema for transfer
const transferSchema = z.object({
  source: z.enum(["balance"], {
    message: "Source must be 'balance' for transfers",
  }), // Paystack only supports 'balance' for transfers
  amount: z.number().positive("Amount must be positive"), // Amount in kobo
  recipient: z.string().min(1, "Recipient code is required"),
  reason: z.string().optional(),
  reference: z.string().optional(),
});

// Response interfaces based on Paystack documentation
interface PaystackTransferRecipientResponse {
  status: boolean;
  message: string;
  data: {
    active: boolean;
    createdAt: string;
    currency: string;
    domain: string;
    id: number;
    integration: number;
    name: string;
    recipient_code: string;
    type: string;
    updatedAt: string;
    is_deleted: boolean;
    details: {
      authorization_code: string | null;
      account_number: string;
      account_name: string;
      bank_code: string;
      bank_name: string;
    };
  };
}

interface PaystackTransferResponse {
  status: boolean;
  message: string;
  data: {
    transfer_code: string;
    status: string;
    amount: number;
    currency: string;
    recipient: string;
    reference: string;
    // Add other fields as needed
  };
}

interface PaystackVerifyTransferResponse {
  status: boolean;
  message: string;
  data: {
    transfer_code: string;
    status: string; // e.g., "success", "failed", "pending"
    amount: number;
    currency: string;
    recipient: string;
    reference: string;
    created_at: string;
    // Add other fields as needed
  };
}



export const resolveAccountNumber = async (accountNumber: string, bankCode: string) => {
  try {
    const response = await paystackApi.get<{
      status: boolean;
      message: string;
      data: { account_number: string; account_name: string };
    }>(`/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`);

    if (!response.data.status) {
      throw new Error(`Paystack API error: ${response.data.message}`);
    }

    return response.data.data;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error resolving account";
    logger.error(`Failed to resolve account number: ${errorMessage}`, error);
    throw new Error(`Paystack error: ${errorMessage}`);
  }
};

// Create transfer recipient
export const createTransferRecipient = async (
  recipient: PaystackTransferRecipient
): Promise<PaystackTransferRecipientResponse["data"]> => {
  if (!config.paystack?.secretKey || !config.paystack.enabled) {
    logger.warn("Paystack not configured, returning mock recipient");
    return {
      active: true,
      createdAt: new Date().toISOString(),
      currency: "NGN",
      domain: "test",
      id: Math.floor(Math.random() * 1000000),
      integration: 0,
      name: recipient.name,
      recipient_code: `mock-recipient-${Date.now()}`,
      type: recipient.type,
      updatedAt: new Date().toISOString(),
      is_deleted: false,
      details: {
        authorization_code: null,
        account_number: recipient.account_number,
        account_name: recipient.name,
        bank_code: recipient.bank_code,
        bank_name: "Mock Bank",
      },
    };
  }

  try {
    // Validate input
    const validatedRecipient = transferRecipientSchema.parse(recipient);

    // Make API call to Paystack
    const response = await paystackApi.post<PaystackTransferRecipientResponse>(
      "/transferrecipient",
      validatedRecipient
    );

    if (!response.data.status) {
      throw new Error(`Paystack API error: ${response.data.message}`);
    }

    logger.info(`Created Paystack transfer recipient: ${response.data.data.recipient_code}`);
    return response.data.data;
  } catch (error) {
    const errorMessage =
      error instanceof z.ZodError
        ? `Validation error: ${error.errors.map((e) => e.message).join(", ")}`
        : error instanceof Error
        ? `Paystack error: ${error.message}`
        : "Unknown error creating transfer recipient";
    logger.error(errorMessage, error);
    throw new Error(errorMessage);
  }
};

// Initiate transfer (payout)
export const initiateTransfer = async (
  transfer: PaystackTransfer
): Promise<PaystackTransferResponse["data"]> => {
  if (!config.paystack?.secretKey || !config.paystack.enabled) {
    logger.warn("Paystack not configured, returning mock transfer");
    return {
      transfer_code: `mock-transfer-${Date.now()}`,
      status: "success",
      amount: transfer.amount,
      currency: "NGN",
      recipient: transfer.recipient,
      reference: transfer.reference || "",
    };
  }

  try {
    // Validate input
    const validatedTransfer = transferSchema.parse(transfer);

    // Make API call to Paystack
    const response = await paystackApi.post<PaystackTransferResponse>(
      "/transfer",
      validatedTransfer
    );

    if (!response.data.status) {
      throw new Error(`Paystack API error: ${response.data.message}`);
    }

    logger.info(`Initiated Paystack transfer: ${response.data.data.transfer_code}`);
    return response.data.data;
  } catch (error) {
    const errorMessage =
      error instanceof z.ZodError
        ? `Validation error: ${error.errors.map((e) => e.message).join(", ")}`
        : error instanceof Error
        ? `Paystack error: ${error.message}`
        : "Unknown error initiating transfer";
    logger.error(errorMessage, error);
    throw new Error(errorMessage);
  }
};

// Verify transfer
export const verifyTransfer = async (
  reference: string
): Promise<PaystackVerifyTransferResponse["data"]> => {
  if (!config.paystack?.secretKey || !config.paystack.enabled) {
    logger.warn("Paystack not configured, returning mock verification");
    return {
      transfer_code: `mock-transfer-${Date.now()}`,
      status: "success",
      amount: 0,
      currency: "NGN",
      recipient: "mock-recipient",
      reference,
      created_at: new Date().toISOString(),
    };
  }

  try {
    // Validate input
    z.string().min(1, "Reference is required").parse(reference);

    // Make API call to Paystack
    const response = await paystackApi.get<PaystackVerifyTransferResponse>(
      `/transfer/verify/${reference}`
    );

    if (!response.data.status) {
      throw new Error(`Paystack API error: ${response.data.message}`);
    }

    logger.info(`Verified Paystack transfer: ${response.data.data.transfer_code}`);
    return response.data.data;
  } catch (error) {
    const errorMessage =
      error instanceof z.ZodError
        ? `Validation error: ${error.errors.map((e) => e.message).join(", ")}`
        : error instanceof Error
        ? `Paystack error: ${error.message}`
        : "Unknown error verifying transfer";
    logger.error(errorMessage, error);
    throw new Error(errorMessage);
  }
};

// Create refund (kept for completeness)
export const createRefund = async (
  transactionReference: string,
  amount?: number
): Promise<{ id: string; status: string }> => {
  if (!config.paystack?.secretKey || !config.paystack.enabled) {
    logger.warn("Paystack not configured, returning mock refund");
    return { id: `mock-refund-${Date.now()}`, status: "success" };
  }

  try {
    const payload = {
      transaction: z
        .string()
        .min(1, "Transaction reference is required")
        .parse(transactionReference),
      amount: amount ? z.number().positive().parse(amount * 100) : undefined, // Convert to kobo
    };

    const response = await paystackApi.post("/refund", payload);
    if (!response.data.status) {
      throw new Error(`Paystack API error: ${response.data.message}`);
    }

    logger.info(`Created Paystack refund: ${response.data.data.id}`);
    return response.data.data;
  } catch (error) {
    const errorMessage =
      error instanceof z.ZodError
        ? `Validation error: ${error.errors.map((e) => e.message).join(", ")}`
        : error instanceof Error
        ? `Paystack error: ${error.message}`
        : "Unknown error creating refund";
    logger.error(errorMessage, error);
    throw new Error(errorMessage);
  }
};

// Split payment among multiple recipients (kept for completeness)
export const createSplitPayment = async (splitData: {
  name: string;
  type: "percentage" | "flat";
  currency: string;
  subaccounts: Array<{ subaccount: string; share: number }>;
  bearer_type: "all" | "account" | "subaccount";
  bearer_subaccount?: string;
}) => {
  if (!config.paystack?.secretKey || !config.paystack.enabled) {
    logger.warn("Paystack not configured, returning mock split");
    return { split_code: `mock-split-${Date.now()}` };
  }

  try {
    const response = await paystackApi.post("/split", splitData);
    if (!response.data.status) {
      throw new Error(`Paystack API error: ${response.data.message}`);
    }

    logger.info(`Created Paystack split: ${response.data.data.split_code}`);
    return response.data.data;
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? `Paystack error: ${error.message}`
        : "Unknown error creating split";
    logger.error(errorMessage, error);
    throw new Error(errorMessage);
  }
};

// Verify webhook signature
export const verifyWebhookSignature = (payload: string, signature: string): boolean => {
  const crypto = require("crypto");
  if (!config.paystack?.webhookSecret) {
    logger.warn("Paystack webhook secret not configured, skipping verification");
    return true; // Allow in mock mode
  }

  try {
    const hash = crypto
      .createHmac("sha512", config.paystack.webhookSecret)
      .update(payload)
      .digest("hex");
    return hash === signature;
  } catch (error) {
    logger.error("Error verifying webhook signature", error);
    return false;
  }
};

// Forward webhook to merchant API
export const forwardWebhookToMerchantAPI = async (eventData: any) => {
  if (!config.merchantApiWebhookUrl) {
    logger.warn("Merchant API webhook URL not configured, skipping forwarding");
    return;
  }

  try {
    await axios.post(config.merchantApiWebhookUrl, eventData, {
      headers: {
        "Content-Type": "application/json",
        "X-Paystack-Signature": "forwarded",
      },
      timeout: 5000,
    });
    logger.info(`Forwarded webhook event ${eventData.event} to merchant API`);
  } catch (error) {
    logger.error(
      `Failed to forward webhook to merchant API: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
    // Don't throw - webhook forwarding failures shouldn't break processing
  }
};

// Interface for input and response (reused across functions)
export interface PaystackTransferRecipient {
  type: "nuban" | "mobile_money";
  name: string;
  account_number: string;
  bank_code: string;
  currency?: string;
}

export interface PaystackTransfer {
  source: "balance";
  amount: number; // Amount in kobo
  recipient: string;
  reason?: string;
  reference?: string;
}
