import prisma from '../../lib/prisma.js';
import { notificationService } from '../controllers/notificationController.js';

// Create Feature
export const createFeature = async (req, res, next) => {
  try {
    const { title, description, tags, priority, progress = 0, start_date, target_date } = req.body; 
    const { projectId } = req.params;
    const userId = req.user.id;

    // First, find the Backlog stage for this project
    const backlogStage = await prisma.roadmapStages.findFirst({
      where: {
        project_id: projectId,
        title: 'Backlog'
      }
    });

    if (!backlogStage) {
      const error = new Error('Backlog stage not found for this project');
      error.status = 404;
      return next(error);
    }

    const feature = await prisma.features.create({
      data: {
        title,
        description,
        tags: tags || [],
        priority: priority || 'medium',
        progress,
        start_date: start_date ? new Date(start_date) : null, 
        target_date: target_date ? new Date(target_date) : null, 
        project_id: projectId,
        author_id: userId,
        stage_id: backlogStage.id  // ← USE stage_id INSTEAD OF stage.connect
      },
      include: {
        author: {
          select: { id: true, name: true, username: true, avatar_url: true }
        },
        stage: true,
        _count: {
          select: { votes: true, comments: true }
        }
      }
    });

    await notificationService.notifyNewFeature(feature.id, projectId, userId);

    res.status(201).json({
      success: true,
      message: 'Feature suggested successfully',
      data: feature
    });
  } catch (error) {
    next(error);
  }
};

// Update Feature 
export const updateFeature = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, tags, status, priority, stage_id, progress, start_date, target_date } = req.body; // ADD new fields
    const userId = req.user.id;

    const feature = await prisma.features.findFirst({
      where: { 
        id,
        OR: [
          { author_id: userId },
          { project: { owner_id: userId } },
          { project: { members: { some: { user_id: userId, role: { in: ['owner', 'admin'] } } } } }
        ]
      }
    });

    if (!feature) {
      const error = new Error('Feature not found or access denied');
      error.status = 404;
      return next(error);
    }

    const updatedFeature = await prisma.features.update({
      where: { id },
      data: {
        title,
        description,
        tags,
        status,
        priority,
        stage_id,
        progress, // ADD THIS
        start_date: start_date ? new Date(start_date) : null, // ADD THIS
        target_date: target_date ? new Date(target_date) : null, // ADD THIS
        updatedAt: new Date()
      },
      include: {
        author: {
          select: { id: true, name: true, username: true, avatar_url: true }
        },
        stage: true
      }
    });

    if (status && status !== feature.status) {
      await notificationService.notifyStatusChange(feature.id, feature.status, status);
    }

    res.json({
      success: true,
      message: 'Feature updated successfully',
      data: updatedFeature
    });
  } catch (error) {
    next(error);
  }
};

// Get Project Features
export const getProjectFeatures = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const features = await prisma.features.findMany({
      where: { project_id: projectId },
      include: {
        author: {
          select: { id: true, name: true, username: true, avatar_url: true }
        },
        stage: true,
        votes: true,
        _count: {
          select: { comments: true }
        }
      },
      orderBy: { vote_count: 'desc' }
    });

    res.json({
      success: true,
      data: features
    });

  } catch (error) {
    next(error);
  }
};

// Get Single Feature
export const getFeature = async (req, res, next) => {
  try {
    const { id } = req.params;

    const feature = await prisma.features.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true, username: true, avatar_url: true }
        },
        stage: true,
        votes: {
          include: {
            user: {
              select: { id: true, name: true, username: true, avatar_url: true }
            }
          }
        },
        comments: {
          include: {
            author: {
              select: { id: true, name: true, username: true, avatar_url: true }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!feature) {
      const error = new Error('Feature not found');
      error.status = 404;
      return next(error);
    }

    res.json({
      success: true,
      data: feature
    });

  } catch (error) {
    next(error);
  }
};

// Delete Feature
export const deleteFeature = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const feature = await prisma.features.findFirst({
      where: { 
        id,
        OR: [
          { author_id: userId },
          { project: { owner_id: userId } }
        ]
      }
    });

    if (!feature) {
      const error = new Error('Feature not found or access denied');
      error.status = 404;
      return next(error);
    }

    // Delete related records first
    await prisma.votes.deleteMany({
      where: { feature_id: id }
    });

    await prisma.comments.deleteMany({
      where: { feature_id: id }
    });

    // Now delete the feature
    await prisma.features.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Feature deleted successfully'
    });

  } catch (error) {
    next(error);
  }
};