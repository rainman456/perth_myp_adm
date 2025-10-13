import { db } from "../config/database.js";
import { eq, like, and, SQL, inArray } from "drizzle-orm";
import { z } from "zod"; // For validation

// Dynamic import models (assume exported from models/index.ts or direct)
const getModel = (modelName: string) => {
  // Map string to imported model (extend as needed)
  const models = {
    admins: () => import("../models/admins.js").then((m) => m.admins),
    announcements: () =>
      import("../models/announcement.js").then((m) => m.announcements),
    bank_details: () =>
      import("../models/bank_details.js").then((m) => m.merchantBankDetails),
    carts: () => import("../models/cart.js").then((m) => m.carts),
    cart_items: () => import("../models/cart_item.js").then((m) => m.cartItems),
    categories: () => import("../models/category.js").then((m) => m.categories),
    disputes: () => import("../models/dispute.js").then((m) => m.disputes),
    inventories: () =>
      import("../models/inventory.js").then((m) => m.inventories),
    media: () => import("../models/media.js").then((m) => m.medias),
    merchants: () => import("../models/merchant.js").then((m) => m.merchants),
    merchant_applications: () =>
      import("../models/merchant_applications.js").then(
        (m) => m.merchantApplication,
      ),
    orders: () => import("../models/order.js").then((m) => m.orders),
    order_items: () =>
      import("../models/order_item.js").then((m) => m.orderItems),
    order_merchant_splits: () =>
      import("../models/order_merchant_split.js").then(
        (m) => m.orderMerchantSplits,
      ),
    payments: () => import("../models/payment.js").then((m) => m.payments),
    payouts: () => import("../models/payout.js").then((m) => m.payouts),
    products: () => import("../models/products.js").then((m) => m.products),
    //promotions: () => import("../models/promotion.js").then((m) => m.promotion),
    return_requests: () =>
      import("../models/return_request.js").then((m) => m.returnRequests),
    settings: () => import("../models/settings.js").then((m) => m.settings),
    users: () => import("../models/users.js").then((m) => m.users),
    variants: () => import("../models/variant.js").then((m) => m.variants),
  };
  const model = models[modelName as keyof typeof models];
  if (!model) throw new Error(`Model ${modelName} not supported`);
  return model();
};

export const listRecords = async (
  modelName: string,
  filters?: Record<string, any>,
  limit = 50,
) => {
  const Model = await getModel(modelName);
  let query = db.select().from(Model);
  if (filters) {
    const conditions: SQL[] = [];
    Object.entries(filters).forEach(([key, value]) => {
      const column = (Model as any)[key];
      if (column) {
        if (typeof value === "string" && value.includes("%")) {
          conditions.push(like(column, value));
        } else {
          conditions.push(eq(column, value));
        }
      }
    });
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
  }
  return await query.limit(limit);
};

export const searchRecords = async (
  modelName: string,
  query: string,
  field = "title",
) => {
  const Model = await getModel(modelName);
  const column = (Model as any)[field];
  if (!column) {
    throw new Error(`Field ${field} not found in model ${modelName}`);
  }
  return await db
    .select()
    .from(Model)
    .where(like(column, `%${query}%`));
};

export const createRecord = async (
  modelName: string,
  data: Record<string, any>,
) => {
  const Model = await getModel(modelName);
  const [result] = await db
    .insert(Model)
    .values(data as any)
    .returning();
  return result;
};

export const getRecord = async (modelName: string, id: string) => {
  const Model = await getModel(modelName);
  const idColumn = (Model as any).id;
  if (!idColumn) {
    throw new Error(`Model ${modelName} does not have an id column`);
  }
  const [result] = await db.select().from(Model).where(eq(idColumn, id));
  return result || null;
};

export const updateRecord = async (
  modelName: string,
  id: string,
  data: Record<string, any>,
) => {
  const Model = await getModel(modelName);
  const idColumn = (Model as any).id;
  if (!idColumn) {
    throw new Error(`Model ${modelName} does not have an id column`);
  }
  const [result] = await db
    .update(Model)
    .set(data)
    .where(eq(idColumn, id))
    .returning();
  return result || null;
};

export const deleteRecord = async (modelName: string, id: string) => {
  const Model = await getModel(modelName);
  const idColumn = (Model as any).id;
  if (!idColumn) {
    throw new Error(`Model ${modelName} does not have an id column`);
  }
  await db.delete(Model).where(eq(idColumn, id));
};

export const bulkDeleteRecords = async (modelName: string, ids: string[]) => {
  const Model = await getModel(modelName);
  const idColumn = (Model as any).id;
  if (!idColumn) {
    throw new Error(`Model ${modelName} does not have an id column`);
  }
  await db.delete(Model).where(inArray(idColumn, ids));
};
