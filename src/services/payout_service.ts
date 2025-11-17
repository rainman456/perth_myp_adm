import { eq, and, lt } from "drizzle-orm";
import { db } from "../config/database";
import { payouts } from "../models/payout";
import { orderMerchantSplits } from "../models/order_merchant_split";
import { merchants } from "../models/merchant";
import { logger } from "../utils/logger";
import {
  sendPayoutNotificationEmail,
  sendPayoutFailedEmail,
} from "../utils/email";
import { initiateTransfer, verifyTransfer } from "./paystack_service";
import { merchantBankDetails } from "../models/bank_details";

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
  try {
    return await db.transaction(async (tx) => {
      // 1. Fetch payout with better error handling
      const [payout] = await tx
        .select()
        .from(payouts)
        .where(eq(payouts.id, payoutId))
        .limit(1);

      if (!payout) {
        logger.error(`Payout not found: ${payoutId}`);
        throw new Error("Payout not found");
      }

      logger.info(`Processing payout: ${payoutId}, status: ${payout.status}`);

      if (payout.status !== "Pending") {
        throw new Error(`Cannot process payout with status: ${payout.status}`);
      }

      // 2. Fetch merchant
      const [merchant] = await tx
        .select()
        .from(merchants)
        .where(eq(merchants.merchantId, payout.merchantId))
        .limit(1);

      if (!merchant) {
        logger.error(`Merchant not found: ${payout.merchantId}`);
        throw new Error("Merchant not found");
      }

      logger.info(`Found merchant: ${merchant.storeName}`);

      // 3. Fetch bank details
      const [bankDetails] = await tx
        .select()
        .from(merchantBankDetails)
        .where(eq(merchantBankDetails.merchantId, payout.merchantId))
        .limit(1);

      if (!bankDetails?.recipientCode) {
        logger.error(`No recipient code for merchant: ${payout.merchantId}`);
        throw new Error("No recipient code set for merchant in bank details");
      }

      logger.info(`Using recipient code: ${bankDetails.recipientCode}`);

      // 4. Mark related splits as "processing"
      const updatedSplits = await tx
        .update(orderMerchantSplits)
        .set({ status: "processing", updatedAt: new Date() })
        .where(
          and(
            eq(orderMerchantSplits.merchantId, payout.merchantId),
            eq(orderMerchantSplits.status, "payout_requested")
          )
        )
        .returning();

      logger.info(`Marked ${updatedSplits.length} splits as processing`);

      // 5. Validate amount before transfer
      const amountInKobo = Math.round(Number(payout.amount) * 100);
      if (isNaN(amountInKobo) || amountInKobo <= 0) {
        logger.error(`Invalid payout amount: ${payout.amount}`);
        throw new Error(`Invalid payout amount: ${payout.amount}`);
      }

      logger.info(`Initiating transfer of ₦${payout.amount} (${amountInKobo} kobo)`);

      // 6. Initiate Paystack transfer with error handling
      let transfer;
      try {
        transfer = await initiateTransfer({
          source: "balance",
          amount: amountInKobo,
          recipient: bankDetails.recipientCode,
          reference: `payout_${payout.id}`,
          reason: `Payout for ${merchant.storeName}`,
        });

        logger.info(`Transfer initiated: ${transfer.transfer_code}`);
      } catch (transferError: any) {
        logger.error("Paystack transfer failed:", transferError);
        
        // Rollback splits to payout_requested
        await tx
          .update(orderMerchantSplits)
          .set({ status: "payout_requested", updatedAt: new Date() })
          .where(
            and(
              eq(orderMerchantSplits.merchantId, payout.merchantId),
              eq(orderMerchantSplits.status, "processing")
            )
          );

        // Mark payout as failed
        await tx
          .update(payouts)
          .set({ 
            status: "failed", 
            updatedAt: new Date() 
          })
          .where(eq(payouts.id, payoutId));

        throw new Error(`Transfer initiation failed: ${transferError.message}`);
      }

      // 7. Verify the transfer
      let verification;
      let finalStatus: "completed" | "processing" | "failed" = "processing";

      try {
        verification = await verifyTransfer(transfer.reference);
        finalStatus = verification.status === "success" ? "completed" : "processing";
        
        logger.info(`Transfer verification: ${verification.status}`);
      } catch (verifyError: any) {
        logger.warn("Transfer verification failed, marking as processing:", verifyError);
        // Keep as processing if verification fails
        finalStatus = "processing";
      }

      // 8. Update payout status
      await tx
        .update(payouts)
        .set({
          status: finalStatus,
          paystackTransferId: transfer.transfer_code,
          updatedAt: new Date(),
        })
        .where(eq(payouts.id, payoutId));

      // 9. If transfer is successful, update splits to "paid"
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

        // 10. Update merchant totals
        const currentTotalPayouts = Number(merchant.totalPayouts || 0);
        const newTotalPayouts = (currentTotalPayouts + Number(payout.amount)).toFixed(2);

        await tx
          .update(merchants)
          .set({
            totalPayouts: newTotalPayouts,
            lastPayoutDate: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(merchants.id, payout.merchantId));

        logger.info(`Updated merchant totals: ${newTotalPayouts}`);
      }

      // 11. Send notification email (non-blocking)
      if (merchant.workEmail) {
        try {
          await sendPayoutNotificationEmail(
            merchant.workEmail,
            merchant.storeName,
            Number(payout.amount)
          );
          logger.info(`Notification email sent to ${merchant.workEmail}`);
        } catch (emailError: any) {
          logger.error("Failed to send payout notification email:", emailError);
          // Continue with the process even if email fails
        }
      }

      const finalPayout = { ...payout, status: finalStatus, paystackTransferId: transfer.transfer_code };
      
      logger.info(`Payout processing completed: ${payoutId}, final status: ${finalStatus}`);

      return { 
        payout: finalPayout, 
        transfer: transfer,
        verification: verification 
      };
    });
  } catch (error: any) {
    logger.error(`Fatal error processing payout ${payoutId}:`, error);
    throw error;
  }
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

    // Send failure notification (with error handling)
    try {
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
    } catch (error) {
      logger.error("Failed to send payout failed email:", error);
      // Continue with the process even if email fails
    }

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
    query = query.where(
      eq(payouts.status, filters.status as any)
    ) as any;
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
