// Role-based access control middleware

import type { Request, Response, NextFunction } from "express";
import { type Permission, hasPermission, AdminRole } from "../types/roles.js";

// Note: Express Request type is extended in src/types/express.d.ts
// No need to redeclare it here to avoid conflicts

// Middleware to check if user has required permission
export const requirePermission = (permission: Permission) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const userRole = req.user.role as AdminRole;
    if (!hasPermission(userRole, permission)) {
      return res.status(403).json({
        error: "Insufficient permissions",
        required: permission,
        role: userRole,
      });
    }

    next();
  };
};

// Middleware to check if user has any of the required permissions
export const requireAnyPermission = (permissions: Permission[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const userRole = req.user.role as AdminRole;
    const hasAccess = permissions.some((permission) =>
      hasPermission(userRole, permission)
    );

    if (!hasAccess) {
      return res.status(403).json({
        error: "Insufficient permissions",
        required: permissions,
        role: userRole,
      });
    }

    next();
  };
};

// Middleware to check if user has all required permissions
export const requireAllPermissions = (permissions: Permission[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const userRole = req.user.role as AdminRole;
    const hasAccess = permissions.every((permission) =>
      hasPermission(userRole, permission)
    );

    if (!hasAccess) {
      return res.status(403).json({
        error: "Insufficient permissions",
        required: permissions,
        role: userRole,
      });
    }

    next();
  };
};

// Middleware to restrict access to super admin only
export const requireSuperAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  if (req.user.role !== AdminRole.SUPER_ADMIN) {
    return res.status(403).json({
      error: "Super admin access required",
      role: req.user.role,
    });
  }

  next();
};
