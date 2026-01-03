import express from 'express';
import {
  createDiscussion,
  getProjectDiscussions,
  updateDiscussion,
  deleteDiscussion,
  likeDiscussion,
  unlikeDiscussion
} from '../controllers/discussionController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { discussionValidation } from '../middleware/validation.js';

const router = express.Router();

// All routes protected
router.post('/projects/:projectId/discussions', authMiddleware, discussionValidation, createDiscussion);
router.get('/projects/:projectId/discussions', authMiddleware, getProjectDiscussions);
router.put('/discussions/:id', authMiddleware, discussionValidation, updateDiscussion);
router.delete('/discussions/:id', authMiddleware, deleteDiscussion);
router.post('/discussions/:id/like', authMiddleware, likeDiscussion);
router.delete('/discussions/:id/like', authMiddleware, unlikeDiscussion);

export default router;
