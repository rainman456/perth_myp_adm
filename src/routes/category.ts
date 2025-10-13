// Category routes
import { Router } from 'express';
import {
  createCategory,
  getCategoryById,
  getAllCategories,
  getCategoryTree,
  updateCategory,
  deleteCategory,
  addAttribute,
} from '../controllers/category.js';

const router = Router();
router.post('/', createCategory);
router.get('/', getAllCategories);
router.get('/tree', getCategoryTree); // Special endpoint for hierarchy
router.get('/:id', getCategoryById);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);
router.patch('/:id/attributes', addAttribute);

export default router;