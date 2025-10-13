// /*
// import {
//     type User,
//   type InsertUser,
//   type MerchantApplication,
//   type InsertMerchantApplication,
//   type Merchant,
//   type InsertMerchant,
//   type Product,
//   type InsertProduct,
//   type Order,
//   type InsertOrder,
//   type Dispute,
//   type InsertDispute,
//   type AdminLog,
//   type InsertAdminLog
//     // ...
//   } from "../models/schema";
//   import { randomUUID } from "crypto";

//   export interface IStorage {
//     // User operations
//     getUser(id: string): Promise<User | undefined>;
//     getUserByUsername(username: string): Promise<User | undefined>;
//     getUserByEmail(email: string): Promise<User | undefined>;
//     createUser(user: InsertUser): Promise<User>;
//     updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;

//     // Merchant Application operations
//     getMerchantApplication(id: string): Promise<MerchantApplication | undefined>;
//     getAllMerchantApplications(): Promise<MerchantApplication[]>;
//     getPendingMerchantApplications(): Promise<MerchantApplication[]>;
//     createMerchantApplication(application: InsertMerchantApplication): Promise<MerchantApplication>;
//     updateMerchantApplication(id: string, updates: Partial<MerchantApplication>): Promise<MerchantApplication | undefined>;

//     // Merchant operations
//     getMerchant(id: string): Promise<Merchant | undefined>;
//     getMerchantByUserId(userId: string): Promise<Merchant | undefined>;
//     getAllMerchants(): Promise<Merchant[]>;
//     createMerchant(merchant: InsertMerchant): Promise<Merchant>;
//     updateMerchant(id: string, updates: Partial<Merchant>): Promise<Merchant | undefined>;

//     // /* Commented out: Product, Order, Dispute, AdminLog operations not in focus */
//     // getProduct(id: string): Promise<Product | undefined>;
//     // ...

//     createAdminLog(log: InsertAdminLog): Promise<AdminLog>;
//     getAdminLogs(limit?: number): Promise<AdminLog[]>;
//     getAdminLogsByTarget(targetType: string, targetId: string): Promise<AdminLog[]>;
//   }

//   export class MemStorage implements IStorage {
//     private users: Map<string, User>;
//     private merchantApplications: Map<string, MerchantApplication>;
//     private merchants: Map<string, Merchant>;
//     // /* Commented out: Other maps not in focus */
//     // private products: Map<string, Product>;
//     // ...

//     constructor() {
//       this.users = new Map();
//       this.merchantApplications = new Map();
//       this.merchants = new Map();
//       // /* Commented out: Other initializations */
//       // this.products = new Map();
//       // ...

//       this.initializeSampleData();
//     }

//     private initializeSampleData() {
//       // Create admin user
//       const adminId = randomUUID();
//       const admin: User = {
//         id: adminId,
//         username: "admin",
//         password: "admin123", // In production, this would be hashed
//         email: "admin@vendorhub.com",
//         role: "admin",
//         createdAt: new Date(),
//       };
//       this.users.set(adminId, admin);
//     }

//     // User operations (kept as needed for approval)
//     async getUser(id: string): Promise<User | undefined> {
//       return this.users.get(id);
//     }

//     async getUserByUsername(username: string): Promise<User | undefined> {
//       return Array.from(this.users.values()).find(user => user.username === username);
//     }

//     async getUserByEmail(email: string): Promise<User | undefined> {
//       return Array.from(this.users.values()).find(user => user.email === email);
//     }

//     async createUser(insertUser: InsertUser): Promise<User> {
//       const id = randomUUID();
//       const user: User = {
//         ...insertUser,
//         id,
//         createdAt: new Date(),
//       };
//       this.users.set(id, user);
//       return user;
//     }

//     async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
//       const user = this.users.get(id);
//       if (!user) return undefined;

//       const updatedUser = { ...user, ...updates };
//       this.users.set(id, updatedUser);
//       return updatedUser;
//     }

