// Settings routes
import { Router } from 'express';
import * as controller from '../controllers/settings';

const router = Router();
router.get('/', controller.getSettings);
router.patch('/', controller.updateSettings);

export default router;
