// Settings routes
import { Router } from 'express';
import * as controller from '../controllers/settings.js';

const router = Router();
//router.get('/', controller.getSettings);
router.put('/', controller.updateSettings);

export default router;
