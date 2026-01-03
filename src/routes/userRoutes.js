import express from 'express';
import {
  getProfile,
  updateProfile,
  deleteAccount,
  getPublicProfile
} from '../controllers/userController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { updateProfileValidation, deleteAccountValidation } from '../middleware/validation.js';

const router = express.Router();

// Protected routes (current user)
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfileValidation, updateProfile);
router.delete('/profile', authMiddleware, deleteAccountValidation, deleteAccount);

// Public routes
router.get('/:id', getPublicProfile);

export default router;