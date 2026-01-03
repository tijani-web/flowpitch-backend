import prisma from '../../lib/prisma.js';

// Get user activity feed
export const getUserActivity = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const activities = await prisma.activityLogs.findMany({
      where: {
        OR: [
          { user_id: userId }, // User's own activities
          { project: { members: { some: { user_id: userId } } } } // Activities in user's projects
        ]
      },
      include: {
        user: {
          select: { id: true, name: true, username: true, avatar_url: true }
        },
        project: {
          select: { id: true, title: true, slug: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: parseInt(limit)
    });

    res.json({
      success: true,
      data: activities
    });

  } catch (error) {
    next(error);
  }
};

// Get project activity feed
export const getProjectActivity = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Check if user has access to project
    const hasAccess = await prisma.projects.findFirst({
      where: {
        id: projectId,
        OR: [
          { visibility: 'public' },
          { owner_id: req.user.id },
          { members: { some: { user_id: req.user.id } } }
        ]
      }
    });

    if (!hasAccess) {
      const error = new Error('Project not found or access denied');
      error.status = 404;
      return next(error);
    }

    const activities = await prisma.activityLogs.findMany({
      where: { project_id: projectId },
      include: {
        user: {
          select: { id: true, name: true, username: true, avatar_url: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: parseInt(limit)
    });

    res.json({
      success: true,
      data: activities
    });

  } catch (error) {
    next(error);
  }
};