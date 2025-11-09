import { db } from "../config/database.js";
import { eq, like, and, SQL, inArray, isNull, or, sql } from "drizzle-orm";
import { AnyPgTable, PgTable } from "drizzle-orm/pg-core";

// Import all models at once
import * as modelsModule from "../models/index.js";

// Type-safe model map
type ModelKey = keyof typeof modelsModule;
type TableType = typeof modelsModule[ModelKey]; // Fixed: Use typeof directly, not ReturnType

// Build model map from exports
const MODELS = {
  admins: modelsModule.admins,
 // announcements: modelsModule.announcements,
  bank_details: modelsModule.merchantBankDetails,
  //carts: modelsModule.carts,
  //cart_items: modelsModule.cartItems,
  categories: modelsModule.categories,
  disputes: modelsModule.disputes,
  //inventories: modelsModule.inventories,
 // media: modelsModule.medias,
  merchants: modelsModule.merchants,
  //orders: modelsModule.orders,
 // order_items: modelsModule.orderItems,
  order_merchant_splits: modelsModule.orderMerchantSplits,
 // payments: modelsModule.payments,
  payouts: modelsModule.payouts,
 // products: modelsModule.products,
  return_requests: modelsModule.returnRequests,
  settings: modelsModule.settings,
  users: modelsModule.users,
 // variants: modelsModule.variants,
} as const;

type ModelName = keyof typeof MODELS;

/**
 * Get model by name with type safety
 */
export const getModel = (modelName: string): AnyPgTable => {
  const model = MODELS[modelName as ModelName];
  if (!model) {
    throw new Error(`Model '${modelName}' not found. Available models: ${Object.keys(MODELS).join(", ")}`);
  }
  return model as AnyPgTable;
};

/**
 * Get model name from string (case-insensitive)
 */
const normalizeModelName = (name: string): ModelName => {
  const normalized = Object.keys(MODELS).find(
    (key) => key.toLowerCase() === name.toLowerCase()
  );
  if (!normalized) {
    throw new Error(`Model '${name}' not found`);
  }
  return normalized as ModelName;
};

/**
 * Check if a table has a soft delete column (deletedAt)
 */
const hasSoftDelete = (model: AnyPgTable): boolean => {
  return "deletedAt" in model;
};

/**
 * Exclude soft-deleted records from query
 */
const excludeSoftDeleted = (model: any): SQL | undefined => {
  if (hasSoftDelete(model)) {
    return isNull(model.deletedAt);
  }
  return undefined;
};


/**
 * List records with filtering and pagination
 */
export const listRecords = async (
  modelName: string,
  filters?: Record<string, any>,
  limit = 50,
  offset = 0
) => {
  const model = getModel(normalizeModelName(modelName));
  const conditions: SQL[] = [];

  // Add soft delete filter if applicable
  const softDeleteFilter = excludeSoftDeleted(model);
  if (softDeleteFilter) {
    conditions.push(softDeleteFilter);
  }

  // Add user filters
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined || value === null) return;

      const column = (model as any)[key];
      if (!column) {
        console.warn(`Field '${key}' not found in model '${modelName}'`);
        return;
      }

      if (typeof value === "string" && value.includes("%")) {
        conditions.push(like(column, value));
      } else if (Array.isArray(value)) {
        conditions.push(inArray(column, value));
      } else {
        conditions.push(eq(column, value));
      }
    });
  }

  let query = db.select().from(model);
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  return await query.limit(limit).offset(offset);
};

/**
 * Get record count for pagination
 */
export const countRecords = async (
  modelName: string,
  filters?: Record<string, any>
): Promise<number> => {
  const model = getModel(normalizeModelName(modelName));
  const conditions: SQL[] = [];

  const softDeleteFilter = excludeSoftDeleted(model);
  if (softDeleteFilter) {
    conditions.push(softDeleteFilter);
  }

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined || value === null) return;

      const column = (model as any)[key];
      if (!column) return;

      if (typeof value === "string" && value.includes("%")) {
        conditions.push(like(column, value));
      } else if (Array.isArray(value)) {
        conditions.push(inArray(column, value));
      } else {
        conditions.push(eq(column, value));
      }
    });
  }

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(model)
    .where(conditions.length > 0 ? and(...conditions) : undefined);
  return result[0]?.count || 0;
};

/**
 * Search records by field
 */
