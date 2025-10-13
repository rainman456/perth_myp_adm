import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  out: "./migrations",
  //schema: "./src/models/*.ts", // Updated to multiple files
  schema: [
    //"./src/models/merchant.ts",
    "./src/models/admins.ts",
  ],
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
    // Key: Only migrate the 'merchant' table (ignores merchant_application)
  // // Optional: Add if you want verbose output for debugging
   verbose: true,

});
