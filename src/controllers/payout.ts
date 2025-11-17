import type { Request, Response } from "express";
import * as payoutService from "../services/payout_service";
import { logger } from "../utils/logger";

/**
 * @swagger
 * /payouts:
 *   get:
 *     summary: Get all payouts
 *     tags: [Payouts]
 *     security:
 *       - AdminAuth: []
 *     parameters:
 *       - in: query
 *         name: merchantId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by merchant ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, completed, failed]
 *         description: Filter by payout status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Limit the number of results
 *     responses:
 *       200:
 *         description: List of payouts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 payouts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       merchantId:
 *                         type: string
 *                         format: uuid
 *                       amount:
 *                         type: number
 *                         format: float
 *                       currency:
 *                         type: string
 *                         example: NGN
 *                       status:
 *                         type: string
 *                         enum: [pending, processing, completed, failed]
 *                       reference:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       500:
 *         description: Server error
 */
export const getAllPayouts = async (req: Request, res: Response) => {
  try {
    const { merchantId, status, limit } = req.query;

    logger.info("Fetching all payouts", {
      filters: {
        merchantId: merchantId || "all",
        status: status || "all",
        limit: limit || "no limit",
      },
      userId: req.user?.id,
      timestamp: new Date().toISOString(),
    });

    const payouts = await payoutService.getAllPayouts({
      merchantId: merchantId as string,
      status: status as string,
      limit: limit ? Number.parseInt(limit as string) : undefined,
    });

    logger.info("Payouts fetched successfully", {
      count: payouts.length,
      merchantId: merchantId || "all",
      status: status || "all",
    });

    res.json({ payouts });
  } catch (error: any) {
    logger.error("Failed to fetch payouts", {
      errorMessage: error.message,
      errorStack: error.stack,
      filters: {
        merchantId: req.query.merchantId,
        status: req.query.status,
        limit: req.query.limit,
      },
      userId: req.user?.id,
    });

    console.error("=== GET ALL PAYOUTS ERROR ===");
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);
    console.error("============================");

    res.status(500).json({ 
      error: error.message || "Failed to fetch payouts",
      ...(process.env.NODE_ENV === "development" && {
        stack: error.stack,
      })
    });
  }
};

/**
 * @swagger
 * /payouts/summary/{merchantId}:
 *   get:
 *     summary: Get merchant payout summary
 *     tags: [Payouts]
 *     security:
 *       - AdminAuth: []
 *     parameters:
 *       - in: path
 *         name: merchantId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Merchant ID
 *     responses:
 *       200:
 *         description: Payout summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalPayouts:
 *                   type: number
 *                 totalAmount:
 *                   type: number
 *                   format: float
 *                 pendingPayouts:
 *                   type: number
 *                 pendingAmount:
 *                   type: number
 *                   format: float
 *                 completedPayouts:
 *                   type: number
 *                 completedAmount:
 *                   type: number
 *                   format: float
 *       500:
 *         description: Server error
 */
