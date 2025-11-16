import nodemailer from "nodemailer";
import { config } from "../config/index";
import {
  applicationApprovedTemplate,
  applicationRejectedTemplate,
  moreInfoRequestTemplate,
  payoutInitiatedTemplate,
  payoutCompletedTemplate,
  payoutFailedTemplate,
  merchantSuspendedTemplate,
  weeklyPayoutSummaryTemplate,
} from "./email-templates";

// Email configuration - optional in development
const emailEnabled = config.smtp.enabled;
if (!emailEnabled) {
  console.warn("Email service disabled: SMTP credentials not configured");
}

// Configure Nodemailer transport with proper TLS and timeout settings
const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.secure, // true for port 465, false for 587
  auth: emailEnabled ? {
    user: config.smtp.user,
    pass: config.smtp.pass,
  } : undefined,
  connectionTimeout: config.smtp.connectionTimeout, // 5 seconds
  socketTimeout: config.smtp.socketTimeout, // 5 seconds
});

// Function to safely send emails with error handling
const safeSendMail = async (mailOptions: any) => {
  if (!emailEnabled) {
    console.log(`[Email Disabled] Would send email to ${mailOptions.to}`);
    return;
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${mailOptions.to} (Message ID: ${info.messageId})`);
  } catch (error: any) {
    console.error(`Failed to send email to ${mailOptions.to}:`);
    console.error(`  Error: ${error.message}`);
    if (error.code) {
      console.error(`  Code: ${error.code}`);
    }
    if (error.response) {
      console.error(`  Response: ${error.response}`);
    }
    // Don't throw the error to prevent breaking the main application flow
  }
};

export const sendApprovalEmail = async (
  email: string,
  storeName: string,
  tempPassword: string
) => {
  const loginUrl =
    process.env.MERCHANT_LOGIN_URL || "https://yourplatform.com/merchant/login";

  const mailOptions = {
    from: process.env.SMTP_FROM || "noreply@yourplatform.com",
    to: email,
    subject: `🎉 Your ${storeName} Application Has Been Approved!`,
    html: applicationApprovedTemplate(storeName, email, tempPassword, loginUrl),
  };

  await safeSendMail(mailOptions);
};

export const sendRejectionEmail = async (email: string, reason: string) => {
  const mailOptions = {
    from: process.env.SMTP_FROM || "noreply@yourplatform.com",
    to: email,
    subject: "Merchant Application Status Update",
    html: applicationRejectedTemplate("Applicant", reason),
  };

  await safeSendMail(mailOptions);
};

export const requestMoreInfoEmail = async (email: string, message: string) => {
  const mailOptions = {
    from: process.env.SMTP_FROM || "noreply@yourplatform.com",
    to: email,
    subject: "Additional Information Required - Merchant Application",
    html: moreInfoRequestTemplate("Applicant", message),
  };

  await safeSendMail(mailOptions);
};

export const sendPayoutNotificationEmail = async (
  email: string,
  storeName: string,
  amount: number
) => {
  const reference = `PAY-${Date.now()}`;
  const mailOptions = {
    from: process.env.SMTP_FROM || "noreply@yourplatform.com",
    to: email,
    subject: `💰 Payout Initiated - ${storeName}`,
    html: payoutInitiatedTemplate(storeName, amount, reference),
  };

  await safeSendMail(mailOptions);
};

export const sendPayoutFailedEmail = async (
  email: string,
  storeName: string,
  amount: number,
  reason: string
) => {
  const mailOptions = {
    from: process.env.SMTP_FROM || "noreply@yourplatform.com",
    to: email,
    subject: `⚠️ Payout Failed - ${storeName}`,
    html: payoutFailedTemplate(storeName, amount, reason),
  };

  await safeSendMail(mailOptions);
};

export const sendPayoutCompletedEmail = async (
  email: string,
  storeName: string,
  amount: number
) => {
  const reference = `PAY-${Date.now()}`;

  const mailOptions = {
    from: process.env.SMTP_FROM || "noreply@yourplatform.com",
    to: email,
    subject: `✅ Payout Completed - ${storeName}`,
    html: payoutCompletedTemplate(storeName, amount, reference),
  };

  await safeSendMail(mailOptions);
};

export const sendMerchantSuspendedEmail = async (
  email: string,
  storeName: string,
  reason: string
) => {
  const mailOptions = {
    from: process.env.SMTP_FROM || "noreply@yourplatform.com",
    to: email,
    subject: `Account Status Update - ${storeName}`,
    html: merchantSuspendedTemplate(storeName, reason),
  };

  await safeSendMail(mailOptions);
};

export const sendWeeklyPayoutSummary = async (
  email: string,
  storeName: string,
  data: {
    weekStart: string;
    weekEnd: string;
    totalSales: number;
    commission: number;
    netPayout: number;
    ordersCount: number;
  }
) => {
  const mailOptions = {
    from: process.env.SMTP_FROM || "noreply@yourplatform.com",
    to: email,
    subject: `📊 Weekly Payout Summary - ${storeName}`,
    html: weeklyPayoutSummaryTemplate(
      storeName,
      data.weekStart,
      data.weekEnd,
      data.totalSales,
      data.commission,
      data.netPayout,
      data.ordersCount
    ),
  };

  await safeSendMail(mailOptions);
};