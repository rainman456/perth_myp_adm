import axios from "axios";
import { config } from "../config/index";
import { logger } from "../utils/logger";
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

// Input validation schema for refund
const refundSchema = z.object({
  transaction: z.string().min(1, "Transaction reference is required"),
  amount: z.number().positive("Amount must be positive").optional(), // Amount in kobo before multiplication
  currency: z.enum(["NGN"]).optional(),
  customer_note: z.string().optional(),
  merchant_note: z.string().optional(),
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

interface PaystackCreateRefundResponse {
  status: boolean;
  message: string;
  data: {
    transaction: {
      id: number;
      domain: string;
      reference: string;
      amount: number;
      paid_at: string; // ISO date string
      channel: string;
      currency: string;
      authorization: {
        exp_month: number | null;
        exp_year: number | null;
        account_name: string | null;
      };
      customer: {
        international_format_phone: string | null;
      };
      plan: Record<string, unknown>; // Empty object in sample
      subaccount: {
        currency: string | null;
      };
      split: Record<string, unknown>; // Empty object in sample
      order_id: string | null;
      paidAt: string; // ISO date string
      pos_transaction_data: unknown | null;
      source: unknown | null;
      fees_breakdown: unknown | null;
    };
    integration: number;
    deducted_amount: number;
    channel: string | null;
    merchant_note: string;
    customer_note: string;
    status: string; // e.g., "pending", "processed", "processing"
    refunded_by: string;
    expected_at: string; // ISO date string
    currency: string;
    domain: string;
    amount: number;
    fully_deducted: boolean;
    id: number;
    createdAt: string; // ISO date string
    updatedAt: string; // ISO date string
  };
}

interface PaystackFetchRefundResponse {
  status: boolean;
  message: string;
  data: {
    integration: number;
    transaction: number;
    dispute: number | null;
    settlement: unknown | null;
    domain: string;
    amount: number;
    deducted_amount: number;
    fully_deducted: boolean;
    currency: string;
    channel: string;
    status: string; // e.g., "processed", "pending"
    refunded_by: string;
    refunded_at: string; // ISO date string
    expected_at: string; // ISO date string
    customer_note: string;
    merchant_note: string;
    id: number;
    createdAt: string; // ISO date string
    updatedAt: string; // ISO date string
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

// Create refund
export const createRefund = async (
  transactionReference: string,
  amount?: number,
  currency?: string,
  customer_note?: string,
  merchant_note?: string
): Promise<PaystackCreateRefundResponse["data"]> => {
  if (!config.paystack?.secretKey || !config.paystack.enabled) {
    logger.warn("Paystack not configured, returning mock refund");
    return {
      id: Math.floor(Math.random() * 1000000),
      integration: 0,
      domain: "test",
      amount: amount || 10000,
      deducted_amount: 0,
      channel: null,
      merchant_note: merchant_note || "Mock merchant note",
      customer_note: customer_note || "Mock customer note",
      status: "pending",
      refunded_by: "mock@user.com",
      expected_at: new Date(Date.now() + 86400000).toISOString(), // 1 day later
      currency: currency || "NGN",
      fully_deducted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      transaction: {
        id: Math.floor(Math.random() * 1000000),
        domain: "test",
        reference: transactionReference,
        amount: amount || 10000,
        paid_at: new Date().toISOString(),
        channel: "mock",
        currency: currency || "NGN",
        authorization: {
          exp_month: null,
          exp_year: null,
          account_name: null,
        },
        customer: {
          international_format_phone: null,
        },
        plan: {},
        subaccount: {
          currency: null,
        },
        split: {},
        order_id: null,
        paidAt: new Date().toISOString(),
        pos_transaction_data: null,
        source: null,
        fees_breakdown: null,
      },
    };
  }

  try {
    // Validate input
    const input = {
      transaction: transactionReference,
      amount,
      currency,
      customer_note,
      merchant_note,
    };
    const validated = refundSchema.parse(input);

    // Prepare payload with amount in kobo
    const payload = {
      ...validated,
      amount: validated.amount ? validated.amount * 100 : undefined,
    };

    // Make API call to Paystack
    const response = await paystackApi.post<PaystackCreateRefundResponse>("/refund", payload);

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

// Fetch refund (verify refund status)
export const fetchRefund = async (
  refundId: number
): Promise<PaystackFetchRefundResponse["data"]> => {
  if (!config.paystack?.secretKey || !config.paystack.enabled) {
    logger.warn("Paystack not configured, returning mock refund fetch");
    return {
      id: refundId,
      integration: 0,
      transaction: Math.floor(Math.random() * 1000000),
      dispute: null,
      settlement: null,
      domain: "test",
      amount: 10000,
      deducted_amount: 0,
      fully_deducted: false,
      currency: "NGN",
      channel: "mock",
      status: "processed",
      refunded_by: "mock@user.com",
      refunded_at: new Date().toISOString(),
      expected_at: new Date().toISOString(),
      customer_note: "Mock customer note",
      merchant_note: "Mock merchant note",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  try {
    // Validate input
    z.number().positive("Refund ID must be a positive number").parse(refundId);

    // Make API call to Paystack
    const response = await paystackApi.get<PaystackFetchRefundResponse>(`/refund/${refundId}`);

    if (!response.data.status) {
      throw new Error(`Paystack API error: ${response.data.message}`);
    }

    logger.info(`Fetched Paystack refund: ${response.data.data.id}`);
    return response.data.data;
  } catch (error) {
    const errorMessage =
      error instanceof z.ZodError
        ? `Validation error: ${error.errors.map((e) => e.message).join(", ")}`
        : error instanceof Error
        ? `Paystack error: ${error.message}`
        : "Unknown error fetching refund";
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

import fs from "fs/promises";
import path from "path";
//import { z } from "zod";

export interface PaystackBank {
  name: string;
  code: string;
  slug?: string | null;
  // Paystack may include extra fields; keep them if present
  [key: string]: any;
}

interface PaystackBanksResponse {
  status: boolean;
  message: string;
  data: PaystackBank[];
  meta?: any;
}

// --- optional small schema for country validation ---
const allowedCountries = ["ghana", "kenya", "nigeria", "south africa"] as const;
const countrySchema = z
  .string()
  .optional()
  .refine((v) => !v || allowedCountries.includes(v as any), {
    message: `country must be one of: ${allowedCountries.join(", ")}`,
  });

// default cache file (can be overridden in config.paystack.cacheFile)
const DEFAULT_BANKS_CACHE = "banks.json";

// helper: get cache path (prefer config.paystack.cacheFile)
const getBanksCachePath = () => {
  const cfgPath = (config.paystack && (config.paystack as any).cacheFile) || DEFAULT_BANKS_CACHE;
  // resolve relative to project root
  return path.resolve(process.cwd(), cfgPath);
};

// helper: atomic write (write to tmp then rename)
async function atomicWriteFile(filePath: string, data: Buffer | string) {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  const tmpPath = `${filePath}.tmp`;
  await fs.writeFile(tmpPath, data);
  await fs.rename(tmpPath, filePath);
}

// Read banks from cache file (expects full Paystack response or array)
async function readBanksFromCache(cachePath: string): Promise<PaystackBank[]> {
  try {
    const raw = await fs.readFile(cachePath, "utf8");
    const parsed = JSON.parse(raw);

    // If the file contains the full Paystack response object
    if (parsed && Array.isArray(parsed.data)) {
      return parsed.data as PaystackBank[];
    }

    // If the file is already an array of banks
    if (Array.isArray(parsed)) {
      return parsed as PaystackBank[];
    }

    // Unexpected shape
    throw new Error("unexpected cache shape");
  } catch (err) {
    throw new Error(`failed to read banks cache: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * getBanks - fetch list of banks from Paystack, cache result, fallback to cache on failure.
 * @param country optional country filter (ghana|kenya|nigeria|south africa)
 */
export const getBanks = async (country?: string): Promise<PaystackBank[]> => {
  // validate country if provided
  try {
    countrySchema.parse(country);
  } catch (err) {
    const msg = err instanceof z.ZodError ? err.errors.map((e) => e.message).join(", ") : "invalid country";
    logger.error(`getBanks validation error: ${msg}`, err);
    throw new Error(msg);
  }

  const cachePath = getBanksCachePath();

  // If Paystack not configured, return mock result or cache fallback
  if (!config.paystack?.secretKey || !config.paystack.enabled) {
    logger.warn("Paystack not configured or disabled. Returning mock banks or cache if available.");
    // try cache first
    try {
      const cached = await readBanksFromCache(cachePath);
      return cached;
    } catch (e) {
      // return a small mock list
      return [
        { name: "Mock Bank", code: "000", slug: "mock-bank" },
        { name: "Another Mock Bank", code: "001", slug: "another-mock" },
      ];
    }
  }

  // Build request URL
  const params: Record<string, string> = {};
  if (country) params.country = country;

  try {
    const resp = await paystackApi.get<PaystackBanksResponse>("/bank", { params });

    if (!resp.data || resp.status !== 200) {
      throw new Error(`unexpected response status ${resp.status}`);
    }

    if (!resp.data.status) {
      // Paystack returned an error flag
      throw new Error(`paystack error: ${resp.data.message}`);
    }

    // Save raw response to cache (so fallback can parse it). Non-fatal on failure.
    try {
      await atomicWriteFile(cachePath, JSON.stringify(resp.data, null, 2));
    } catch (writeErr) {
      logger.warn("Failed to write banks cache file", writeErr);
      // continue — we still return the live data
    }

    return resp.data.data;
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    logger.error(`Failed to fetch banks from Paystack: ${errMsg}`);

    // fallback to cache file
    try {
      const cached = await readBanksFromCache(cachePath);
      logger.info("Loaded banks from cache after API failure");
      return cached;
    } catch (cacheErr) {
      const cacheMsg = cacheErr instanceof Error ? cacheErr.message : String(cacheErr);
      logger.error(`Failed to load banks from cache: ${cacheMsg}`);
      throw new Error(`failed to fetch banks: ${errMsg}; cache error: ${cacheMsg}`);
    }
  }
};