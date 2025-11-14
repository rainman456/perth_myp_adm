import type { Request, Response } from "express";
import * as genericService from "../services/generic_resource_service";
import { logger } from "../utils/logger";

// Async handler wrapper to simplify error handling
const asyncHandler =
  (fn: (req: Request, res: Response) => Promise<Response | void>) =>
  (req: Request, res: Response) => {
    Promise.resolve(fn(req, res)).catch((error) => {
      const statusCode = (error as any).status || 500;
      const message = error.message || "Internal server error";
      logger.error(`[${req.method} ${req.path}] Error:`, {
        statusCode,
        message,
        error: error.stack,
      });
      res.status(statusCode).json({
        error: message,
        timestamp: new Date().toISOString(),
        path: req.path,
        ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
      });
    });
  };

/**
 * @swagger
 * /api/admin/{model}:
 *   get:
 *     summary: List records with pagination and filtering
 *     tags: [Admin Resources]
 *     security: [BearerAuth: []]
 *     parameters:
 *       - name: model
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           enum: [users, merchants, categories, disputes, return_requests, payouts, settings, bank_details, order_merchant_splits]
 *         description: Model name
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of records to return
 *       - name: offset
 *         in: query
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of records to skip
 *       - name: email
 *         in: query
 *         schema:
 *           type: string
 *         description: Filter users by email (users model only)
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *         description: Filter by status (merchants, disputes, return_requests, payouts models)
 *       - name: name
 *         in: query
 *         schema:
 *           type: string
 *         description: Filter by name (users, merchants, categories models)
 *       - name: storeName
 *         in: query
 *         schema:
 *           type: string
 *         description: Filter merchants by store name (merchants model only)
 *     responses:
 *       200:
 *         description: List of records with metadata
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 total:
 *                   type: integer
 *                   example: 100
 *                 limit:
 *                   type: integer
 *                   example: 50
 *                 offset:
 *                   type: integer
 *                   example: 0
 *             examples:
 *               UsersList:
 *                 summary: List of users
 *                 value:
 *                   data:
 *                     - id: 123
 *                       email: user@example.com
 *                       name: John Doe
 *                       country: Nigeria
 *                       createdAt: "2023-01-01T00:00:00Z"
 *                       updatedAt: "2023-01-01T00:00:00Z"
 *                     - id: 124
 *                       email: user2@example.com
 *                       name: Jane Smith
 *                       country: Ghana
 *                       createdAt: "2023-01-02T00:00:00Z"
 *                       updatedAt: "2023-01-02T00:00:00Z"
 *                   total: 100
 *                   limit: 2
 *                   offset: 0
 *               MerchantsList:
 *                 summary: List of merchants
 *                 value:
 *                   data:
 *                     - id: "merchant-uuid-1"
 *                       storeName: Tech Gadgets Store
 *                       name: John Doe
 *                       personalEmail: john@example.com
 *                       status: active
 *                       commissionRate: "5.00"
 *                       createdAt: "2023-01-01T00:00:00Z"
 *                       updatedAt: "2023-01-01T00:00:00Z"
 *                     - id: "merchant-uuid-2"
 *                       storeName: Fashion Store
 *                       name: Jane Smith
 *                       personalEmail: jane@example.com
 *                       status: suspended
 *                       commissionRate: "7.00"
 *                       createdAt: "2023-01-02T00:00:00Z"
 *                       updatedAt: "2023-01-02T00:00:00Z"
 *                   total: 50
 *                   limit: 2
 *                   offset: 0
 *               CategoriesList:
 *                 summary: List of categories
 *                 value:
 *                   data:
 *                     - id: 1
 *                       name: Electronics
 *                       parentId: null
 *                       attributes: {}
 *                       createdAt: "2023-01-01T00:00:00Z"
 *                     - id: 2
 *                       name: Clothing
 *                       parentId: null
 *                       attributes: {}
 *                       createdAt: "2023-01-02T00:00:00Z"
 *                   total: 20
 *                   limit: 50
 *                   offset: 0
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Unauthorized
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Model 'invalid_model' not found
 */
export const list = asyncHandler(async (req: Request, res: Response) => {
  const { model } = req.params;
  const { limit, offset, ...filters } = req.query;

  const result = await genericService.handleAction(
    "list",
    model,
    {
      filters: filters as Record<string, any>,
      limit: limit ? parseInt(limit as string) : 50,
      offset: offset ? parseInt(offset as string) : 0,
    },
    req.user!
  );

  logger.info(`Listed records for model: ${model}`, {
    limit: result.limit,
    offset: result.offset,
    total: result.total,
  });

  return res.json({ data: result.data, total: result.total, limit: result.limit, offset: result.offset });
});

