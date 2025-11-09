import * as repo from "../repositories/bank_details_repository.js";
import { createTransferRecipient ,resolveAccountNumber} from "./paystack_service.js";
import type { InferSelectModel } from "drizzle-orm";
import { merchantBankDetails } from "../models/bank_details.js";
import { logger } from "../utils/logger.js";
import { z } from "zod";

type MerchantBankDetails = InferSelectModel<typeof merchantBankDetails>;

// Validation schema for bank details
const bankDetailsSchema = z.object({
  merchantId: z.string().uuid("Invalid merchant ID"),
  bankName: z.string().min(1, "Bank name is required").nullish(), // Allow null
  bankCode: z.string().regex(/^\d{3}$/, "Bank code must be a 3-digit code"),
  accountNumber: z
    .string()
    .regex(/^\d{10}$/, "Account number must be a 10-digit number"),
  accountName: z.string().min(1, "Account name is required").nullish(), // Allow null
  currency: z.enum(["NGN"]).default("NGN"),
  status: z.enum(["pending", "active", "inactive"]).default("pending"),
});


export const createBankDetails = async (
  data: Omit<MerchantBankDetails, "id" | "createdAt" | "updatedAt" | "recipientCode">
) => {
  // Validate input
  const validatedData = bankDetailsSchema.parse(data);

  // Resolve account number with Paystack
  const resolvedAccount = await resolveAccountNumber(
    validatedData.accountNumber,
    validatedData.bankCode
  );

  // Create Paystack transfer recipient
  let recipientCode: string | undefined;
  try {
    const recipient = await createTransferRecipient({
      type: "nuban",
      name: resolvedAccount.account_name,
      account_number: validatedData.accountNumber,
      bank_code: validatedData.bankCode,
      currency: validatedData.currency,
    });
    recipientCode = recipient.recipient_code;
    logger.info(
      `Created Paystack transfer recipient for merchant ${validatedData.merchantId}: ${recipientCode}`
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error creating recipient";
    logger.error(`Failed to create Paystack recipient: ${errorMessage}`, error);
    throw new Error(errorMessage);
  }

  // Prepare bank details with recipientCode, converting undefined to null
  const bankDetailsData: Omit<MerchantBankDetails, "id" | "createdAt" | "updatedAt"> = {
    ...validatedData,
    accountName: resolvedAccount.account_name,
    recipientCode,
    status: "active",
    bankName: validatedData.bankName ?? null, // Convert undefined to null
  };

  // Save to database
  const result = await repo.createBankDetails(bankDetailsData);
  logger.info(`Created bank details for merchant ${validatedData.merchantId}`, {
    id: result.id,
  });

  return result;
};

export const getBankDetailsByMerchantId = async (merchantId: string) => {
  // Validate merchantId
  z.string().uuid("Invalid merchant ID").parse(merchantId);

  const result = await repo.getBankDetailsByMerchantId(merchantId);
  logger.info(`Retrieved bank details for merchant ${merchantId}`, {
    found: !!result,
  });

  return result;
};

export const updateBankDetails = async (
  id: string,
  data: Partial<Omit<MerchantBankDetails, "id" | "createdAt" | "updatedAt">>
) => {
  // Validate input
  const validatedData = bankDetailsSchema.partial().parse(data);

  // If updating bank details, re-validate with Paystack
  let updateData: Partial<MerchantBankDetails> = { ...validatedData };
  if (validatedData.accountNumber && validatedData.bankCode) {
    const resolvedAccount = await resolveAccountNumber(
      validatedData.accountNumber,
      validatedData.bankCode
    );

    // Update Paystack recipient
    try {
      const recipient = await createTransferRecipient({
        type: "nuban",
        name: resolvedAccount.account_name,
        account_number: validatedData.accountNumber,
        bank_code: validatedData.bankCode,
        currency: validatedData.currency || "NGN",
      });
      updateData = {
        ...validatedData,
        recipientCode: recipient.recipient_code,
        accountName: resolvedAccount.account_name,
        status: "active",
        bankName: validatedData.bankName ?? null, // Convert undefined to null
      };
      logger.info(`Updated Paystack recipient for bank details ${id}: ${recipient.recipient_code}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error updating recipient";
      logger.error(`Failed to update Paystack recipient: ${errorMessage}`, error);
      throw new Error(errorMessage);
    }
  } else {
    // Ensure bankName is null if undefined
    updateData.bankName = validatedData.bankName ?? null;
  }

  const result = await repo.updateBankDetails(id, updateData);
  logger.info(`Updated bank details ${id}`, { merchantId: validatedData.merchantId });

  return result;
};

export const deleteBankDetails = async (id: string) => {
  // Validate id
  z.string().uuid("Invalid bank details ID").parse(id);

  await repo.deleteBankDetails(id);
  logger.info(`Deleted bank details ${id}`);
};
