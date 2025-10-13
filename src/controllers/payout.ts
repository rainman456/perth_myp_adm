import type { Request, Response } from "express";
import * as payoutService from "../services/payout_service.js";

export const getAllPayouts = async (req: Request, res: Response) => {
  try {
    const { merchantId, status, limit } = req.query;

    const payouts = await payoutService.getAllPayouts({
      merchantId: merchantId as string,
      status: status as string,
      limit: limit ? Number.parseInt(limit as string) : undefined,
    });

    res.json({ payouts });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getMerchantPayoutSummary = async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    const summary = await payoutService.getMerchantPayoutSummary(merchantId);
    res.json(summary);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const aggregatePayouts = async (req: Request, res: Response) => {
  try {
    const results = await payoutService.aggregateEligiblePayouts();
    res.json({
      message: "Payout aggregation completed",
      results,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const processPayout = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await payoutService.processPayout(id, req.user!.id);
    res.json({
      message: "Payout processing initiated",
      result,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
