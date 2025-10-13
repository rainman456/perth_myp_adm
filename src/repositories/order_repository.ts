// Order queries using Drizzle
import { db } from "../config/database";
//import { orders, products } from "../models/order";
import { eq, and, inArray } from "drizzle-orm";

// Get order by ID
/*
export const getOrderById = async (id: string) => {
  return db.select().from(orders).where(eq(orders.id, id)).limit(1);
};

// Update order
export const updateOrder = async (id: string, data: any) => {
  return db.update(orders).set(data).where(eq(orders.id, id)).returning();
};

// Get product by ID
export const getProductById = async (id: string) => {
  return db.select().from(products).where(eq(products.id, id)).limit(1);
};

// Update product stock
export const updateProductStock = async (id: string, stock: number) => {
  return db
    .update(products)
    .set({ stock })
    .where(eq(products.id, id))
    .returning();
};

//getUnsettledOrders
export const getUnsettledOrders = async (merchantId: string) => {
  return db
    .select()
    .from(orders)
    .where(
      and(eq(orders.merchantId, merchantId), eq(orders.status, "delivered"))
    );
};

export const markOrdersSettled = async (orderIds: string[]) => {
  return db
    .update(orders)
    .set({ status: "settled" })
    .where(inArray(orders.id, orderIds))
    .returning();
};
*/