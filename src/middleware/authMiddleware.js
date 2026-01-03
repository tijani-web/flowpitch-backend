import jwt from 'jsonwebtoken';
import prisma from '../../lib/prisma.js';

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      const error = new Error('Access denied. No token provided.');
      error.status = 401;
      return next(error);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.users.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true, role: true }
    });

    if (!user) {
      const error = new Error('Invalid token');
      error.status = 401;
      return next(error);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      error.message = 'Invalid token';
      error.status = 401;
    }
    if (error.name === 'TokenExpiredError') {
      error.message = 'Token expired';
      error.status = 401;
    }
    next(error);
  }
};

export default authMiddleware;