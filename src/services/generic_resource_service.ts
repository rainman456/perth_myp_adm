import * as genericRepo from "../repositories/generic_repository.js";
import { hasPermission, Permission, AdminRole } from "../types/roles.js";

// Map to specific services (extend for existing ones)
const specificServices = {
  merchants: () => import("./merchant_service.js"),
  categories: () => import("./category_service.js"),
  // ... add others like payouts, disputes, etc.
};

export const handleAction = async (
  action:
    | "list"
    | "search"
    | "create"
    | "show"
    | "update"
    | "delete"
    | "bulkDelete",
  modelName: string,
  params: {
    id?: string;
    query?: string;
    filters?: Record<string, any>;
    data?: Record<string, any>;
    ids?: string[];
  } = {},
  currentUser: { role: AdminRole }
) => {
  if (
    !hasPermission(currentUser.role, Permission.MANAGE_ALL_RESOURCES) &&
    currentUser.role !== AdminRole.SUPER_ADMIN
  ) {
    throw new Error("Insufficient permissions");
  }

  // Delegate to specific service if exists
  const specific = specificServices[modelName as keyof typeof specificServices];
if (specific) {
  const svcModule = await specific(); // Renamed for clarity
  // Use type guard or check existence
  if (action === "list" && typeof (svcModule as any).getAll === 'function') {
    return await (svcModule as any).getAll(params.filters);
  }
  // Add similar checks for other actions, e.g., if it's getAllMerchants:
  // if (action === "list" && typeof (svcModule as any).getAllMerchants === 'function') {
  //   return await (svcModule as any).getAllMerchants(params.filters);
  // }
}
  // Fallback to generic
  switch (action) {
    case "list":
      return await genericRepo.listRecords(modelName, params.filters);
    case "search":
      return await genericRepo.searchRecords(modelName, params.query!);
    case "create":
      return await genericRepo.createRecord(modelName, params.data!);
    case "show":
      return await genericRepo.getRecord(modelName, params.id!);
    case "update":
      return await genericRepo.updateRecord(
        modelName,
        params.id!,
        params.data!
      );
    case "delete":
      await genericRepo.deleteRecord(modelName, params.id!);
      return { success: true };
    case "bulkDelete":
      await genericRepo.bulkDeleteRecords(modelName, params.ids!);
      return { success: true, deleted: params.ids!.length };
    default:
      throw new Error(`Unsupported action: ${action}`);
  }
};
