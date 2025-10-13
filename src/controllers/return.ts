import type { Request, Response } from "express";
import * as returnService from "../services/return_service.js";

// Create return request (customer)
export const createReturn = async (req: Request, res: Response) => {
  try {
    const { orderItemId, reason, description } = req.body;
    const customerId = req.user?.id; // Assuming customer auth

    if (!orderItemId || !reason) {
      return res.status(400).json({ error: "Order item ID and reason are required" });
    }

    const returnRequest = await returnService.createReturnRequest({
      orderItemId,
      customerId: customerId || "guest",
      reason,
      description,
    });

    res.status(201).json({ returnRequest });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Merchant reviews return
export const merchantReview = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { decision, merchantNotes } = req.body;
    const merchantId = req.user?.id;

    if (!merchantId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!decision || !["approved", "rejected"].includes(decision)) {
      return res.status(400).json({ error: "Valid decision required (approved/rejected)" });
    }

    const returnRequest = await returnService.merchantReviewReturn(
      id,
      merchantId,
      decision,
      merchantNotes
    );

    res.json({ returnRequest });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

// Admin escalates return
export const adminEscalate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { escalationNotes } = req.body;
    const adminId = req.user?.id;

    if (!adminId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const returnRequest = await returnService.adminEscalateReturn(
      id,
      adminId,
      escalationNotes
    );

    res.json({ returnRequest });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Admin approves refund
export const adminApproveRefund = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = req.user?.id;

    if (!adminId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const returnRequest = await returnService.adminApproveRefund(id, adminId);

    res.json({ returnRequest, message: "Refund processed successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Get all returns (admin view)
export const getAllReturns = async (req: Request, res: Response) => {
  try {
    const { status, merchantId, limit } = req.query;

    const returns = await returnService.getAllReturns({
      status: status as string,
      merchantId: merchantId as string,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.json({ returns });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