//     // Merchant Application operations (focus)
//     async getMerchantApplication(id: string): Promise<MerchantApplication | undefined> {
//       return this.merchantApplications.get(id);
//     }

//     async getAllMerchantApplications(): Promise<MerchantApplication[]> {
//       return Array.from(this.merchantApplications.values()).sort(
//         (a, b) => new Date(b.submittedAt!).getTime() - new Date(a.submittedAt!).getTime()
//       );
//     }

//     async getPendingMerchantApplications(): Promise<MerchantApplication[]> {
//       return Array.from(this.merchantApplications.values())
//         .filter(app => app.status === "pending")
//         .sort((a, b) => new Date(b.submittedAt!).getTime() - new Date(a.submittedAt!).getTime());
//     }

//     async createMerchantApplication(insertApplication: InsertMerchantApplication): Promise<MerchantApplication> {
//       const id = randomUUID();
//       const application: MerchantApplication = {
//         ...insertApplication,
//         id,
//         status: "pending",
//         submittedAt: new Date(),
//         reviewedAt: null,
//         reviewedBy: null,
//         rejectionReason: null,
//       };
//       this.merchantApplications.set(id, application);
//       return application;
//     }

//     async updateMerchantApplication(id: string, updates: Partial<MerchantApplication>): Promise<MerchantApplication | undefined> {
//       const application = this.merchantApplications.get(id);
//       if (!application) return undefined;

//       const updatedApplication = { ...application, ...updates };
//       this.merchantApplications.set(id, updatedApplication);
//       return updatedApplication;
//     }

//     // Merchant operations (needed for approval)
//     async getMerchant(id: string): Promise<Merchant | undefined> {
//       return this.merchants.get(id);
//     }

//     async getMerchantByUserId(userId: string): Promise<Merchant | undefined> {
//       return Array.from(this.merchants.values()).find(merchant => merchant.userId === userId);
//     }

//     async getAllMerchants(): Promise<Merchant[]> {
//       return Array.from(this.merchants.values()).sort(
//         (a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
//       );
//     }

//     async createMerchant(insertMerchant: InsertMerchant): Promise<Merchant> {
//       const id = randomUUID();
//       const merchant: Merchant = {
//         ...insertMerchant,
//         id,
//         status: "active",
//         totalSales: "0.00",
//         createdAt: new Date(),
//       };
//       this.merchants.set(id, merchant);
//       return merchant;
//     }

//     async updateMerchant(id: string, updates: Partial<Merchant>): Promise<Merchant | undefined> {
//       const merchant = this.merchants.get(id);
//       if (!merchant) return undefined;

//       const updatedMerchant = { ...merchant, ...updates };
//       this.merchants.set(id, updatedMerchant);
//       return updatedMerchant;
//     }

//     // /* Commented out: Product operations not in focus */
//     // async getProduct(id: string): Promise<Product | undefined> {
//     //   return this.products.get(id);
//     // }
//     // ...

//     // /* Commented out: Other operations (orders, disputes, etc.) */

//     async createAdminLog(insertLog: InsertAdminLog): Promise<AdminLog> {
//         const id = randomUUID();
//         const log: AdminLog = {
//           ...insertLog,
//           id,
//           timestamp: new Date(),
//         };
//         this.adminLogs.set(id, log);
//         return log;
//       }

//       async getAdminLogs(limit: number = 50): Promise<AdminLog[]> {
//         return Array.from(this.adminLogs.values())
//           .sort((a, b) => new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime())
//           .slice(0, limit);
//       }

//       async getAdminLogsByTarget(targetType: string, targetId: string): Promise<AdminLog[]> {
//         return Array.from(this.adminLogs.values())
//           .filter(log => log.targetType === targetType && log.targetId === targetId)
//           .sort((a, b) => new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime());
//       }
//   }

//   export const storage = new MemStorage();