/**
 * @swagger
 * /api/admin/{model}/search:
 *   get:
 *     summary: Search records (superadmin only)
 *     tags: [Admin Resources]
 *     security: [BearerAuth: []]
 *     parameters:
 *       - name: model
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           enum: [users, merchants, categories, disputes, return_requests, payouts, settings, bank_details, order_merchant_splits]
 *         description: Model name
 *       - name: q
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query text
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 count:
 *                   type: integer
 *                   example: 5
 *             examples:
 *               UserSearch:
 *                 summary: Search users
 *                 value:
 *                   data:
 *                     - id: 123
 *                       email: john@example.com
 *                       name: John Doe
 *                       country: Nigeria
 *                       createdAt: "2023-01-01T00:00:00Z"
 *                       updatedAt: "2023-01-01T00:00:00Z"
 *                     - id: 124
 *                       email: johnson@example.com
 *                       name: Johnson Smith
 *                       country: Ghana
 *                       createdAt: "2023-01-02T00:00:00Z"
 *                       updatedAt: "2023-01-02T00:00:00Z"
 *                   count: 2
 *               MerchantSearch:
 *                 summary: Search merchants
 *                 value:
 *                   data:
 *                     - id: "merchant-uuid-1"
 *                       storeName: Tech Gadgets Store
 *                       name: John Doe
 *                       personalEmail: john@example.com
 *                       status: active
 *                       commissionRate: "5.00"
 *                       createdAt: "2023-01-01T00:00:00Z"
 *                       updatedAt: "2023-01-01T00:00:00Z"
 *                   count: 1
 *       400:
 *         description: Missing search query
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Search query (q) is required
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Unauthorized
 */
export const search = asyncHandler(async (req: Request, res: Response) => {
  const { model } = req.params;
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ error: "Search query (q) is required" });
  }

  const result = await genericService.handleAction(
    "search",
    model,
    { query: q as string },
    req.user!
  );

  logger.info(`Searched model: ${model}`, {
    query: q,
    resultsCount: result.length,
  });

  return res.json({ data: result, count: result.length });
});

/**
 * @swagger
 * /api/admin/{model}:
 *   post:
 *     summary: Create record (superadmin only)
 *     tags: [Admin Resources]
 *     security: [BearerAuth: []]
 *     parameters:
 *       - name: model
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           enum: [users, merchants, categories, disputes, return_requests, payouts, settings, bank_details, order_merchant_splits]
 *         description: Model name
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - $ref: '#/components/schemas/UserCreate'
 *               - $ref: '#/components/schemas/MerchantCreate'
 *               - $ref: '#/components/schemas/CategoryCreate'
 *               - $ref: '#/components/schemas/DisputeCreate'
 *               - $ref: '#/components/schemas/ReturnRequestCreate'
 *               - $ref: '#/components/schemas/PayoutCreate'
 *               - $ref: '#/components/schemas/SettingsCreate'
 *           examples:
 *             User:
 *               summary: Create a user
 *               value:
 *                 email: user@example.com
 *                 name: John Doe
 *                 country: Nigeria
 *             Merchant:
 *               summary: Create a merchant
 *               value:
 *                 storeName: Tech Gadgets Store
 *                 name: Jane Smith
 *                 personalEmail: jane@example.com
 *                 workEmail: info@techgadgets.com
 *                 phoneNumber: "+2341234567890"
 *                 businessType: Retail
 *                 website: https://techgadgets.com
 *                 businessDescription: Selling the latest tech gadgets
 *                 businessRegistrationNumber: RC123456789
 *                 status: active
 *                 commissionTier: standard
 *                 commissionRate: "5.00"
 *             Category:
 *               summary: Create a category
 *               value:
 *                 name: Electronics
 *                 parentId: 1
 *                 attributes:
 *                   color: string
 *                   size: string
 *             Dispute:
 *               summary: Create a dispute
 *               value:
 *                 orderId: order-123
 *                 customerId: customer-123
 *                 merchantId: merchant-123
 *                 reason: Damaged product
 *                 description: Product arrived damaged
 *                 status: open
 *             ReturnRequest:
 *               summary: Create a return request
 *               value:
 *                 orderItemId: item-123
 *                 customerId: customer-123
 *                 reason: Wrong item received
 *                 description: I ordered a blue shirt but received a red one
 *                 status: pending
 *             Payout:
 *               summary: Create a payout
 *               value:
 *                 merchantId: merchant-123
 *                 amount: "1000.00"
 *                 status: Pending
 *                 payoutAccountId: account-123
 *             Settings:
 *               summary: Create/update settings
 *               value:
 *                 fees: "5.00"
 *                 taxRate: "0.00"
 *                 shippingOptions:
 *                   standard: "500.00"
 *                   express: "1000.00"
 *     responses:
 *       201:
 *         description: New record
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *             examples:
 *               User:
 *                 summary: Created user
 *                 value:
 *                   id: 123
 *                   email: user@example.com
 *                   name: John Doe
 *                   country: Nigeria
 *                   createdAt: "2023-01-01T00:00:00Z"
 *                   updatedAt: "2023-01-01T00:00:00Z"
 *               Merchant:
 *                 summary: Created merchant
 *                 value:
 *                   id: "merchant-uuid"
 *                   storeName: Tech Gadgets Store
 *                   name: Jane Smith
 *                   personalEmail: jane@example.com
 *                   workEmail: info@techgadgets.com
 *                   status: active
 *                   commissionTier: standard
 *                   commissionRate: "5.00"
 *                   createdAt: "2023-01-01T00:00:00Z"
 *                   updatedAt: "2023-01-01T00:00:00Z"
 *               Category:
 *                 summary: Created category
 *                 value:
 *                   id: 123
 *                   name: Electronics
 *                   parentId: 1
 *                   attributes:
 *                     color: string
 *                     size: string
 *                   createdAt: "2023-01-01T00:00:00Z"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Validation error: email must be a valid email
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Unauthorized
 */
