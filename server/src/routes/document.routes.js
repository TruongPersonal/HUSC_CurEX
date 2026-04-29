import express from 'express';
import {
  getDocuments,
  updateDocumentStatus,
  updateDocument,
  deleteDocument
} from '../controllers/document.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const router = express.Router();

router.use(protect, authorize('ASSISTANT'));

router.get('/', getDocuments);
router.put('/:id/status', updateDocumentStatus);
router.put('/:id', updateDocument);
router.delete('/:id', deleteDocument);

export default router;
