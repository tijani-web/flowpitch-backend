import express from 'express';
import {
  addComment,
  getFeatureComments,
  updateComment,
  deleteComment
} from '../controllers/commentController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { commentValidation, updateCommentValidation } from '../middleware/validation.js';

const router = express.Router();

router.post('/features/:featureId/comments', authMiddleware, commentValidation, addComment);
router.get('/features/:featureId/comments', getFeatureComments);
router.put('/comments/:id', authMiddleware, updateCommentValidation, updateComment);
router.delete('/comments/:id', authMiddleware, deleteComment);

export default router;