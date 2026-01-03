// routes/stageRoutes.js
import express from 'express';
import {
  createStage,
  updateStage, 
  deleteStage
} from '../controllers/stageController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Create new stage in project
router.post('/projects/:projectId/stages', authMiddleware, createStage);

// Update stage (title, position, color)
router.put('/stages/:stageId', authMiddleware, updateStage);

// Delete stage
router.delete('/stages/:stageId', authMiddleware, deleteStage);

export default router;