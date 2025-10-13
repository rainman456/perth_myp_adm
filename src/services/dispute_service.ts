// Dispute logic
/*
import * as repo from '../repositories/dispute_repository';
import * as orderRepo from '../repositories/order_repository';
import { createAdminLog } from '../repositories/merchant_repository';
import { stripe } from '../utils/external';
import { mockEmailService } from '../utils/email';

// Get all disputes
export const getAllDisputes = async () => repo.getAllDisputes();

// Get dispute
export const getDispute = async (id: string) => (await repo.getDisputeById(id))[0];

// Create dispute (customer requests return)
export const createDispute = async (data: any) => {
  const dispute = await repo.createDispute(data);
  // Notify merchant
  mockEmailService.notifyMerchantNewDispute(data.merchantId, data.orderId);
  return dispute;
};

// Review dispute (merchant)
export const reviewDispute = async (id: string, updates: any, merchantId: string) => {
  const dispute = await getDispute(id);
  if (dispute.merchantId !== merchantId) throw new Error('Unauthorized');
  // Update status to accepted/rejected
  const updated = await repo.updateDispute(id, updates);
  if (updates.status === 'resolved') {
    // If accepted, auto refund?
    await approveRefund(id, merchantId, true); // Merchant approved refund
  }
  return updated;
};

// Escalate dispute (admin)
export const escalateDispute = async (id: string, adminId: string) => {
  const updated = await repo.updateDispute(id, { status: 'in_review' });
  await createAdminLog({ adminId, action: 'ESCALATE_DISPUTE', targetType: 'dispute', targetId: id });
  return updated;
};

// Approve refund (admin or merchant)
export const approveRefund = async (id: string, approverId: string, isMerchant = false) => {
  const dispute = await getDispute(id);
  if (dispute.status !== 'open' && dispute.status !== 'in_review') throw new Error('Invalid status');

  const order = await orderRepo.getOrderById(dispute.orderId);
  // Process refund via payment provider
  await stripe.refunds.create({ payment_intent: order.paymentIntentId });

  // Update order status
  await orderRepo.updateOrder(dispute.orderId, { status: 'refunded' });

  // Restock inventory
  const product = await orderRepo.getProductById(order.productId);
  const newStock = product.stock + order.quantity;
  await orderRepo.updateProductStock(order.productId, newStock);

  // Update dispute
  const updatedDispute = await repo.updateDispute(id, { status: 'resolved', resolution: 'refund_approved', resolvedAt: new Date() });

  // Log action if admin
  if (!isMerchant) {
    await createAdminLog({ adminId: approverId, action: 'APPROVE_REFUND', targetType: 'dispute', targetId: id, details: { amount: order.totalAmount } });
  }

  // Notify customer
  mockEmailService.notifyCustomerRefundApproved(dispute.customerId, dispute.orderId);

  return { dispute: updatedDispute, order };
};
*/