export const getMerchantPayoutSummary = async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;

    logger.info("Fetching merchant payout summary", {
      merchantId,
      userId: req.user?.id,
      timestamp: new Date().toISOString(),
    });

    // Validate merchantId format (assuming UUID)
    if (!merchantId || merchantId.trim() === "") {
      logger.warn("Invalid merchant ID provided", { merchantId });
      return res.status(400).json({ error: "Merchant ID is required" });
    }

    const summary = await payoutService.getMerchantPayoutSummary(merchantId);

    logger.info("Merchant payout summary fetched successfully", {
      merchantId,
      summary: {
        totalPayouts: summary.merchant.totalPayouts,
        pendingAmount: summary.pending.amount,
        //completedAmount: summary.merchant.completedAmount,
      },
    });

    res.json(summary);
  } catch (error: any) {
    logger.error("Failed to fetch merchant payout summary", {
      merchantId: req.params.merchantId,
      errorMessage: error.message,
      errorStack: error.stack,
      userId: req.user?.id,
    });

    console.error("=== MERCHANT PAYOUT SUMMARY ERROR ===");
    console.error("Merchant ID:", req.params.merchantId);
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);
    console.error("=====================================");

    // Handle specific error cases
    if (error.message?.includes("not found")) {
      return res.status(404).json({ 
        error: "Merchant not found",
        merchantId: req.params.merchantId 
      });
    }

    res.status(500).json({ 
      error: error.message || "Failed to fetch payout summary",
      merchantId: req.params.merchantId,
      ...(process.env.NODE_ENV === "development" && {
        stack: error.stack,
      })
    });
  }
};
/**
 * @swagger
 * /payouts/aggregate:
 *   post:
 *     summary: Aggregate eligible payouts
 *     tags: [Payouts]
 *     security:
 *       - AdminAuth: []
 *     responses:
 *       200:
 *         description: Payout aggregation completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Payout aggregation completed
 *                 results:
 *                   type: object
 *                   properties:
 *                     processed:
 *                       type: integer
 *                     totalAmount:
 *                       type: number
 *                       format: float
 *       500:
 *         description: Server error
 */
export const aggregatePayouts = async (req: Request, res: Response) => {
  try {
    logger.info("Starting payout aggregation", {
      initiatedBy: req.user?.id,
      userRole: req.user?.role,
      timestamp: new Date().toISOString(),
    });

    const startTime = Date.now();

    const results = await payoutService.aggregateEligiblePayouts();

    const duration = Date.now() - startTime;

    logger.info("Payout aggregation completed successfully", {
      duration: `${duration}ms`,
      results: {
        // totalMerchants: results.totalMerchants || 0,
        // totalAmount: results.totalAmount || 0,
        // payoutsCreated: results.payoutsCreated || 0,
        // merchantsProcessed: results.merchantsProcessed || [],
      },
      initiatedBy: req.user?.id,
    });

    res.json({
      message: "Payout aggregation completed",
      results,
      duration: `${duration}ms`,
    });
  } catch (error: any) {
    logger.error("Payout aggregation failed", {
      errorMessage: error.message,
      errorStack: error.stack,
      errorName: error.name,
      initiatedBy: req.user?.id,
      timestamp: new Date().toISOString(),
    });

    console.error("=== PAYOUT AGGREGATION ERROR ===");
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);
    console.error("Initiated by:", req.user?.id);
    console.error("================================");

    // Check for specific error types
    if (error.message?.includes("permission") || error.message?.includes("unauthorized")) {
      return res.status(403).json({ 
        error: "Insufficient permissions to aggregate payouts",
        requiredRole: "admin"
      });
    }

    if (error.message?.includes("database") || error.message?.includes("connection")) {
      return res.status(503).json({ 
        error: "Database service unavailable",
        details: error.message
      });
    }

    res.status(500).json({ 
      error: error.message || "Failed to aggregate payouts",
      ...(process.env.NODE_ENV === "development" && {
        stack: error.stack,
        timestamp: new Date().toISOString(),
      })
    });
  }
};

