import express from 'express';
import { getUsers, createAssistant, toggleUserStatus, deleteUser, updateAssistant } from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const router = express.Router();

router.use(protect, authorize('ADMIN'));

router.get('/', getUsers);
router.post('/assistant', createAssistant);
router.put('/assistant/:id', updateAssistant);
router.put('/:id/status', toggleUserStatus);
router.delete('/:id', deleteUser);

export default router;
