// Merchant logic
/*
import * as repo from '../repositories/merchant_repository';
import { stripe } from '../utils/external';
import { mockEmailService } from '../utils/email';
import { v4 as uuid } from 'uuid';

// Get all applications
export const getAllApplications = async () => repo.getAllApplications();

// Get pending applications
export const getPendingApplications = async () => repo.getPendingApplications();

// Approve application
export const approveApplication = async (id: string, adminId: string) => {
  const application = (await repo.getApplicationById(id))[0];
  if (application.status !== 'pending') throw new Error('Already processed');

  // Create Stripe connected account for split settlements
  const stripeAccount = await stripe.accounts.create({
    type: 'express',
    email: application.workEmail,
    business_type: 'individual',
    // Add more details from application
  });

  // Create user account
  const tempPassword = uuid().slice(0, 8);
  const user = await repo.createUser({
    username: application.workEmail,
    email: application.workEmail,
    password: tempPassword, // Hash in production
    role: 'merchant',
  });

  // Create merchant
  const merchant = await repo.createMerchant({
    userId: user[0].id,
    applicationId: id,
    storeName: application.storeName,
    stripeAccountId: stripeAccount.id,
  });

  // Update application
  const updatedApp = await repo.updateApplication(id, { status: 'approved', reviewedAt: new Date(), reviewedBy: adminId });

  // Log action
  await repo.createAdminLog({ adminId, action: 'APPROVE_APPLICATION', targetType: 'application', targetId: id });

  // Send email with temp password
  mockEmailService.sendApprovalEmail(application.workEmail, application.storeName, tempPassword);

  return { application: updatedApp, merchant: merchant[0] };
};

// Reject application
export const rejectApplication = async (id: string, reason: string, adminId: string) => {
  const updatedApp = await repo.updateApplication(id, { status: 'rejected', rejectionReason: reason, reviewedAt: new Date(), reviewedBy: adminId });
  await repo.createAdminLog({ adminId, action: 'REJECT_APPLICATION', targetType: 'application', targetId: id });
  mockEmailService.sendRejectionEmail(updatedApp[0].workEmail, reason);
  return updatedApp;
};

// Request more info
export const requestMoreInfo = async (id: string, message: string, adminId: string) => {
  const updatedApp = await repo.updateApplication(id, { status: 'more_info', reviewedAt: new Date(), reviewedBy: adminId });
  await repo.createAdminLog({ adminId, action: 'REQUEST_MORE_INFO', targetType: 'application', targetId: id });
  mockEmailService.requestMoreInfoEmail(updatedApp[0].workEmail, message);
  return updatedApp;
};

// Get all merchants
export const getAllMerchants = async () => repo.getAllMerchants();

// Suspend merchant
export const suspendMerchant = async (id: string, reason: string, adminId: string) => {
  const updated = await repo.updateMerchant(id, { status: 'suspended' });
  await repo.createAdminLog({ adminId, action: 'SUSPEND_MERCHANT', targetType: 'merchant', targetId: id, details: { reason } });
  return updated;
};

// Update commission tier
export const updateCommissionTier = async (id: string, tier: string, adminId: string) => {
  const rate = tier === 'premium' ? '3.00' : '5.00'; // Example rates
  const updated = await repo.updateMerchant(id, { commissionTier: tier, commissionRate: rate });
  await repo.createAdminLog({ adminId, action: 'UPDATE_COMMISSION', targetType: 'merchant', targetId: id, details: { tier } });
  return updated;
};

// Create application (merchant submits)
export const createApplication = async (data: any) => {
  const application = await repo.createApplication({ ...data, id: uuid(), submittedAt: new Date() });
  // Notify admins
  mockEmailService.notifyAdminNewApplication(application.storeName, application.personalEmail);
  return application;
};

*/

// Merchant logic
// Merchant logic
import * as repo from "../repositories/merchant_repository";
import {
  sendApprovalEmail,
  sendRejectionEmail,
  requestMoreInfoEmail,
} from "../utils/email";
import { v4 as uuid } from "uuid";
import { db } from "../config/database";
import { merchants } from "../models/merchant";
import { merchantApplication } from "../models/merchant_applications";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import {
  MerchantInsert,
  MerchantApplicationUpdate,
  MerchantUpdate,
} from "../repositories/merchant_repository";
//import { adminLogs } from "../models/admins";
import { validate as uuidValidate } from "uuid";
import { admins } from "../models/admins";
import { config } from "../config";
import { merchantBankDetails } from "../models/bank_details";
import * as paystackService from "./paystack_service.js";

interface MerchantService {
  getAllMerchants?: (filters?: Record<string, any>) => Promise<any>;
  // Add other methods
}

// Get all applications
export const getAllApplications = async () => repo.getAllApplications();

// Get pending applications
export const getPendingApplications = async () => repo.getPendingApplications();

// Approve application

