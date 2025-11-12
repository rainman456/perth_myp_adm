// Database configuration for Neon PostgreSQL using Drizzle ORM
/*
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// Ensure DATABASE_URL is set in environment variables
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

// Create Neon SQL client
const sql = neon(process.env.DATABASE_URL);

// Initialize Drizzle ORM with the Neon client
export const db = drizzle(sql);

*/
// import { neon } from "@neondatabase/serverless";
// //import { drizzle } from 'drizzle-orm/neon-http';
// import { drizzle } from "drizzle-orm/neon-serverless"; // Use neon-serverless instead of neon-http
// import { Pool } from "@neondatabase/serverless";
// import { merchants } from "../models/merchant";
// import { merchantApplication } from "../models/merchant_applications";
// import { adminLogs, admins } from "../models/admins";
// import { payouts } from "../models/payout";
// import { disputes } from "../models/dispute";
// import { returnRequests } from "../models/return_request";
// import { settings } from "../models/settings";
// import { users } from "../models/users";
// import { orderMerchantSplits } from "../models/order_merchant_split";
// import { merchantBankDetails } from "../models/bank_details";

// // Ensure DATABASE_URL is set in environment variables
// if (!process.env.DATABASE_URL) {
//   throw new Error("DATABASE_URL is not set");
// }

// // Create Neon SQL client
// //const sql = neon(process.env.DATABASE_URL, { fullResults: true }); // fullResults for compatibility
// // Initialize Drizzle ORM with the Neon client and schema
// const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// export const db = drizzle(pool, {
//   schema: {
//     merchantApplication,
//     merchants,
//     adminLogs,
//     admins,
//     payouts,
//     disputes,
//     returnRequests,
//     settings,
//     users,
//     orderMerchantSplits,
//     merchantBankDetails,
//   },
// });



import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import * as models from "../models"; // Single import for ALL models!

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const db = drizzle(pool, {
  schema: models, // Pass the entire models object—Drizzle handles it!
});