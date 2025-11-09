/*
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db } from "../config/database.js";
import { admins } from "../models/admins.js";
import { eq } from "drizzle-orm";
import { config } from "../config/index.js";
//import { AdminRole } from "@/types/roles.js";
import { AdminRole, hasPermission } from "../types/roles"; // Add this import

export const requireRole = (requiredRole: AdminRole) => 
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    if (req.user.role !== requiredRole) { // Or use hasPermission if needed
      return res.status(403).json({ message: `Requires ${requiredRole} role` });
    }
    next();
  };

export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Admin ")) {
    return res
      .status(401)
      .json({ message: "Authentication required: Use Admin <token>" });
  }

  const token = authHeader.substring(6);
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as {
      id: string;
      role: string;
      email: string;
      username: string;
    };

    // Fetch admin from DB to verify role
    const [admin] = await db
      .select()
      .from(admins)
      .where(eq(admins.id, decoded.id));
    if (!admin) {
      return res.status(403).json({ message: "Admin not found" });
    }

    // Attach admin info to request
    req.user = {
      id: admin.id,
      role: admin.role as AdminRole, // Cast to enum
      email: admin.email,
      username: admin.username,
    };
    next();
  } catch (error) {
    console.error("Invalid token:", (error as Error).message);
    return res.status(401).json({ message: "Invalid token" });
  }
};
*/
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db } from "../config/database.js";
import { admins } from "../models/admins.js";
import { eq } from "drizzle-orm";
import { config } from "../config/index.js";
import { AdminRole } from "../types/roles.js";  // Ensure import

export const requireRole = (requiredRole: AdminRole) => 
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    if (req.user.role !== requiredRole) {
      return res.status(403).json({ message: `Requires ${requiredRole} role` });
    }
    next();
  };

export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Admin ")) {
    return res
      .status(401)
      .json({ message: "Authentication required: Use Admin <token>" });
  }

  // Extract and trim token to remove leading/trailing spaces
  const token = authHeader.substring(6).trim();
  
  // Log for debugging (remove in production)
  console.log("Extracted token (first 50 chars):", token.substring(0, 50) + "...");

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as {
      id: string;
      role: string;
      email: string;
      username: string;
    };

    console.log("Decoded payload:", decoded);  // Debug log

    // Fetch admin from DB to verify role
    const [admin] = await db
      .select()
      .from(admins)
      .where(eq(admins.id, decoded.id));
    if (!admin) {
      return res.status(403).json({ message: "Admin not found" });
    }

    // Attach admin info to request
    req.user = {
      id: admin.id,
      role: admin.role as AdminRole,
      email: admin.email,
      username: admin.username,
    };
    next();
  } catch (error) {
    console.error("JWT Verify error:", error);  // Enhanced logging
    return res.status(401).json({ message: "Invalid token" });
  }
};