import express from 'express';
import { getSubjects, createSubject, updateSubject, deleteSubject } from '../controllers/subject.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const router = express.Router();

router.get('/', protect, getSubjects);
router.post('/', protect, authorize('ADMIN', 'ASSISTANT'), createSubject);
router.put('/:id', protect, authorize('ADMIN', 'ASSISTANT'), updateSubject);
router.delete('/:id', protect, authorize('ADMIN', 'ASSISTANT'), deleteSubject);

export default router;