export const create = asyncHandler(async (req: Request, res: Response) => {
  const { model } = req.params;

  const result = await genericService.handleAction(
    "create",
    model,
    { data: req.body },
    req.user!
  );

  logger.info(`Created record in model: ${model}`, {
    id: result.id,
  });

  return res.status(201).json(result);
});

/**
 * @swagger
 * /api/admin/{model}/{id}:
 *   get:
 *     summary: Show record (superadmin only)
 *     tags: [Admin Resources]
 *     security: [BearerAuth: []]
 *     parameters:
 *       - name: model
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           enum: [users, merchants, categories, disputes, return_requests, payouts, settings, bank_details, order_merchant_splits]
 *         description: Model name
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Record ID
 *     responses:
 *       200:
 *         description: Record details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *             examples:
 *               User:
 *                 summary: User details
 *                 value:
 *                   id: 123
 *                   email: user@example.com
 *                   name: John Doe
 *                   country: Nigeria
 *                   createdAt: "2023-01-01T00:00:00Z"
 *                   updatedAt: "2023-01-01T00:00:00Z"
 *               Merchant:
 *                 summary: Merchant details
 *                 value:
 *                   id: "merchant-uuid"
 *                   storeName: Tech Gadgets Store
 *                   name: Jane Smith
 *                   personalEmail: jane@example.com
 *                   workEmail: info@techgadgets.com
 *                   status: active
 *                   commissionTier: standard
 *                   commissionRate: "5.00"
 *                   createdAt: "2023-01-01T00:00:00Z"
 *                   updatedAt: "2023-01-01T00:00:00Z"
 *               Category:
 *                 summary: Category details
 *                 value:
 *                   id: 123
 *                   name: Electronics
 *                   parentId: 1
 *                   attributes:
 *                     color: string
 *                     size: string
 *                   createdAt: "2023-01-01T00:00:00Z"
 *       404:
 *         description: Record not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Record with id '123' not found
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Unauthorized
 */
export const show = asyncHandler(async (req: Request, res: Response) => {
  const { model, id } = req.params;

  const result = await genericService.handleAction(
    "show",
    model,
    { id },
    req.user!
  );

  if (!result) {
    return res.status(404).json({ error: "Record not found" });
  }

  logger.info(`Retrieved record from model: ${model}`, { id });

  return res.json(result);
});