/**
 * @swagger
 * /payouts/{id}/process:
 *   post:
 *     summary: Process a payout
 *     tags: [Payouts]
 *     security:
 *       - AdminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Payout ID
 *     responses:
 *       200:
 *         description: Payout processing initiated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Payout processing initiated
 *                 result:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     status:
 *                       type: string
 *                       example: processing
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
export const processPayout = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  try {
    logger.info("Processing payout request", {
      payoutId: id,
      userId: userId,
      timestamp: new Date().toISOString(),
    });

    const result = await payoutService.processPayout(id, userId);

    logger.info("Payout processing successful", {
      payoutId: id,
      status: result.payout.status,
      amount: result.payout.amount,
    });

    res.json({
      message: "Payout processing initiated",
      result,
    });
  } catch (error: any) {
    // Detailed error logging
    logger.error("Payout processing failed", {
      payoutId: id,
      userId: userId,
      errorMessage: error.message,
      errorStack: error.stack,
      errorName: error.name,
      // Log the full error object in development
      fullError: process.env.NODE_ENV === "development" ? error : undefined,
    });

    // Console log for immediate visibility
    console.error("=== PAYOUT PROCESSING ERROR ===");
    console.error("Payout ID:", id);
    console.error("Error Message:", error.message);
    console.error("Error Stack:", error.stack);
    console.error("================================");

    // Return appropriate status codes based on error type
    if (error.message?.includes("not found")) {
      return res.status(404).json({ 
        error: error.message,
        payoutId: id 
      });
    }

    if (error.message?.includes("status is") || error.message?.includes("Cannot process")) {
      return res.status(400).json({ 
        error: error.message,
        payoutId: id 
      });
    }

    if (error.message?.includes("recipient code") || error.message?.includes("bank details")) {
      return res.status(400).json({ 
        error: error.message,
        hint: "Please check merchant bank details configuration",
        payoutId: id 
      });
    }

    if (error.message?.includes("Transfer initiation failed")) {
      return res.status(502).json({ 
        error: "Payment gateway error",
        details: error.message,
        payoutId: id 
      });
    }

    // Generic 500 error with detailed info in development
    res.status(500).json({ 
      error: error.message || "Failed to process payout",
      payoutId: id,
      ...(process.env.NODE_ENV === "development" && {
        stack: error.stack,
        details: error
      })
    });
  }
};

















// export const checkAggregationStatus = async (req: Request, res: Response) => {
//   try {
//     logger.info("Checking payout aggregation status", {
//       userId: req.user?.id,
//     });

//     // Get counts of eligible splits and pending payouts
//     const status = await payoutService.getAggregationStatus();

//     logger.info("Aggregation status retrieved", { status });

//     res.json({
//       message: "Aggregation status",
//       ...status,
//       canAggregate: status.eligibleSplits > 0,
//     });
//   } catch (error: any) {
//     logger.error("Failed to check aggregation status", {
//       error: error.message,
//       userId: req.user?.id,
//     });

//     res.status(500).json({ 
//       error: error.message || "Failed to check aggregation status" 
//     });
//   }
// };

// Batch operations logging helper
// export const batchProcessPayouts = async (req: Request, res: Response) => {
//   try {
//     const { payoutIds } = req.body;

//     if (!Array.isArray(payoutIds) || payoutIds.length === 0) {
//       logger.warn("Invalid batch payout request", {
//         payoutIds,
//         userId: req.user?.id,
//       });
//       return res.status(400).json({ error: "Invalid payout IDs array" });
//     }

//     logger.info("Starting batch payout processing", {
//       count: payoutIds.length,
//       payoutIds,
//       userId: req.user?.id,
//     });

//     const results = await payoutService.batchProcessPayouts(payoutIds, req.user?.id);

//     const successCount = results.filter(r => r.success).length;
//     const failureCount = results.length - successCount;

//     logger.info("Batch payout processing completed", {
//       total: results.length,
//       successful: successCount,
//       failed: failureCount,
//       userId: req.user?.id,
//     });

//     res.json({
//       message: "Batch processing completed",
//       summary: {
//         total: results.length,
//         successful: successCount,
//         failed: failureCount,
//       },
//       results,
//     });
//   } catch (error: any) {
//     logger.error("Batch payout processing failed", {
//       error: error.message,
//       stack: error.stack,
//       payoutIds: req.body.payoutIds,
//       userId: req.user?.id,
//     });

//     console.error("=== BATCH PAYOUT ERROR ===");
//     console.error("Error:", error.message);
//     console.error("==========================");

//     res.status(500).json({ 
//       error: error.message || "Batch processing failed" 
//     });
//   }
// };