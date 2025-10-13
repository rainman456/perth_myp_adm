import dotenv from "dotenv";

dotenv.config();

// Only DATABASE_URL is strictly required
if (!process.env.DATABASE_URL) {
  throw new Error("Missing environment variable: DATABASE_URL");
}

// Warn about optional but recommended variables
const optionalEnv = [
  "SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_FROM",
  "JWT_SECRET", "PAYSTACK_SECRET_KEY"
];

for (const env of optionalEnv) {
  if (!process.env[env]) {
    console.warn(`Warning: Missing optional environment variable: ${env}`);
  }
}

export const config = {
  env: process.env.NODE_ENV || "development",
  port: Number.parseInt(process.env.PORT || "5000"),
  jwt: {
    secret: process.env.JWT_SECRET || "default-dev-secret-change-in-production",
    expiresIn: "24h" as const,
  },
  smtp: {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number.parseInt(process.env.SMTP_PORT || "587"),
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.SMTP_FROM || "noreply@example.com",
    secure: process.env.SMTP_SECURE === "true",
    enabled: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
  },
  paystack: {
    secretKey: process.env.PAYSTACK_SECRET_KEY || "",
    webhookSecret: process.env.PAYSTACK_WEBHOOK_SECRET || process.env.PAYSTACK_SECRET_KEY || "",
    enabled: !!process.env.PAYSTACK_SECRET_KEY,
  },
  merchantApiWebhookUrl: process.env.MERCHANT_API_WEBHOOK_URL || "https://merchant-api.example.com/webhooks/paystack",
};
