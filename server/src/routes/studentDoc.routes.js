import express from 'express';
import { submitDocument, getMyDocuments, getPublicDocuments, getDocumentById, getRelatedDocuments, updateDocument, deleteDocument } from '../controllers/studentDoc.controller.js';
import { protect, optionalProtect } from '../middleware/auth.middleware.js';
import { uploadPdf } from '../middleware/upload.js';

const router = express.Router();

// Authenticated: student views their own docs
router.get('/mine', protect, getMyDocuments);

// Authenticated: student submits/updates/deletes a doc
router.post('/', protect, uploadPdf.single('pdf'), submitDocument);
router.patch('/:id', protect, uploadPdf.single('pdf'), updateDocument);
router.delete('/:id', protect, deleteDocument);

// Public: browse verified documents
router.get('/public', optionalProtect, getPublicDocuments);
router.get('/:id', optionalProtect, getDocumentById);
router.get('/:id/related', optionalProtect, getRelatedDocuments);

export default router;
