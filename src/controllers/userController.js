import prisma from '../../lib/prisma.js';

// Get user profile
export const getProfile = async (req, res, next) => {
  try {
    const user = await prisma.users.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        avatar_url: true,
        bio: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// Update user profile
export const updateProfile = async (req, res, next) => {
  try {
    const { name, username, bio, avatar_url } = req.body;

    // Check if username is taken
    if (username) {
      const existingUser = await prisma.users.findFirst({
        where: {
          username,
          NOT: { id: req.user.id }
        }
      });

      if (existingUser) {
        const error = new Error('Username already taken');
        error.status = 409;
        return next(error);
      }
    }

    const updatedUser = await prisma.users.update({
      where: { id: req.user.id },
      data: {
        name,
        username,
        bio,
        avatar_url,
        updatedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        avatar_url: true,
        bio: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

// Delete user account
export const deleteAccount = async (req, res, next) => {
  try {
    const { password } = req.body;

    // Get user with password
    const user = await prisma.users.findUnique({
      where: { id: req.user.id }
    });

    // Verify password
    const bcrypt = await import('bcryptjs');
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      const error = new Error('Password is incorrect');
      error.status = 401;
      return next(error);
    }

    // Delete user (Prisma will handle relations)
    await prisma.users.delete({
      where: { id: req.user.id }
    });

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get public user profile
export const getPublicProfile = async (req, res, next) => {
  try {
    const user = await prisma.users.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        username: true,
        avatar_url: true,
        bio: true,
        createdAt: true
      }
    });

    if (!user) {
      const error = new Error('User not found');
      error.status = 404;
      return next(error);
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};