import express from 'express';
import { exportData, importData } from '../controllers/data.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const router = express.Router();

// ADMIN and ASSISTANT can access data sync
router.get('/export', protect, authorize('ADMIN', 'ASSISTANT'), exportData);
router.post('/import', protect, authorize('ADMIN', 'ASSISTANT'), importData);

export default router;
