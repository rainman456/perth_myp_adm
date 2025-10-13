import type { Request, Response } from "express";
import * as genericService from "../services/generic_resource_service.js";

/**
 * @swagger
 * /admin/{model}:
 *   get:
 *     summary: List records (superadmin only)
 *     tags: [Superadmin Resources]
 *     security: [AdminAuth: []]
 *     parameters:
 *       - in: path, name: model, required: true, schema: { type: string, enum: [admins, merchants, ...] }
 *     responses:
 *       200: { description: List of records }
 */
export const list = async (req: Request, res: Response) => {
  try {
    const result = await genericService.handleAction(
      "list",
      req.params.model,
      { filters: req.query },
      req.user!
    );
    res.json({ data: result });
  } catch (error: any) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

/**
 * @swagger
 * /admin/{model}/search:
 *   get:
 *     summary: Search records (superadmin only)
 *     parameters: [model, q: query string]
 *     responses: 200: { description: Search results }
 */
export const search = async (req: Request, res: Response) => {
  try {
    const result = await genericService.handleAction(
      "search",
      req.params.model,
      { query: req.query.q as string },
      req.user!
    );
    res.json({ data: result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * @swagger
 * /admin/{model}:
 *   post:
 *     summary: Create record (superadmin only)
 *     requestBody: { required: true, content: { application/json: { schema: { type: object } } } }
 *     responses: 201: { description: New record }
 */
export const create = async (req: Request, res: Response) => {
  try {
    const result = await genericService.handleAction(
      "create",
      req.params.model,
      { data: req.body },
      req.user!
    );
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * @swagger
 * /admin/{model}/{id}:
 *   get:
 *     summary: Show record (superadmin only)
 *     parameters: [model, id]
 *     responses: 200: { description: Record details }
 */
export const show = async (req: Request, res: Response) => {
  try {
    const result = await genericService.handleAction(
      "show",
      req.params.model,
      { id: req.params.id },
      req.user!
    );
    if (!result) return res.status(404).json({ error: "Record not found" });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * @swagger
 * /admin/{model}/{id}:
 *   patch:
 *     summary: Update record (superadmin only)
 *     requestBody: { ... }
 *     responses: 200: { description: Updated record }
 */
export const update = async (req: Request, res: Response) => {
  try {
    const result = await genericService.handleAction(
      "update",
      req.params.model,
      { id: req.params.id, data: req.body },
      req.user!
    );
    if (!result) return res.status(404).json({ error: "Record not found" });
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * @swagger
 * /admin/{model}/{id}:
 *   delete:
 *     summary: Delete record (superadmin only)
 *     responses: 204: { description: Deleted }
 */
export const del = async (req: Request, res: Response) => {
  try {
    await genericService.handleAction(
      "delete",
      req.params.model,
      { id: req.params.id },
      req.user!
    );
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * @swagger
 * /admin/{model}/bulk:
 *   delete:
 *     summary: Bulk delete (superadmin only)
 *     requestBody: { required: true, content: { application/json: { schema: { type: object, properties: { ids: { type: array, items: { type: string } } } } } }
 *     responses: 200: { description: Bulk delete result }
 */
export const bulkDelete = async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0)
      return res.status(400).json({ error: "IDs array required" });
    const result = await genericService.handleAction(
      "bulkDelete",
      req.params.model,
      { ids },
      req.user!
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
