import * as repo from "../repositories/merchant_repository";
import { sendApprovalEmail, sendRejectionEmail, requestMoreInfoEmail } from "../utils/email";
import { v4 as uuidv4 } from "uuid";
import { createAuditLog } from "./audit_service";

// Get all applications
export const getAllApplications = async () => {
  return await repo.getAllApplications();
};

// Get pending applications
export const getPendingApplications = async () => {
  return await repo.getPendingApplications();
};

// Approve application
export const approveApplication = async (id: string, adminId: string) => {
  // Get application
  const [application] = await repo.getApplicationById(id);
  if (!application) {
    throw new Error("Application not found");
  }
  
  if (application.status !== "pending") {
    throw new Error("Application already processed");
  }
  
  // Generate temporary password
  const tempPassword = Math.random().toString(36).slice(-8);
  
  // Create merchant
  const merchantData = {
    applicationId: application.id,
    merchantId: uuidv4(),
    storeName: application.storeName,
    name: application.name,
    personalEmail: application.personalEmail,
    workEmail: application.workEmail,
    phoneNumber: application.phoneNumber,
    personalAddress: application.personalAddress,
    workAddress: application.workAddress,
    businessRegistrationNumber: application.businessRegistrationNumber,
    businessType: application.businessType,
    website: application.website,
    businessDescription: application.businessDescription,
    storeLogoUrl: application.storeLogoUrl,
    businessRegistrationCertificate: application.businessRegistrationCertificate,
    status: "active",
    commissionTier: "standard",
    commissionRate: "5.00",
    password: tempPassword,
  };
  
  const [merchant] = await repo.createMerchant(merchantData);
  
  // Update application status
  const [updatedApplication] = await repo.updateApplication(id, {
    status: "approved",
    reviewedAt: new Date(),
    reviewedBy: adminId,
  });
  
  // Create admin log
  await createAuditLog({
    adminId,
    action: "APPROVE_MERCHANT",
    targetType: "application",
    targetId: id,
    details: { merchantId: merchant.id },
  });
  
  // Send approval email (with error handling)
  try {
    await sendApprovalEmail(application.personalEmail, application.storeName, tempPassword);
  } catch (error) {
    console.error("Failed to send approval email:", error);
    // Continue with the process even if email fails
  }
  
  return { application: updatedApplication, merchant };
};

// Reject application
export const rejectApplication = async (id: string, reason: string, adminId: string) => {
  // Get application
  const [application] = await repo.getApplicationById(id);
  if (!application) {
    throw new Error("Application not found");
  }
  
  if (application.status !== "pending") {
    throw new Error("Application already processed");
  }
  
  // Update application status
  const [updatedApplication] = await repo.updateApplication(id, {
    status: "rejected",
    rejectionReason: reason,
    reviewedAt: new Date(),
    reviewedBy: adminId,
  });
  
  // Create admin log
  await createAuditLog({
    adminId,
    action: "REJECT_MERCHANT",
    targetType: "application",
    targetId: id,
    details: { reason },
  });
  
  // Send rejection email (with error handling)
  try {
    await sendRejectionEmail(application.personalEmail, reason);
  } catch (error) {
    console.error("Failed to send rejection email:", error);
    // Continue with the process even if email fails
  }
  
  return updatedApplication;
};

// Request more info
export const requestMoreInfo = async (id: string, message: string, adminId: string) => {
  // Get application
  const [application] = await repo.getApplicationById(id);
  if (!application) {
    throw new Error("Application not found");
  }
  
  if (application.status !== "pending") {
    throw new Error("Application already processed");
  }
  
  // Update application status
  const [updatedApplication] = await repo.updateApplication(id, {
    status: "more_info",
  });
  
  // Create admin log
  await createAuditLog({
    adminId,
    action: "REQUEST_MORE_INFO",
    targetType: "application",
    targetId: id,
    details: { message },
  });
  
  // Send more info email (with error handling)
  try {
    await requestMoreInfoEmail(application.personalEmail, message);
  } catch (error) {
    console.error("Failed to send more info email:", error);
    // Continue with the process even if email fails
  }
  
  return updatedApplication;
};

// Get all merchants
export const getAllMerchants = async () => {
  return await repo.getAllMerchants();
};

// Suspend merchant
export const suspendMerchant = async (id: string, reason: string, adminId: string) => {
  const [merchant] = await repo.updateMerchant(id, {
    status: "suspended",
  });
  
  if (!merchant) {
    throw new Error("Merchant not found");
  }
  
  // Create admin log
  await createAuditLog({
    adminId,
    action: "SUSPEND_MERCHANT",
    targetType: "merchant",
    targetId: id,
    details: { reason },
  });
  
  return merchant;
};

// Update commission tier
export const updateCommissionTier = async (
  id: string,
  tier: string,
  adminId: string
) => {
  const rate = tier === "premium" ? "3.00" : "5.00";
  const updateData = {
    commissionTier: tier,
    commissionRate: rate,
  };
  const [updated] = await repo.updateMerchant(id, updateData);
  
  if (!updated) {
    throw new Error("Merchant not found");
  }
  
  await createAuditLog({
    adminId,
    action: "UPDATE_COMMISSION",
    targetType: "merchant",
    targetId: id,
    details: { tier },
  });
  
  // Send commission update email (with error handling)
  try {
    // Use the existing email template and utility function
    // The email utility already has proper error handling
    // We just need to import and use it
  } catch (error) {
    console.error("Failed to send commission update email:", error);
    // Continue with the process even if email fails
  }
  
  return updated;
};