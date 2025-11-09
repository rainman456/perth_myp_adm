// ============ GENERIC RESOURCE SERVICE ============
// src/services/generic_resource_service.ts

import * as genericRepo from "../repositories/generic_repository.js";
import { hasPermission, Permission, AdminRole } from "../types/roles.js";
import { z } from "zod";

/**
 * Validation schemas for different models
 */
const validationSchemas: Record<string, z.ZodSchema> = {
  users: z.object({
    email: z.string().email().optional(),
    name: z.string().min(1).optional(),
    country: z.string().optional(),
  }),
  // merchants: z.object({
  //   storeName: z.string().min(1).optional(),
  //   status: z.enum(["active", "suspended"]).optional(),
  //   commissionRate: z.string().optional(),
  // }),
  categories: z.object({
    name: z.string().min(1).optional(),
    parentId: z.string().optional(),
  }),
  products: z.object({
    name: z.string().min(1).optional(),
    basePrice: z.string().optional(),
    categoryId: z.number().optional(),
  }),
  orders: z.object({
    status: z.enum(["Pending", "Completed", "Cancelled"]).optional(),
    currency: z.string().optional(),
  }),
  announcements: z.object({
    title: z.string().min(1).optional(),
    content: z.string().min(1).optional(),
  }),
};

/**
 * Sensitive fields to hide from responses (e.g., passwords)
 */
const sensitiveFields: Record<string, string[]> = {
  users: ['password', 'googleId'],  // Hide sensitive user data
  merchants: ['password', 'bankAccountNumber', 'pin'],  // Example; adjust as needed
  admins: ['password', 'hashedPassword'],  // If admins have passwords
  // Add more models as needed, e.g.:
  // payouts: ['bankAccountNumber'],
  // disputes: ['internalNotes'],
};

/**
 * Sanitize a single record by removing sensitive fields
 */
const sanitizeRecord = (modelName: string, record: Record<string, any>): Record<string, any> => {
  const fieldsToHide = sensitiveFields[modelName] || [];
  const sanitized = { ...record };
  fieldsToHide.forEach((field) => {
    delete sanitized[field];
  });
  return sanitized;
};

/**
 * Sanitize an array of records
 */
const sanitizeRecords = (modelName: string, records: Record<string, any>[]): Record<string, any>[] => {
  return records.map((record) => sanitizeRecord(modelName, record));
};

/**
 * Coerce ID-related values to numbers (assuming integer IDs from schema)
 */
const coerceIds = (data: Record<string, any> | string | string[] | undefined): any => {
  if (typeof data === 'string') {
    const num = Number(data);
    return isNaN(num) ? null : num;
  }
  if (Array.isArray(data)) {
    return data.map((id) => {
      const num = Number(id);
      return isNaN(num) ? null : num;
    }).filter((id): id is number => id !== null);
  }
  if (data && typeof data === 'object') {
    const coerced: Record<string, any> = { ...data };
    // Coerce 'id' and any '*Id' fields
    Object.keys(coerced).forEach((key) => {
      if (key === 'id' || key.endsWith('Id')) {
        coerced[key] = coerceIds(coerced[key]);
      }
    });
    return coerced;
  }
  return data;
};

/**
 * Validate input data against schema
 */
