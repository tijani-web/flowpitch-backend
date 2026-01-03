import express from 'express';
import {
  addVote,
  removeVote,
  getUserVotes
} from '../controllers/voteController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { voteValidation } from '../middleware/validation.js';

const router = express.Router();

router.post('/features/:featureId/vote', authMiddleware, voteValidation, addVote);
router.delete('/features/:featureId/vote', authMiddleware, removeVote);
router.get('/users/votes', authMiddleware, getUserVotes);

export default router;