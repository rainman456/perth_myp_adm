// Middleware for webhook routes that need raw body for signature verification

import type { Request, Response, NextFunction } from "express";
import express from "express";

// Raw body parser for webhook signature verification
export const rawBodyParser = express.raw({ type: "application/json" });

// Convert raw body back to JSON for processing
export const parseWebhookBody = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.body instanceof Buffer) {
    try {
      // Store raw body for signature verification
      (req as any).rawBody = req.body.toString("utf8");
      // Parse JSON for processing
      req.body = JSON.parse((req as any).rawBody);
    } catch (error) {
      return res.status(400).json({ error: "Invalid JSON" });
    }
  }
  next();
};