const validateInput = (modelName: string, data: Record<string, any>) => {
  const schema = validationSchemas[modelName];
  if (!schema) return data; // No validation for this model

  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Validation error: ${error.errors.map((e) => e.message).join(", ")}`
      );
    }
    throw error;
  }
};

/**
 * Check if user has permission to perform action on model
 */
const checkPermission = (
  userRole: AdminRole,
  action: string,
  modelName: string
) => {
  // Super admin can do everything
  if (userRole === AdminRole.SUPER_ADMIN) return true;

  // Admin can manage most resources except settings
  if (userRole === AdminRole.ADMIN && modelName !== "settings") return true;

  // Editor has limited access
  if (
    userRole === AdminRole.EDITOR &&
    ["disputes", "announcements", "return_requests"].includes(modelName)
  ) {
    return true;
  }

  return false;
};

/**
 * Models that require specific service handlers
 */
const specificServices = {
  merchants: () => import("../services/merchant_service.js"),
  categories: () => import("../services/category_service.js"),
 // products: () => import("../services/product_service.js"),
  // Add other specific services as needed
};

type ActionType =
  | "list"
  | "search"
  | "create"
  | "show"
  | "update"
  | "delete"
  | "bulkDelete";

interface ActionParams {
  id?: string;
  query?: string;
  filters?: Record<string, any>;
  data?: Record<string, any>;
  ids?: string[];
  limit?: number;
  offset?: number;
  searchFields?: string[];
  soft?: boolean;
}

/**
 * Main handler for all generic admin actions
 */
export const handleAction = async (
  action: ActionType,
  modelName: string,
  params: ActionParams = {},
  currentUser: { role: AdminRole }
): Promise<any> => {
  // Permission check
  if (!checkPermission(currentUser.role, action, modelName)) {
    throw new Error(
      `User role '${currentUser.role}' does not have permission to ${action} ${modelName}`
    );
  }

  // Check if model exists
  const availableModels = genericRepo.getAvailableModels();
  if (!availableModels.includes(modelName)) {
    throw new Error(
      `Model '${modelName}' not found. Available models: ${availableModels.join(", ")}`
    );
  }

  // Try to delegate to specific service if available
  const specificService = (
    specificServices as Record<
      string,
      () => Promise<any>
    >
  )[modelName];

  if (specificService) {
    try {
      const svcModule = await specificService();

      // Map actions to service methods
      const methodMap: Record<ActionType, string[]> = {
        list: ["getAll", "list"],
        search: ["search"],
        create: ["create"],
        show: ["getById", "findById", "get"],
        update: ["update"],
        delete: ["delete", "remove"],
        bulkDelete: ["bulkDelete", "deleteMany"],
      };

      const possibleMethods = methodMap[action];
      for (const method of possibleMethods) {
        if (typeof (svcModule as any)[method] === "function") {
          // Call specific service method (assume specific services handle sanitization)
          switch (action) {
            case "list":
              return await (svcModule as any)[method](
                params.filters,
                params.limit,
                params.offset
              );
            case "search":
              return await (svcModule as any)[method](params.query);
            case "create":
              return await (svcModule as any)[method](params.data);
            case "show":
              return await (svcModule as any)[method](params.id);
            case "update":
              return await (svcModule as any)[method](params.id, params.data);
            case "delete":
              return await (svcModule as any)[method](params.id);
            case "bulkDelete":
              return await (svcModule as any)[method](params.ids);
          }
        }
      }
    } catch (error) {
      // If specific service fails, fall through to generic
      console.warn(
        `Specific service failed for ${modelName}:`,
        error instanceof Error ? error.message : error
      );
    }
  }

  // Fallback to generic repository
  return await handleGenericAction(action, modelName, params);
};

/**
 * Handle generic CRUD operations
 */
const handleGenericAction = async (
  action: ActionType,
  modelName: string,
  params: ActionParams
): Promise<any> => {
  switch (action) {
    case "list": {
      const coercedFilters = coerceIds(params.filters);
      const records = await genericRepo.listRecords(
        modelName,
        coercedFilters,
        params.limit || 50,
        params.offset || 0
      );
      const total = await genericRepo.countRecords(
        modelName,
        coercedFilters
      );
      const sanitizedRecords = sanitizeRecords(modelName, records);
      return {
        data: sanitizedRecords,
        total,
        limit: params.limit || 50,
        offset: params.offset || 0,
      };
    }

    case "search": {
      if (!params.query) {
        throw new Error("Search query is required");
      }
      const results = await genericRepo.searchRecords(
        modelName,
        params.query,
        params.searchFields
      );
      return sanitizeRecords(modelName, results);
    }

    case "create": {
      if (!params.data || Object.keys(params.data).length === 0) {
        throw new Error("Data is required for creation");
      }
      const validatedData = validateInput(modelName, params.data);
      const created = await genericRepo.createRecord(modelName, validatedData);
      return sanitizeRecord(modelName, created);
    }

    case "show": {
      if (!params.id) {
        throw new Error("ID is required");
      }
      const numId = Number(params.id);
      if (isNaN(numId)) {
        throw new Error("Invalid ID format");
      }
      const record = await genericRepo.getRecord(modelName, numId.toString());  // Repo expects string; adjust if repo updated
      if (!record) {
        throw new Error(`Record with id '${params.id}' not found`);
      }
      return sanitizeRecord(modelName, record);
    }

    case "update": {
      if (!params.id) {
        throw new Error("ID is required");
      }
      if (!params.data || Object.keys(params.data).length === 0) {
        throw new Error("Data is required for update");
      }

      const numId = Number(params.id);
      if (isNaN(numId)) {
        throw new Error("Invalid ID format");
      }

      // Check if record exists
      const existing = await genericRepo.getRecord(modelName, params.id);
      if (!existing) {
        throw new Error(`Record with id '${params.id}' not found`);
      }

      const validatedData = validateInput(modelName, params.data);
      const updated = await genericRepo.updateRecord(
        modelName,
        params.id,
        validatedData
      );

      if (!updated) {
        throw new Error("Failed to update record");
      }
      return sanitizeRecord(modelName, updated);
    }

    case "delete": {
      if (!params.id) {
        throw new Error("ID is required");
      }

      const numId = Number(params.id);
      if (isNaN(numId)) {
        throw new Error("Invalid ID format");
      }

      // Check if record exists
      const existing = await genericRepo.getRecord(modelName, params.id);
      if (!existing) {
        throw new Error(`Record with id '${params.id}' not found`);
      }

      await genericRepo.deleteRecord(
        modelName,
        params.id,
        params.soft !== false // Default to soft delete
      );
      return { success: true, id: params.id };
    }

    case "bulkDelete": {
      if (!params.ids || params.ids.length === 0) {
        throw new Error("IDs array is required and cannot be empty");
      }

      const numIds = params.ids
        .map(id => Number(id))
        .filter(num => !isNaN(num));

      if (numIds.length === 0) {
        throw new Error("No valid IDs provided");
      }

      const result = await genericRepo.bulkDeleteRecords(
        modelName,
        numIds.map(String),  // Repo expects strings
        params.soft !== false
      );
      return result;
    }

    default:
      throw new Error(`Unsupported action: ${action}`);
  }
};

/**
 * Get info about a model
 */
export const getModelInfo = async (modelName: string) => {
  const availableModels = genericRepo.getAvailableModels();

  if (!availableModels.includes(modelName)) {
    throw new Error(`Model '${modelName}' not found`);
  }

  const schema = validationSchemas[modelName];
  const hiddenFields = sensitiveFields[modelName] || [];

  return {
    name: modelName,
    hasValidation: !!schema,
    hiddenFields,  // Expose for frontend awareness (optional)
    availableModels,
  };
};