import express from 'express';
import { googleLogin, localLogin, getMe, changePassword, updateProfile, uploadAvatar } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.post('/google', googleLogin);
router.post('/login', localLogin);
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);
router.put('/update-profile', protect, updateProfile);
router.post('/upload-avatar', protect, upload.single('avatar'), uploadAvatar);

export default router;
