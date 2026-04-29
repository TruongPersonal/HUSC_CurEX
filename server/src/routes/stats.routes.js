import express from 'express';
import { getAdminStats, getAssistantStats } from '../controllers/stats.controller.js';
import { protect, isAdmin, isAssistant } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/admin', protect, isAdmin, getAdminStats);
router.get('/assistant', protect, isAssistant, getAssistantStats);

export default router;