export const searchRecords = async (
  modelName: string,
  query: string,
  searchFields: string[] = []
) => {
  const model = getModel(normalizeModelName(modelName));

  if (searchFields.length === 0) {
    // Default search fields for common models
    const defaultFields: Record<string, string[]> = {
      merchants: ["storeName", "name", "personalEmail"],
      products: ["name", "description", "sku"],
      users: ["email", "name"],
      categories: ["name"],
      announcements: ["title", "content"],
    };
    searchFields = defaultFields[modelName] || ["name", "title", "email"];
  }

  const conditions: SQL[] = [];

  // Add soft delete filter
  const softDeleteFilter = excludeSoftDeleted(model);
  if (softDeleteFilter) {
    conditions.push(softDeleteFilter);
  }

  // Build search conditions for each field
  const searchConditions = searchFields
    .map((field) => {
      const column = (model as any)[field];
      return column ? like(column, `%${query}%`) : null;
    })
    .filter((cond) => cond !== null) as SQL[];

  if (searchConditions.length === 0) {
    throw new Error(
      `No valid search fields found in model '${modelName}'. Available: ${Object.keys(model).join(", ")}`
    );
  }

  conditions.push(or(...searchConditions) as any);

  let dbQuery = db.select().from(model);
  if (conditions.length > 0) {
    dbQuery = dbQuery.where(and(...conditions)) as any;
  }

  return await dbQuery;
};

/**
 * Create a new record
 */
export const createRecord = async <T extends AnyPgTable>(
  modelName: string,
  data: Record<string, any>
): Promise<T['_']['columns']> => {
  const model = getModel(normalizeModelName(modelName));

  const result = await db
    .insert(model)
    .values(data as any)
    .returning();

  if (!result[0]) {
    throw new Error("Failed to create record");
  }

  return result[0] as T['_']['columns'];
};

/**
 * Get a single record by ID
 */
export const getRecord = async <T extends AnyPgTable>(
  modelName: string,
  id: string
): Promise<T['_']['columns'] | null> => {
  const model = getModel(normalizeModelName(modelName));
  const idColumn = (model as any).id;

  if (!idColumn) {
    throw new Error(`Model '${modelName}' does not have an id column`);
  }

  const conditions: SQL[] = [eq(idColumn, id)];

  const softDeleteFilter = excludeSoftDeleted(model);
  if (softDeleteFilter) {
    conditions.push(softDeleteFilter);
  }

  const result = await db
    .select()
    .from(model)
    .where(and(...conditions));

  return (result[0] || null) as T['_']['columns'] | null;
};

/**
 * Update a record
 */
export const updateRecord = async <T extends AnyPgTable>(
  modelName: string,
  id: string,
  data: Record<string, any>
): Promise<T['_']['columns'] | null> => {
  const model = getModel(normalizeModelName(modelName));
  const idColumn = (model as any).id;

  if (!idColumn) {
    throw new Error(`Model '${modelName}' does not have an id column`);
  }

  // Add updatedAt if the model has it
  const dataWithTimestamp = {
    ...data,
    ...("updatedAt" in model && { updatedAt: new Date() }),
  };

  const result = await db
    .update(model)
    .set(dataWithTimestamp)
    .where(eq(idColumn, id))
    .returning();

  return (result[0] || null) as T['_']['columns'] | null;
};

/**
 * Delete a record (hard delete or soft delete if supported)
 */
export const deleteRecord = async (
  modelName: string,
  id: string,
  soft = true
) => {
  const model = getModel(normalizeModelName(modelName));
  const idColumn = (model as any).id;

  if (!idColumn) {
    throw new Error(`Model '${modelName}' does not have an id column`);
  }

  if (soft && hasSoftDelete(model)) {
    // Soft delete
    await db
      .update(model)
      .set({ deletedAt: new Date() })
      .where(eq(idColumn, id));
  } else {
    // Hard delete
    await db.delete(model).where(eq(idColumn, id));
  }
};

/**
 * Bulk delete records
 */
export const bulkDeleteRecords = async (
  modelName: string,
  ids: string[],
  soft = true
) => {
  if (!ids || ids.length === 0) {
    throw new Error("IDs array cannot be empty");
  }

  const model = getModel(normalizeModelName(modelName));
  const idColumn = (model as any).id;

  if (!idColumn) {
    throw new Error(`Model '${modelName}' does not have an id column`);
  }

  if (soft && hasSoftDelete(model)) {
    // Soft delete
    await db
      .update(model)
      .set({ deletedAt: new Date() })
      .where(inArray(idColumn, ids));
  } else {
    // Hard delete
    await db.delete(model).where(inArray(idColumn, ids));
  }

  return { deleted: ids.length, method: soft ? "soft" : "hard" };
};

/**
 * Get all available models
 */
export const getAvailableModels = (): string[] => {
  return Object.keys(MODELS);
};