/**
 * @swagger
 * /api/admin/{model}/{id}:
 *   patch:
 *     summary: Update record (superadmin only)
 *     tags: [Admin Resources]
 *     security: [BearerAuth: []]
 *     parameters:
 *       - name: model
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           enum: [users, merchants, categories, disputes, return_requests, payouts, settings, bank_details, order_merchant_splits]
 *         description: Model name
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Record ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - $ref: '#/components/schemas/UserUpdate'
 *               - $ref: '#/components/schemas/MerchantUpdate'
 *               - $ref: '#/components/schemas/CategoryUpdate'
 *               - $ref: '#/components/schemas/DisputeUpdate'
 *               - $ref: '#/components/schemas/ReturnRequestUpdate'
 *               - $ref: '#/components/schemas/PayoutUpdate'
 *               - $ref: '#/components/schemas/SettingsUpdate'
 *           examples:
 *             User:
 *               summary: Update a user
 *               value:
 *                 name: John Smith
 *                 country: Ghana
 *             Merchant:
 *               summary: Update a merchant
 *               value:
 *                 status: suspended
 *                 commissionRate: "7.00"
 *             Category:
 *               summary: Update a category
 *               value:
 *                 name: Updated Electronics
 *                 parentId: 2
 *             Dispute:
 *               summary: Update a dispute
 *               value:
 *                 status: resolved
 *                 resolution: Refunded
 *             ReturnRequest:
 *               summary: Update a return request
 *               value:
 *                 status: approved
 *                 merchantNotes: Approved for return
 *             Payout:
 *               summary: Update a payout
 *               value:
 *                 status: Completed
 *             Settings:
 *               summary: Update settings
 *               value:
 *                 fees: "7.00"
 *                 shippingOptions:
 *                   standard: "600.00"
 *                   express: "1200.00"
 *     responses:
 *       200:
 *         description: Updated record
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *             examples:
 *               User:
 *                 summary: Updated user
 *                 value:
 *                   id: 123
 *                   email: user@example.com
 *                   name: John Smith
 *                   country: Ghana
 *                   createdAt: "2023-01-01T00:00:00Z"
 *                   updatedAt: "2023-01-02T00:00:00Z"
 *               Merchant:
 *                 summary: Updated merchant
 *                 value:
 *                   id: "merchant-uuid"
 *                   storeName: Tech Gadgets Store
 *                   name: Jane Smith
 *                   status: suspended
 *                   commissionRate: "7.00"
 *                   updatedAt: "2023-01-02T00:00:00Z"
 *               Category:
 *                 summary: Updated category
 *                 value:
 *                   id: 123
 *                   name: Updated Electronics
 *                   parentId: 2
 *                   updatedAt: "2023-01-02T00:00:00Z"
 *       404:
 *         description: Record not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Record with id '123' not found
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Validation error: name is required
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Unauthorized
 */
export const update = asyncHandler(async (req: Request, res: Response) => {
  const { model, id } = req.params;

  const result = await genericService.handleAction(
    "update",
    model,
    { id, data: req.body },
    req.user!
  );

  if (!result) {
    return res.status(404).json({ error: "Record not found" });
  }

  logger.info(`Updated record in model: ${model}`, { id });

  return res.json(result);
});

/**
 * @swagger
 * /api/admin/{model}/{id}:
 *   delete:
 *     summary: Delete record (superadmin only)
 *     tags: [Admin Resources]
 *     security: [BearerAuth: []]
 *     parameters:
 *       - name: model
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           enum: [users, merchants, categories, disputes, return_requests, payouts, settings, bank_details, order_merchant_splits]
 *         description: Model name
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Record ID
 *     responses:
 *       204:
 *         description: Record deleted
 *       404:
 *         description: Record not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Record with id '123' not found
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Unauthorized
 */
export const del = asyncHandler(async (req: Request, res: Response) => {
  const { model, id } = req.params;

  const result = await genericService.handleAction(
    "delete",
    model,
    { id },
    req.user!
  );

  logger.info(`Deleted record in model: ${model}`, { id });

  return res.status(204).send();
});

/**
 * @swagger
 * /api/admin/{model}/bulk:
 *   delete:
 *     summary: Bulk delete (superadmin only)
 *     tags: [Admin Resources]
 *     security: [BearerAuth: []]
 *     parameters:
 *       - name: model
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           enum: [users, merchants, categories, disputes, return_requests, payouts, settings, bank_details, order_merchant_splits]
 *         description: Model name
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [ids]
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 minItems: 1
 *                 description: Array of record IDs to delete
 *           examples:
 *             UserBulkDelete:
 *               summary: Bulk delete users
 *               value:
 *                 ids: [1, 2, 3]
 *             MerchantBulkDelete:
 *               summary: Bulk delete merchants
 *               value:
 *                 ids: ["merchant-uuid-1", "merchant-uuid-2"]
 *     responses:
 *       200:
 *         description: Bulk delete result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 deleted:
 *                   type: integer
 *                   example: 3
 *       400:
 *         description: Invalid IDs array
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: IDs array is required and must not be empty
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Unauthorized
 */
export const bulkDelete = asyncHandler(async (req: Request, res: Response) => {
  const { model } = req.params;
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res
      .status(400)
      .json({ error: "IDs array is required and must not be empty" });
  }

  const result = await genericService.handleAction(
    "bulkDelete",
    model,
    { ids },
    req.user!
  );

  logger.info(`Bulk deleted records in model: ${model}`, {
    count: result.deleted,
  });

  return res.json({ success: true, ...result });
});
