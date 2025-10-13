// Automatic payout scheduler using node-cron

import cron from "node-cron"
import { aggregateEligiblePayouts, processPayout } from "../services/payout_service.js"
import { logger } from "../utils/logger.js"
import { db } from "../config/database.js"
import { payouts } from "../models/payout.js"
import { eq } from "drizzle-orm"

// Run payout aggregation daily at 2 AM
export const startPayoutAggregationScheduler = () => {
  cron.schedule("0 2 * * *", async () => {
    logger.info("Running scheduled payout aggregation...")
    try {
      const results = await aggregateEligiblePayouts()
      logger.info(`Scheduled aggregation created ${results.length} payouts`)
    } catch (error) {
      logger.error("Scheduled payout aggregation failed:", error)
    }
  })

  logger.info("Payout aggregation scheduler started (daily at 2 AM)")
}

// Process pending payouts every hour
export const startPayoutProcessingScheduler = () => {
  cron.schedule("0 * * * *", async () => {
    logger.info("Running scheduled payout processing...")
    try {
      // Get all pending payouts
      const pendingPayouts = await db.select().from(payouts).where(eq(payouts.status, "pending")).limit(50)

      let processed = 0
      let failed = 0

      for (const payout of pendingPayouts) {
        try {
          await processPayout(payout.id)
          processed++
        } catch (error) {
          logger.error(`Failed to process payout ${payout.id}:`, error)
          failed++
        }
      }

      logger.info(`Scheduled payout processing complete. Processed: ${processed}, Failed: ${failed}`)
    } catch (error) {
      logger.error("Scheduled payout processing failed:", error)
    }
  })

  logger.info("Payout processing scheduler started (hourly)")
}

// Start all payout schedulers
export const startPayoutSchedulers = () => {
  startPayoutAggregationScheduler()
  startPayoutProcessingScheduler()
  logger.info("All payout schedulers initialized")
}
