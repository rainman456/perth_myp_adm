// Main router that mounts domain routers
/*
import { Express } from "express";
import { createServer } from "http";
import categoryRoutes from "./category";
//import disputeRoutes from "./dispute";
import merchantRoutes from "./merchants";
//import payoutRoutes from "./payout";
import settingsRoutes from "./settings";
//import announcementRoutes from "./announcement";
//import { requireAdmin } from "../middleware/auth";
import { loggingMiddleware } from "../middleware/logging";
//import { rateLimiter } from "../middleware/ratelimit";
import { stripeWebhook } from "../utils/external"; // For webhook handling
import { config } from '../config';  // Added: Missing import for config.port

export function registerRoutes(app: Express) {  // Removed 'async' (no awaits inside)
  // Apply global middleware
  app.use(loggingMiddleware);
//  app.use(rateLimiter);

  // Mount domain routes with admin auth
  app.use("/api/admin/categories",  categoryRoutes);
  //app.use("/api/admin/disputes", requireAdmin, disputeRoutes);
  app.use("/api/admin/merchants",  merchantRoutes);
  //app.use("/api/admin/payouts", requireAdmin, payoutRoutes);
  app.use("/api/admin/settings",  settingsRoutes);
  //app.use("/api/admin/announcements", requireAdmin, announcementRoutes);

  // Shared routes (e.g., for customers/merchants, with their auth)
  //app.use("/api/disputes", disputeRoutes); // Customer/merchant dispute actions

  // Payment webhook (no auth, but signature verification)
  app.post("/api/webhooks/stripe", stripeWebhook);

  // Error handler
  app.use((err: any, req: any, res: any, next: any) => {
    res.status(500).json({ message: "Internal Server Error" });
  });

  const port = config.port;
  const server = createServer(app);
  server.listen(port, () => console.log(`Server on port ${port}`));
  return server;
}
*/
import type { Express } from "express";
import adminRoutes from "./admin";
import categoryRoutes from "./category";
import merchantRoutes from "./merchants";
import settingsRoutes from "./settings";
import returnRoutes from "./returns";
import  payoutRoutes from "./payout"
//import authRoutes from "./auth"
import { requireAdmin } from "../middleware/auth";
import genericAdminRouter from "./generic_admin";
import banksRoutes from "./banks.routes";

//import { loggingMiddleware } from "../middleware/logging"
//import { stripeWebhook } from "../utils/external"

export function registerRoutes(app: Express) {
  //app.use(loggingMiddleware)

  //app.use("/api/auth", authRoutes)
  app.use("/admin", adminRoutes);
  app.use("/api/categories", requireAdmin, categoryRoutes);
  app.use("/api/merchants", requireAdmin, merchantRoutes);
  app.use("/api/settings", requireAdmin, settingsRoutes);
  app.use("/api/returns", returnRoutes);
  app.use("/api/admin", genericAdminRouter);
  app.use("/api/payouts", requireAdmin, payoutRoutes)
  app.use("/banks", banksRoutes);


  //app.post("/api/webhooks/stripe", stripeWebhook)

  app.get("/health", (req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    });
  });

  app.get("/api", (req, res) => {
    res.json({
      name: "Merchant Backend API",
      version: "1.0.0",
      endpoints: {
        auth: {
          "POST /api/login": "Admin login",
          "POST /api/admin": "Create admin user",
          "GET /api/auth/profile": "Get admin profile (requires auth)",
        },
        merchants: {
          "GET /api/merchants/applications": "Get all applications",
          "GET /api/merchants/applications/pending":
            "Get pending applications",
          "POST /api/merchants/applications/:id/approve":
            "Approve application",
          "POST /api/merchants/applications/:id/reject":
            "Reject application",
          "POST /api/merchants/applications/:id/more-info":
            "Request more info",
          "GET /api/merchants": "Get all merchants",
          "POST /api/merchants/:id/suspend": "Suspend merchant",
          "PUT /api/merchants/:id/commission": "Update commission tier",
        },
        categories: {
          "GET /api/categories": "Get all categories",
          "POST /api/categories": "Create category",
          "PUT /api/categories/:id": "Update category",
          "DELETE /api/categories/:id": "Delete category",
        },
        settings: {
          "GET /api/settings": "Get settings",
          "PUT /api/settings": "Update settings",
        },
        // webhooks: {
        //   "POST /api/webhooks/stripe": "Stripe webhook handler",
        // },
      },
    });
  });

  app.use((err: any, req: any, res: any, next: any) => {
    console.error("Error:", err);
    res.status(500).json({
      message: "Internal Server Error",
      ...(process.env.NODE_ENV === "development" && { error: err.message }),
    });
  });

  app.use("*", (req, res) => {
    res.status(404).json({ message: "Endpoint not found" });
  });
}
