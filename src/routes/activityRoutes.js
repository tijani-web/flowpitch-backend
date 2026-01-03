import express from 'express';
import {
  getUserActivity,
  getProjectActivity
} from '../controllers/activityController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// User activity feed
router.get('/users/activity', authMiddleware, getUserActivity);

// Project activity feed  
router.get('/projects/:projectId/activity', authMiddleware, getProjectActivity);

export default router;