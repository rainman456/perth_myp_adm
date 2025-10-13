/*
import { Request, Response } from 'express';
import * as disputeService from '../services/dispute_service';

// Get all disputes
export const getAllDisputes = async (req: Request, res: Response) => {
  try {
    const disputes = await disputeService.getAllDisputes();
    res.json(disputes);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Escalate dispute
export const escalateDispute = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const dispute = await disputeService.escalateDispute(req.params.id, req.user.id);
    res.json(dispute);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

// Approve refund
export const approveRefund = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { dispute, order } = await disputeService.approveRefund(req.params.id, req.user.id);
    res.json({ dispute, order });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

// Create dispute
export const createDispute = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { dispute } = await disputeService.createDispute({ ...req.body, customerId: req.user.id });
    res.json(dispute);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

// Review dispute
export const reviewDispute = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const dispute = await disputeService.reviewDispute(req.params.id, req.body, req.user.id);
    res.json(dispute);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
*/