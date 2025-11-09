import { eq, and, lt } from "drizzle-orm";
import { db } from "../config/database.js";
import { payouts } from "../models/payout.js";
import { orderMerchantSplits } from "../models/order_merchant_split.js";
import { merchants } from "../models/merchant.js";
import { logger } from "../utils/logger.js";
import {
  sendPayoutNotificationEmail,
  sendPayoutFailedEmail,
} from "../utils/email.js";
import { initiateTransfer, verifyTransfer } from "./paystack_service.js";
import { merchantBankDetails } from "../models/bank_details.js";

export const aggregateEligiblePayouts = async () => {
  logger.info("Starting automatic payout aggregation...");

  try {
    // Get all active merchants
    const activeMerchants = await db
      .select()
      .from(merchants)
      .where(eq(merchants.status, "active"));

    const results = [];

    for (const merchant of activeMerchants) {
      // Find eligible splits: status = 'payout_requested' and holdUntil has passed
      const eligibleSplits = await db
        .select()
        .from(orderMerchantSplits)
        .where(
          and(
            eq(orderMerchantSplits.merchantId, merchant.id),
            eq(orderMerchantSplits.status, "payout_requested"),
            lt(orderMerchantSplits.holdUntil, new Date())
          )
        );

      if (eligibleSplits.length === 0) continue;

      // Calculate total amount
      const totalAmount = eligibleSplits.reduce(
        (sum, split) => sum + Number(split.amountDue),
        0
      );

      // Fetch bank details to get recipient code
      const [bankDetails] = await db
        .select()
        .from(merchantBankDetails)
        .where(eq(merchantBankDetails.merchantId, merchant.id));

      // Check if merchant has recipient code in bank details
      if (!bankDetails?.recipientCode) {
        logger.warn(
          `Merchant ${merchant.id} has no recipient code in bank details, skipping payout`
        );
        continue;
      }

      // Create payout record
      const [payout] = await db
        .insert(payouts)
        .values({
          merchantId: merchant.id,
          amount: totalAmount.toFixed(2),
          status: "pending",
          payoutAccountId: bankDetails.recipientCode,
        })
        .returning();

      logger.info(
        `Created payout ${payout.id} for merchant ${merchant.storeName}: ${totalAmount}`
      );

      results.push({
        payoutId: payout.id,
        merchantId: merchant.id,
        amount: totalAmount,
        splitsCount: eligibleSplits.length,
      });
    }

    logger.info(
      `Payout aggregation complete. Created ${results.length} payouts.`
    );
    return results;
  } catch (error) {
    logger.error("Error during payout aggregation:", error);
    throw error;
  }
};

