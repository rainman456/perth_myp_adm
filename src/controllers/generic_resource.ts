import type { Request, Response } from "express";
import * as genericService from "../services/generic_resource_service.js";
import { logger } from "../utils/logger.js";

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
 *         schema: { type: string }
 *         description: Model name (e.g., users, merchants, products)
 *       - name: limit
 *         in: query
 *         schema: { type: integer, default: 50 }
 *       - name: offset
 *         in: query
 *         schema: { type: integer, default: 0 }
 *       - name: filters
 *         in: query
 *         schema: { type: object }
 *         description: Filter criteria (e.g., ?status=active&email=user@example.com)
 *     responses:
 *       200:
 *         description: List of records with metadata
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { type: array }
 *                 total: { type: integer }
 *                 limit: { type: integer }
 *                 offset: { type: integer }
 *       401: { description: Unauthorized }
 *       400: { description: Bad request }
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
 *         schema: { type: string }
 *       - name: q
 *         in: query
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { type: array }
 *                 count: { type: integer }
 *       400: { description: Missing search query }
 *       401: { description: Unauthorized }
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
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       201:
 *         description: New record
 *         content:
 *           application/json:
 *             schema: { type: object }
 *       400: { description: Validation error }
 *       401: { description: Unauthorized }
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
 *         schema: { type: string }
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Record details
 *         content:
 *           application/json:
 *             schema: { type: object }
 *       404: { description: Record not found }
 *       401: { description: Unauthorized }
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
 *         schema: { type: string }
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200:
 *         description: Updated record
 *         content:
 *           application/json:
 *             schema: { type: object }
 *       404: { description: Record not found }
 *       400: { description: Validation error }
 *       401: { description: Unauthorized }
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
 *         schema: { type: string }
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: Record deleted
 *       404: { description: Record not found }
 *       401: { description: Unauthorized }
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
 *         schema: { type: string }
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
 *                 items: { type: string }
 *                 minItems: 1
 *                 description: Array of record IDs to delete
 *     responses:
 *       200:
 *         description: Bulk delete result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 deleted: { type: integer }
 *       400: { description: Invalid IDs array }
 *       401: { description: Unauthorized }
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
