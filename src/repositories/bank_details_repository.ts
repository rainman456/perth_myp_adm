import { db } from "../config/database.js";
import { merchantBankDetails } from "../models/bank_details.js";
import { eq } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";

type MerchantBankDetails = InferSelectModel<typeof merchantBankDetails>;

export const createBankDetails = async (
  data: Omit<MerchantBankDetails, "id" | "createdAt" | "updatedAt">
) => {
  const [result] = await db
    .insert(merchantBankDetails)
    .values({ ...data })
    .returning();
  return result;
};

export const getBankDetailsByMerchantId = async (merchantId: string) => {
  return await db
    .select()
    .from(merchantBankDetails)
    .where(eq(merchantBankDetails.merchantId, merchantId));
};

export const updateBankDetails = async (
  id: string,
  data: Partial<MerchantBankDetails>
) => {
  const [result] = await db
    .update(merchantBankDetails)
    .set(data)
    .where(eq(merchantBankDetails.id, id))
    .returning();
  return result;
};

export const deleteBankDetails = async (id: string) => {
  await db.delete(merchantBankDetails).where(eq(merchantBankDetails.id, id));
};
