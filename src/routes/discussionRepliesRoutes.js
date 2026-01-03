import express from 'express';
import {
  createReply,
  getDiscussionReplies, 
  updateReply,
  deleteReply,
  likeReply,
  unlikeReply
} from '../controllers/discussionRepliesController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { replyValidation, updateReplyValidation } from '../middleware/validation.js';

const router = express.Router();

// Reply routes
router.post('/:discussionId/replies', authMiddleware, replyValidation, createReply);
router.get('/:discussionId/replies', authMiddleware, getDiscussionReplies);
router.put('/replies/:id', authMiddleware, updateReplyValidation, updateReply);
router.delete('/replies/:id', authMiddleware, deleteReply);

// LIKE ROUTES
router.post('/replies/:id/like', authMiddleware, likeReply);
router.delete('/replies/:id/like', authMiddleware, unlikeReply);

export default router;
