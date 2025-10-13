import nodemailer from "nodemailer";
import {
  applicationApprovedTemplate,
  applicationRejectedTemplate,
  moreInfoRequestTemplate,
  payoutInitiatedTemplate,
  payoutCompletedTemplate,
  payoutFailedTemplate,
  merchantSuspendedTemplate,
  weeklyPayoutSummaryTemplate,
} from "./email-templates.js";

// Email configuration - optional in development
const emailEnabled = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
if (!emailEnabled) {
  console.warn("Email service disabled: SMTP credentials not configured");
}

// Configure Nodemailer transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.example.com",
  port: Number.parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendApprovalEmail = async (
  email: string,
  storeName: string,
  tempPassword: string
) => {
  if (!emailEnabled) {
    console.log(`[Email Disabled] Would send approval email to ${email}`);
    return;
  }

  const loginUrl =
    process.env.MERCHANT_LOGIN_URL || "https://yourplatform.com/merchant/login";

  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: email,
    subject: `🎉 Your ${storeName} Application Has Been Approved!`,
    html: applicationApprovedTemplate(storeName, email, tempPassword, loginUrl),
  };

  await transporter.sendMail(mailOptions);
};

export const sendRejectionEmail = async (email: string, reason: string) => {
  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: email,
    subject: "Merchant Application Status Update",
    html: applicationRejectedTemplate("Applicant", reason),
  };

  await transporter.sendMail(mailOptions);
};

export const requestMoreInfoEmail = async (email: string, message: string) => {
  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: email,
    subject: "Additional Information Required - Merchant Application",
    html: moreInfoRequestTemplate("Applicant", message),
  };

  await transporter.sendMail(mailOptions);
};

export const sendPayoutNotificationEmail = async (
  email: string,
  storeName: string,
  amount: number
) => {
  const reference = `PAY-${Date.now()}`;

  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: email,
    subject: `💰 Payout Initiated - ${storeName}`,
    html: payoutInitiatedTemplate(storeName, amount, reference),
  };

  await transporter.sendMail(mailOptions);
};

export const sendPayoutFailedEmail = async (
  email: string,
  storeName: string,
  amount: number,
  reason: string
) => {
  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: email,
    subject: `⚠️ Payout Failed - ${storeName}`,
    html: payoutFailedTemplate(storeName, amount, reason),
  };

  await transporter.sendMail(mailOptions);
};

export const sendPayoutCompletedEmail = async (
  email: string,
  storeName: string,
  amount: number
) => {
  const reference = `PAY-${Date.now()}`;

  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: email,
    subject: `✅ Payout Completed - ${storeName}`,
    html: payoutCompletedTemplate(storeName, amount, reference),
  };

  await transporter.sendMail(mailOptions);
};

export const sendMerchantSuspendedEmail = async (
  email: string,
  storeName: string,
  reason: string
) => {
  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: email,
    subject: `Account Status Update - ${storeName}`,
    html: merchantSuspendedTemplate(storeName, reason),
  };

  await transporter.sendMail(mailOptions);
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
    from: process.env.SMTP_FROM,
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

  await transporter.sendMail(mailOptions);
};