export const processPayout = async (payoutId: string, adminId?: string) => {
  return await db.transaction(async (tx) => {
    const [payout] = await tx
      .select()
      .from(payouts)
      .where(eq(payouts.id, payoutId));

    if (!payout) throw new Error("Payout not found");
    if (payout.status !== "pending")
      throw new Error(`Payout status is ${payout.status}`);

    const [merchant] = await tx
      .select()
      .from(merchants)
      .where(eq(merchants.id, payout.merchantId));

    if (!merchant) throw new Error("Merchant not found");

    // Fetch bank details to get recipient code
    const [bankDetails] = await tx
      .select()
      .from(merchantBankDetails)
      .where(eq(merchantBankDetails.merchantId, payout.merchantId));

    if (!bankDetails?.recipientCode) {
      throw new Error("No recipient code set for merchant in bank details");
    }

    // Mark related splits as "processing"
    await tx
      .update(orderMerchantSplits)
      .set({ status: "processing", updatedAt: new Date() })
      .where(
        and(
          eq(orderMerchantSplits.merchantId, payout.merchantId),
          eq(orderMerchantSplits.status, "payout_requested")
        )
      );

    // Initiate Paystack transfer
    const transfer = await initiateTransfer({
      source: "balance",
      amount: Math.round(Number(payout.amount) * 100), // Convert to kobo
      recipient: bankDetails.recipientCode,
      reference: `payout_${payout.id}`,
      reason: `Payout for ${merchant.storeName}`,
    });

    // Verify the transfer immediately
    const verification = await verifyTransfer(transfer.reference);

    // Update payout based on verification status
    const finalStatus = verification.status === "success" ? "completed" : "processing";

    await tx
      .update(payouts)
      .set({
        status: finalStatus,
        paystackTransferId: transfer.transfer_code,
        updatedAt: new Date(),
      })
      .where(eq(payouts.id, payoutId));

    // If transfer is successful, update splits to "paid"
    if (finalStatus === "completed") {
      await tx
        .update(orderMerchantSplits)
        .set({ status: "paid", updatedAt: new Date() })
        .where(
          and(
            eq(orderMerchantSplits.merchantId, payout.merchantId),
            eq(orderMerchantSplits.status, "processing")
          )
        );

      // Update merchant totals
      const newTotalPayouts = (
        Number(merchant.totalPayouts || 0) + Number(payout.amount)
      ).toFixed(2);

      await tx
        .update(merchants)
        .set({
          totalPayouts: newTotalPayouts,
          lastPayoutDate: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(merchants.id, payout.merchantId));
    }

    // Send notification email
    await sendPayoutNotificationEmail(
      merchant.workEmail,
      merchant.storeName,
      Number(payout.amount)
    );

    return { payout: { ...payout, status: finalStatus }, transfer: transfer };
  });
};

export const handleTransferWebhook = async (event: any) => {
  logger.info(`Received Paystack webhook: ${event.event}`);

  if (event.event === "transfer.success") {
    const transferCode = event.data.transfer_code;
    const [payout] = await db
      .select()
      .from(payouts)
      .where(eq(payouts.paystackTransferId, transferCode));

    if (!payout) {
      logger.warn(`No payout found for transfer code: ${transferCode}`);
      return;
    }

    // Update payout to completed
    await db
      .update(payouts)
      .set({ status: "completed", updatedAt: new Date() })
      .where(eq(payouts.id, payout.id));

    // Mark all related splits as paid
    await db
      .update(orderMerchantSplits)
      .set({ status: "paid", updatedAt: new Date() })
      .where(
        and(
          eq(orderMerchantSplits.merchantId, payout.merchantId),
          eq(orderMerchantSplits.status, "processing")
        )
      );

    // Update merchant totals
    const [merchant] = await db
      .select()
      .from(merchants)
      .where(eq(merchants.id, payout.merchantId));

    const newTotalPayouts = (
      Number(merchant.totalPayouts || 0) + Number(payout.amount)
    ).toFixed(2);

    await db
      .update(merchants)
      .set({
        totalPayouts: newTotalPayouts,
        lastPayoutDate: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(merchants.id, payout.merchantId));

    logger.info(`Payout ${payout.id} completed successfully`);
  } else if (
    event.event === "transfer.failed" ||
    event.event === "transfer.reversed"
  ) {
    const transferCode = event.data.transfer_code;
    const [payout] = await db
      .select()
      .from(payouts)
      .where(eq(payouts.paystackTransferId, transferCode));

    if (!payout) {
      logger.warn(`No payout found for transfer code: ${transferCode}`);
      return;
    }

    // Update payout to failed
    await db
      .update(payouts)
      .set({ status: "failed", updatedAt: new Date() })
      .where(eq(payouts.id, payout.id));

    // Reset splits back to payout_requested
    await db
      .update(orderMerchantSplits)
      .set({ status: "payout_requested", updatedAt: new Date() })
      .where(
        and(
          eq(orderMerchantSplits.merchantId, payout.merchantId),
          eq(orderMerchantSplits.status, "processing")
        )
      );

    // Send failure notification
    const [merchant] = await db
      .select()
      .from(merchants)
      .where(eq(merchants.id, payout.merchantId));

    await sendPayoutFailedEmail(
      merchant.workEmail,
      merchant.storeName,
      Number(payout.amount),
      event.data.reason || "Unknown error"
    );

    logger.error(`Payout ${payout.id} failed: ${event.data.reason}`);
  }
};

export const getAllPayouts = async (filters?: {
  merchantId?: string;
  status?: string;
  limit?: number;
}) => {
  let query = db.select().from(payouts);

  if (filters?.merchantId) {
    query = query.where(eq(payouts.merchantId, filters.merchantId)) as any;
  }

  if (filters?.status) {
    query = query.where(eq(payouts.status, filters.status)) as any;
  }

  const results = await query.limit(filters?.limit || 100);
  return results;
};

export const getMerchantPayoutSummary = async (merchantId: string) => {
  const [merchant] = await db
    .select()
    .from(merchants)
    .where(eq(merchants.id, merchantId));

  if (!merchant) throw new Error("Merchant not found");

  // Get pending splits
  const pendingSplits = await db
    .select()
    .from(orderMerchantSplits)
    .where(
      and(
        eq(orderMerchantSplits.merchantId, merchantId),
        eq(orderMerchantSplits.status, "payout_requested")
      )
    );

  const pendingAmount = pendingSplits.reduce(
    (sum, split) => sum + Number(split.amountDue),
    0
  );

  // Get recent payouts
  const recentPayouts = await db
    .select()
    .from(payouts)
    .where(eq(payouts.merchantId, merchantId))
    .limit(10);

  return {
    merchant: {
      id: merchant.id,
      storeName: merchant.storeName,
      totalPayouts: merchant.totalPayouts,
      lastPayoutDate: merchant.lastPayoutDate,
    },
    pending: {
      amount: pendingAmount,
      splitsCount: pendingSplits.length,
    },
    recentPayouts,
  };
};
