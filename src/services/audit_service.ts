import { db } from "../config/database.js";
import { adminLogs } from "../models/admins.js";
import { v4 as uuid } from "uuid";
import { logger } from "../utils/logger.js";

export interface AdminLogEntry {
  adminId: string;
  action: string;
  targetType: "merchant" | "application" | "dispute" | "return" | "payout" | "order" | "refund";
  targetId: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

// Create audit log entry
export const createAuditLog = async (logEntry: AdminLogEntry) => {
  try {
    const [log] = await db.insert(adminLogs).values({
      id: uuid(),
      adminId: logEntry.adminId,
      action: logEntry.action,
      targetType: logEntry.targetType,
      targetId: logEntry.targetId,
      details: logEntry.details || {},
      timestamp: new Date(),
    }).returning();

    logger.info(`Audit log created: ${logEntry.action} by admin ${logEntry.adminId}`);
    return log;
  } catch (error: any) {
    logger.error("Failed to create audit log:", error.message);
    // Don't throw - audit logging failures shouldn't break operations
    return null;
  }
};

// Get audit logs for a specific admin
export const getAdminLogs = async (adminId: string, limit = 100) => {
  return await db.query.adminLogs.findMany({
    where: (logs, { eq }) => eq(logs.adminId, adminId),
    limit,
    orderBy: (logs, { desc }) => [desc(logs.timestamp)],
  });
};

// Get audit logs for a specific target
export const getTargetLogs = async (targetType: string, targetId: string, limit = 50) => {
  return await db.query.adminLogs.findMany({
    where: (logs, { and, eq }) => and(
      eq(logs.targetType, targetType),
      eq(logs.targetId, targetId)
    ),
    limit,
    orderBy: (logs, { desc }) => [desc(logs.timestamp)],
  });
};

// Get all financial action logs
export const getFinancialLogs = async (limit = 100) => {
  const financialActions = [
    "APPROVE_REFUND",
    "PROCESS_PAYOUT",
    "UPDATE_COMMISSION",
    "SUSPEND_MERCHANT",
    "APPROVE_APPLICATION",
  ];

  return await db.query.adminLogs.findMany({
    where: (logs, { inArray }) => inArray(logs.action, financialActions),
    limit,
    orderBy: (logs, { desc }) => [desc(logs.timestamp)],
  });
};

// Middleware helper to create audit log from request
export const auditMiddleware = (action: string, targetType: AdminLogEntry["targetType"]) => {
  return async (req: any, targetId: string, details?: Record<string, any>) => {
    if (!req.user) return;

    await createAuditLog({
      adminId: req.user.id,
      action,
      targetType,
      targetId,
      details,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get("user-agent"),
    });
  };
};
