import express from 'express';
import {
  createFeature,
  getProjectFeatures,
  getFeature,
  updateFeature,
  deleteFeature
} from '../controllers/featureController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { createFeatureValidation, updateFeatureValidation } from '../middleware/validation.js';

const router = express.Router();

router.post('/projects/:projectId/features', authMiddleware, createFeatureValidation, createFeature);
router.get('/projects/:projectId/features', getProjectFeatures);
router.get('/features/:id', getFeature);
router.put('/features/:id', authMiddleware, updateFeatureValidation, updateFeature);
router.delete('/features/:id', authMiddleware, deleteFeature);

export default router;