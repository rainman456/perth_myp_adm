// Role-based access control types and permissions

export enum AdminRole {
  SUPER_ADMIN = "super_admin",
  ADMIN = "admin",
  EDITOR = "editor",
  VIEWER = "viewer",
}

export enum Permission {
  // Merchant permissions
  VIEW_MERCHANTS = "view_merchants",
  EDIT_MERCHANTS = "edit_merchants",
  SUSPEND_MERCHANTS = "suspend_merchants",
  DELETE_MERCHANTS = "delete_merchants",

  // Application permissions
  VIEW_APPLICATIONS = "view_applications",
  APPROVE_APPLICATIONS = "approve_applications",
  REJECT_APPLICATIONS = "reject_applications",

  // Payout permissions
  VIEW_PAYOUTS = "view_payouts",
  PROCESS_PAYOUTS = "process_payouts",
  CANCEL_PAYOUTS = "cancel_payouts",

  // Order permissions
  VIEW_ORDERS = "view_orders",
  EDIT_ORDERS = "edit_orders",
  REFUND_ORDERS = "refund_orders",

  // Return & Dispute permissions
  VIEW_RETURNS = "view_returns",
  MANAGE_DISPUTES = "manage_disputes",
  APPROVE_REFUNDS = "approve_refunds",

  // Admin permissions
  VIEW_ADMINS = "view_admins",
  CREATE_ADMINS = "create_admins",
  EDIT_ADMINS = "edit_admins",
  DELETE_ADMINS = "delete_admins",

  // System permissions
  VIEW_LOGS = "view_logs",
  MANAGE_SETTINGS = "manage_settings",
  MANAGE_ALL_RESOURCES = "manage_all_resources",
}

export const RolePermissions: Record<AdminRole, Permission[]> = {
  [AdminRole.SUPER_ADMIN]: Object.values(Permission),
  [AdminRole.ADMIN]: [
    Permission.VIEW_MERCHANTS,
    Permission.EDIT_MERCHANTS,
    Permission.SUSPEND_MERCHANTS,
    Permission.VIEW_APPLICATIONS,
    Permission.APPROVE_APPLICATIONS,
    Permission.REJECT_APPLICATIONS,
    Permission.VIEW_PAYOUTS,
    Permission.PROCESS_PAYOUTS,
    Permission.VIEW_ORDERS,
    Permission.EDIT_ORDERS,
    Permission.REFUND_ORDERS,
    Permission.VIEW_RETURNS,
    Permission.MANAGE_DISPUTES,
    Permission.APPROVE_REFUNDS,
    Permission.VIEW_LOGS,
    Permission.MANAGE_ALL_RESOURCES,
  ],
  [AdminRole.EDITOR]: [
    Permission.VIEW_MERCHANTS,
    Permission.EDIT_MERCHANTS,
    Permission.VIEW_APPLICATIONS,
    Permission.VIEW_PAYOUTS,
    Permission.VIEW_ORDERS,
    Permission.EDIT_ORDERS,
  ],
  [AdminRole.VIEWER]: [
    Permission.VIEW_MERCHANTS,
    Permission.VIEW_APPLICATIONS,
    Permission.VIEW_PAYOUTS,
    Permission.VIEW_ORDERS,
  ],
};

export const hasPermission = (
  role: AdminRole,
  permission: Permission
): boolean => {
  return RolePermissions[role]?.includes(permission) || false;
};

export const hasAnyPermission = (
  role: AdminRole,
  permissions: Permission[]
): boolean => {
  return permissions.some((permission) => hasPermission(role, permission));
};

export const hasAllPermissions = (
  role: AdminRole,
  permissions: Permission[]
): boolean => {
  return permissions.every((permission) => hasPermission(role, permission));
};
