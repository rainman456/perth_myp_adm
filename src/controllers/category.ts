import { Request, Response } from 'express';
import { CategoryService } from '../services/category_service';

const service = new CategoryService();

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Create a new category
 *     tags: [Categories]
 *     security:
 *       - AdminAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Electronics
 *               parentId:
 *                 type: integer
 *                 nullable: true
 *                 example: 1
 *               attributes:
 *                 type: object
 *                 example: { "color": "string", "size": "string" }
 *             required:
 *               - name
 *     responses:
 *       201:
 *         description: Category created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 name:
 *                   type: string
 *                   example: Electronics
 *                 parentId:
 *                   type: integer
 *                   nullable: true
 *                   example: 1
 *                 attributes:
 *                   type: object
 *                   example: { "color": "string", "size": "string" }
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: 2025-09-13T11:00:00Z
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Invalid category data
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
export const createCategory = async (req: Request, res: Response) => {
  try {
    const category = await service.createCategory(req.body);
    res.status(201).json(category);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * @swagger
 * /categories/tree:
 *   get:
 *     summary: Get category tree hierarchy
 *     tags: [Categories]
 *     security:
 *       - AdminAuth: []
 *     responses:
 *       200:
 *         description: Category tree hierarchy
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   name:
 *                     type: string
 *                     example: Electronics
 *                   parentId:
 *                     type: integer
 *                     nullable: true
 *                     example: null
 *                   attributes:
 *                     type: object
 *                     example: { "color": "string", "size": "string" }
 *                   children:
 *                     type: array
 *                     items:
 *                       type: object
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     example: 2025-09-13T11:00:00Z
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
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Internal server error
 */
export const getCategoryTree = async (req: Request, res: Response) => {
  try {
    const tree = await service.getCategoryTree();
    res.json(tree);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * @swagger
 * /categories/{id}:
 *   get:
 *     summary: Get a category by ID
 *     tags: [Categories]
 *     security:
 *       - AdminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 name:
 *                   type: string
 *                   example: Electronics
 *                 parentId:
 *                   type: integer
 *                   nullable: true
 *                   example: 1
 *                 attributes:
 *                   type: object
 *                   example: { "color": "string", "size": "string" }
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: 2025-09-13T11:00:00Z
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
 *       404:
 *         description: Category not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Category not found
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Internal server error
 */

export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const category = await service.getCategoryById(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json(category);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * @swagger
 * /categories/{id}:
 *   delete:
 *     summary: Delete a category
 *     tags: [Categories]
 *     security:
 *       - AdminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Category ID
 *     responses:
 *       204:
 *         description: Category deleted
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
 *       404:
 *         description: Category not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Category not found
 */

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    await service.deleteCategory(req.params.id);
    res.status(204).send();
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Categories]
 *     security:
 *       - AdminAuth: []
 *     responses:
 *       200:
 *         description: List of categories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   name:
 *                     type: string
 *                     example: Electronics
 *                   parentId:
 *                     type: integer
 *                     nullable: true
 *                     example: 1
 *                   attributes:
 *                     type: object
 *                     example: { "color": "string", "size": "string" }
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     example: 2025-09-13T11:00:00Z
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
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Internal server error
 */
export const getAllCategories = async (req: Request, res: Response) => {
  try {
    const categories = await service.getAllCategories();
    res.json(categories);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * @swagger
 * /categories/{id}:
 *   put:
 *     summary: Update a category
 *     tags: [Categories]
 *     security:
 *       - AdminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Category ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Updated Electronics
 *               parentId:
 *                 type: integer
 *                 nullable: true
 *                 example: 1
 *               attributes:
 *                 type: object
 *                 example: { "color": "string", "size": "string" }
 *     responses:
 *       200:
 *         description: Category updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 name:
 *                   type: string
 *                   example: Updated Electronics
 *                 parentId:
 *                   type: integer
 *                   nullable: true
 *                   example: 1
 *                 attributes:
 *                   type: object
 *                   example: { "color": "string", "size": "string" }
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: 2025-09-13T11:00:00Z
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Invalid category data
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
 *       404:
 *         description: Category not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Category not found
 */
export const updateCategory = async (req: Request, res: Response) => {
  try {
    const category = await service.updateCategory(req.params.id, req.body);
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json(category);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * @swagger
 * /categories/{id}/attributes:
 *   patch:
 *     summary: Add or update category attribute
 *     tags: [Categories]
 *     security:
 *       - AdminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Category ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               key:
 *                 type: string
 *                 example: color
 *               value:
 *                 type: string
 *                 example: string
 *             required:
 *               - key
 *               - value
 *     responses:
 *       200:
 *         description: Category with updated attributes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 name:
 *                   type: string
 *                   example: Electronics
 *                 parentId:
 *                   type: integer
 *                   nullable: true
 *                   example: 1
 *                 attributes:
 *                   type: object
 *                   example: { "color": "string", "size": "string" }
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: 2025-09-13T11:00:00Z
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Invalid attribute data
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
 *       404:
 *         description: Category not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Category not found
 */

export const addAttribute = async (req: Request, res: Response) => {
  try {
    const { key, value } = req.body;
    const category = await service.addAttribute(req.params.id, key, value);
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json(category);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};