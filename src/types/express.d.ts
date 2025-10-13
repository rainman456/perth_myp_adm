import { AdminRole } from "./roles"; // Adjust path if needed

declare module "express" {
  interface Request {
    user?: {
      id: string;
      role: AdminRole; // Now matches enum
      email: string;
      username: string;
    };
  }
}
