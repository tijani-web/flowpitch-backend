// routes/dashboard.js
import express from 'express';
import {
  getUserDashboard,
  getProjectDashboard,
  getDashboardStats
} from '../controllers/dashboardController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Enhanced dashboard routes
router.get('/user', authMiddleware, getUserDashboard);
router.get('/project/:projectId', authMiddleware, getProjectDashboard);
router.get('/stats', authMiddleware, getDashboardStats);

export default router;