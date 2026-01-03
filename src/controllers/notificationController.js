import prisma from '../../lib/prisma.js';

// Get user notifications
export const getUserNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    const whereClause = { user_id: userId };
    if (unreadOnly === 'true') {
      whereClause.read = false;
    }

    const notifications = await prisma.notifications.findMany({
      where: whereClause,
      include: {
        user: {
          select: { id: true, name: true, username: true, avatar_url: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: parseInt(limit)
    });

    // Get unread count
    const unreadCount = await prisma.notifications.count({
      where: { user_id: userId, read: false }
    });

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: await prisma.notifications.count({ where: { user_id: userId } })
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

// Mark notification as read
export const markAsRead = async (req, res, next) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notification = await prisma.notifications.findFirst({
      where: { id: notificationId, user_id: userId }
    });

    if (!notification) {
      const error = new Error('Notification not found');
      error.status = 404;
      return next(error);
    }

    const updatedNotification = await prisma.notifications.update({
      where: { id: notificationId },
      data: { read: true }
    });

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: updatedNotification
    });

  } catch (error) {
    next(error);
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;

    await prisma.notifications.updateMany({
      where: { user_id: userId, read: false },
      data: { read: true }
    });

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });

  } catch (error) {
    next(error);
  }
};

// Delete notification
export const deleteNotification = async (req, res, next) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notification = await prisma.notifications.findFirst({
      where: { id: notificationId, user_id: userId }
    });

    if (!notification) {
      const error = new Error('Notification not found');
      error.status = 404;
      return next(error);
    }

    await prisma.notifications.delete({
      where: { id: notificationId }
    });

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    next(error);
  }
};

// Notification service functions (to be called from other controllers)
export const notificationService = {
  // Notify followers when new feature is created
  notifyNewFeature: async (featureId, projectId, authorId) => {
    try {
      const followers = await prisma.followers.findMany({
        where: { project_id: projectId },
        include: { user: true }
      });

      const feature = await prisma.features.findUnique({
        where: { id: featureId },
        include: { author: true }
      });

      for (const follow of followers) {
        if (follow.user_id !== authorId) { // Don't notify the author
          await prisma.notifications.create({
            data: {
              type: 'new_feature',
              user_id: follow.user_id,
              reference_id: featureId,
              message: `${feature.author.name} suggested a new feature: ${feature.title}`
            }
          });
        }
      }
    } catch (error) {
      console.error('Error notifying followers:', error);
    }
  },

  // Notify followers when feature status changes
  notifyStatusChange: async (featureId, oldStatus, newStatus) => {
    try {
      const feature = await prisma.features.findUnique({
        where: { id: featureId },
        include: { project: true }
      });

      const followers = await prisma.followers.findMany({
        where: { project_id: feature.project_id }
      });

      for (const follow of followers) {
        await prisma.notifications.create({
          data: {
            type: 'status_update',
            user_id: follow.user_id,
            reference_id: featureId,
            message: `Feature "${feature.title}" changed from ${oldStatus} to ${newStatus}`
          }
        });
      }
    } catch (error) {
      console.error('Error notifying status change:', error);
    }
  }
};