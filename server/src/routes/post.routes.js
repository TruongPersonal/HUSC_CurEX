import express from 'express';
import {
    getFormData,
    createPost,
    getAssistantPosts,
    deletePost
} from '../controllers/post.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.get('/form-data', getFormData);
router.post('/', protect, upload.single('image'), createPost);

// Assistant management routes
router.use(protect, authorize('ASSISTANT'));
router.get('/manage', getAssistantPosts);
router.delete('/:id', deletePost);

export default router;
