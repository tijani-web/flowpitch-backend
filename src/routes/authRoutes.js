import express from 'express';
import {
  register,
  login,
  forgotPassword,
  resetPassword,
  changePassword,
  logout
} from '../controllers/authController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  changePasswordValidation
} from '../middleware/validation.js';

const router = express.Router();

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/forgot-password', forgotPasswordValidation, forgotPassword);
router.post('/reset-password', resetPasswordValidation, resetPassword);
router.post('/change-password', authMiddleware, changePasswordValidation, changePassword);
router.post('/logout', authMiddleware, logout);

export default router;