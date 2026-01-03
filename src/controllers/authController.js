import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../../lib/prisma.js';

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Register
export const register = async (req, res, next) => {
  try {
    const { name, email, password, username } = req.body;

    // Check existing user
    const existingUser = await prisma.users.findFirst({
      where: { OR: [{ email }, { username }] }
    });

    if (existingUser) {
      const error = new Error(existingUser.email === email ? 'Email already registered' : 'Username taken');
      error.status = 409;
      return next(error);
    }

    // Hash password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await prisma.users.create({
      data: {
        name,
        email,
        username,
        password_hash,
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}&backgroundColor=b6e3f4`
      },
      select: { id: true, name: true, email: true, username: true, avatar_url: true, role: true, createdAt: true }
    });

    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: { user, token }
    });

  } catch (error) {
    next(error);
  }
};

// Login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) {
      const error = new Error('Invalid credentials');
      error.status = 401;
      return next(error);
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      const error = new Error('Invalid credentials');
      error.status = 401;
      return next(error);
    }

    // Update last login (you can add this field to Users model)
    const token = generateToken(user.id);

    const { password_hash, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: 'Login successful',
      data: { user: userWithoutPassword, token }
    });

  } catch (error) {
    next(error);
  }
};

// Forgot Password
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) {
      // Don't reveal if email exists
      return res.json({
        success: true,
        message: 'If email exists, reset instructions sent'
      });
    }

    // Generate reset token
    const resetToken = generateResetToken();
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    // In production, store this in database and send email
    // For now, we'll just return the token
    console.log('Reset token for development:', resetToken);

    res.json({
      success: true,
      message: 'If email exists, reset instructions sent',
      // Remove this in production - only for development
      resetToken 
    });

  } catch (error) {
    next(error);
  }
};

// Reset Password
export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    // In production: Verify token from database
    // For now, we'll simulate token verification
    if (!token) {
      const error = new Error('Invalid or expired reset token');
      error.status = 400;
      return next(error);
    }

    // Find user by token (in production)
    // const user = await findUserByResetToken(token);
    const user = await prisma.users.findFirst({ where: { email: 'user@example.com' } }); // Mock

    if (!user) {
      const error = new Error('Invalid or expired reset token');
      error.status = 400;
      return next(error);
    }

    // Hash new password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Update password and clear reset token
    await prisma.users.update({
      where: { id: user.id },
      data: { password_hash, updatedAt: new Date() }
    });

    res.json({
      success: true,
      message: 'Password reset successful'
    });

  } catch (error) {
    next(error);
  }
};

// Change Password
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.users.findUnique({ where: { id: req.user.id } });

    // Verify current password
    const validCurrentPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!validCurrentPassword) {
      const error = new Error('Current password is incorrect');
      error.status = 400;
      return next(error);
    }

    // Hash new password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(newPassword, saltRounds);

    await prisma.users.update({
      where: { id: user.id },
      data: { password_hash, updatedAt: new Date() }
    });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    next(error);
  }
};

// Logout
export const logout = async (req, res, next) => {
  try {
    // In production: Add token to blacklist or use refresh token strategy
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    next(error);
  }
};