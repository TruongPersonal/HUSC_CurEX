import express from 'express';
import { getUnits, createUnit, updateUnit, deleteUnit } from '../controllers/unit.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const router = express.Router();

router.get('/', getUnits);
router.post('/', protect, authorize('ADMIN'), createUnit);
router.put('/:id', protect, authorize('ADMIN'), updateUnit);
router.delete('/:id', protect, authorize('ADMIN'), deleteUnit);

export default router;
