import * as repo from "../repositories/bank_details_repository.js";
//import { paystack } from "../utils/external.js"; // Assume Paystack client
//import type { MerchantBankDetails } from "../types";
import type { InferSelectModel } from "drizzle-orm";
import { merchantBankDetails } from "../models/bank_details.js";
import { config } from "../config/index.js";
const { Paystack } = require("@paystack/paystack-sdk");
const paystack = new Paystack(config.paystack.secretKey);

type MerchantBankDetails = InferSelectModel<typeof merchantBankDetails>;

export const createBankDetails = async (
  data: Omit<MerchantBankDetails, "id">
) => {
  // Validate bank details with Paystack
  const validation = await paystack.misc.resolveAccountNumbers({
    account_number: data.accountNumber,
    bank_code: data.bankCode,
  });
  if (validation.status !== true) throw new Error("Invalid bank details");

  return await repo.createBankDetails(data);
};

export const getBankDetailsByMerchantId = async (merchantId: string) => {
  return await repo.getBankDetailsByMerchantId(merchantId);
};

export const updateBankDetails = async (
  id: string,
  data: Partial<MerchantBankDetails>
) => {
  return await repo.updateBankDetails(id, data);
};

export const deleteBankDetails = async (id: string) => {
  await repo.deleteBankDetails(id);
};
