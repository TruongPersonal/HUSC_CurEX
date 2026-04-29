import express from 'express';
import { getReports, updateReportStatus, submitReport, getMyReports, getReportsAgainstMe } from '../controllers/report.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const router = express.Router();

router.get('/mine', protect, getMyReports);
router.get('/against-me', protect, getReportsAgainstMe);
router.post('/', protect, submitReport);

// Only ADMIN can access reports
router.use(protect, authorize('ADMIN'));

router.get('/', getReports);
router.put('/:id/status', updateReportStatus);

export default router;