export const approveApplication = async (id: string, adminId: string) => {
  if (!uuidValidate(adminId)) {
    throw new Error("Invalid adminId: Must be a valid UUID");
  }

  const [admin] = await db
    .select()
    .from(admins)
    .where(eq(admins.id, adminId))
    .limit(1);
  if (!admin) {
    throw new Error(`Admin with ID ${adminId} does not exist`);
  }
  return await db.transaction(async (tx) => {
    const [application] = await tx
      .select()
      .from(merchantApplication)
      .where(eq(merchantApplication.id, id));

    if (!application || application.status !== "pending")
      throw new Error("Already processed");

    // Create transfer recipient using Paystack service
    // Note: This is a placeholder - actual bank details should come from the application
    // const recipient = await paystackService.createTransferRecipient({
    //   type: "nuban",
    //   name: application.name,
    //   account_number: "ACCOUNT_NUMBER",
    //   bank_code: "BANK_CODE",
    //   currency: "NGN",
    // });
    // Store recipient code in merchant_bank_details table

    const merchantId = uuid();
    const tempPassword = uuid().slice(0, 8);

    // Full denormalization with all fields (fixes missing lastPayoutDate, banner)
    const merchantData: MerchantInsert = {
      applicationId: id,
      merchantId,
      storeName: application.storeName,
      name: application.name,
      personalEmail: application.personalEmail,
      workEmail: application.workEmail,
      phoneNumber: application.phoneNumber,
      personalAddress: application.personalAddress,
      workAddress: application.workAddress,
      businessType: application.businessType,
      website: application.website,
      businessDescription: application.businessDescription,
      businessRegistrationNumber: application.businessRegistrationNumber,
      businessRegistrationCertificate:
        application.businessRegistrationCertificate,
      storeLogoUrl: application.storeLogoUrl,
      password: await bcrypt.hash(tempPassword, 10),
      //stripeAccountId: stripeAccount.id,
      accountId: "test-seeded-account-" + uuid(),
      status: "active",
      commissionTier: "standard",
      commissionRate: "5.00",
      accountBalance: "0.00",
      totalSales: "0.00",
      totalPayouts: "0.00",
      payoutSchedule: "weekly",
      lastPayoutDate: null, // Fixes missing property
      banner: null, // Fixes missing property
      policies: null,
    };

    // Create merchant (fixes overload with MerchantInsert type)
    const [merchant] = await tx
      .insert(merchants)
      .values(merchantData)
      .returning();

    // Update application status
    const updateData: MerchantApplicationUpdate = {
      status: "approved" as const,
      reviewedAt: new Date(),
      reviewedBy: adminId,
    };
    const [updatedApp] = await tx
      .update(merchantApplication)
      .set(updateData)
      .where(eq(merchantApplication.id, id))
      .returning();

    // Log action
    // await tx.insert(repo.adminLogs).values({
    //   adminId,
    //   action: "APPROVE_APPLICATION",
    //   targetType: "application",
    //   targetId: id,
    // });

    // Send email
    await sendApprovalEmail(
      application.workEmail,
      application.storeName,
      tempPassword
    );

    return { application: updatedApp, merchant };
  });
};

// Reject application
export const rejectApplication = async (
  id: string,
  reason: string,
  adminId: string
) => {
  const updateData: MerchantApplicationUpdate = {
    status: "rejected" as const,
    rejectionReason: reason,
    reviewedAt: new Date(),
    reviewedBy: adminId,
  };
  const [updatedApp] = await repo.updateApplication(id, updateData);
  await repo.createAdminLog({
    adminId,
    action: "REJECT_APPLICATION",
    targetType: "application",
    targetId: id,
    details: { reason },
  });
  await sendRejectionEmail(updatedApp.workEmail, reason);
  return updatedApp;
};

// Request more info
export const requestMoreInfo = async (
  id: string,
  message: string,
  adminId: string
) => {
  const updateData: MerchantApplicationUpdate = {
    status: "more_info" as const,
    rejectionReason: message,
    reviewedAt: new Date(),
    reviewedBy: adminId,
  };
  const [updatedApp] = await repo.updateApplication(id, updateData);
  await repo.createAdminLog({
    adminId,
    action: "REQUEST_MORE_INFO",
    targetType: "application",
    targetId: id,
    details: { message },
  });
  await requestMoreInfoEmail(updatedApp.workEmail, message);
  return updatedApp;
};

// Get all merchants
export const getAllMerchants = async () => repo.getAllMerchants();

// Suspend merchant
export const suspendMerchant = async (
  id: string,
  reason: string,
  adminId: string
) => {
  const updateData: MerchantUpdate = {
    status: "suspended" as const,
  };
  const [updated] = await repo.updateMerchant(id, updateData);
  await repo.createAdminLog({
    adminId,
    action: "SUSPEND_MERCHANT",
    targetType: "merchant",
    targetId: id,
    details: { reason },
  });
  return updated;
};

// Update commission tier
export const updateCommissionTier = async (
  id: string,
  tier: string,
  adminId: string
) => {
  const rate = tier === "premium" ? "3.00" : "5.00";
  const updateData: MerchantUpdate = {
    commissionTier: tier,
    commissionRate: rate,
  };
  const [updated] = await repo.updateMerchant(id, updateData);
  await repo.createAdminLog({
    adminId,
    action: "UPDATE_COMMISSION",
    targetType: "merchant",
    targetId: id,
    details: { tier },
  });
  return updated;
};
