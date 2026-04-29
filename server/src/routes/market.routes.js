import express from 'express';
import { 
  getPosts, getPostById, getRelatedPosts, 
  createExchangeRequest, getRequestsForPost, 
  updateRequestStatus, deleteMarketPost, updateMarketPost 
} from '../controllers/market.controller.js';
import { protect, optionalProtect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', optionalProtect, getPosts);
router.get('/:id', optionalProtect, getPostById);
router.get('/:id/related', getRelatedPosts);
router.post('/request', protect, createExchangeRequest);

// Management (for owner)
router.get('/:id/requests', protect, getRequestsForPost);
router.patch('/requests/:requestId', protect, updateRequestStatus);
router.patch('/:id', protect, updateMarketPost);
router.delete('/:id', protect, deleteMarketPost);

export default router;
