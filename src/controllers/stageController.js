// controllers/stageController.js
import prisma from '../../lib/prisma.js';

export const createStage = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { title, position, color = 'bg-gray-500' } = req.body;
    const userId = req.user.id;

    // Permission check
    const project = await prisma.projects.findFirst({
      where: {
        id: projectId,
        OR: [
          { owner_id: userId },
          { members: { some: { user_id: userId, role: { in: ['owner', 'admin', 'editor'] } } } }
        ]
      }
    });

    if (!project) {
      const error = new Error('Project not found or insufficient permissions');
      error.status = 404;
      return next(error);
    }

    const stage = await prisma.roadmapStages.create({
      data: {
        title,
        position,
        color, // NEW FIELD
        project_id: projectId
      }
    });

    res.status(201).json({
      success: true,
      message: 'Stage created successfully',
      data: stage
    });
  } catch (error) {
    next(error);
  }
};

export const updateStage = async (req, res, next) => {
  try {
    const { stageId } = req.params;
    const { title, position, color } = req.body;
    const userId = req.user.id;

    const stage = await prisma.roadmapStages.findFirst({
      where: {
        id: stageId,
        project: {
          OR: [
            { owner_id: userId },
            { members: { some: { user_id: userId, role: { in: ['owner', 'admin', 'editor'] } } } }
          ]
        }
      }
    });

    if (!stage) {
      const error = new Error('Stage not found or insufficient permissions');
      error.status = 404;
      return next(error);
    }

    const updatedStage = await prisma.roadmapStages.update({
      where: { id: stageId },
      data: { title, position, color }
    });

    res.json({
      success: true,
      message: 'Stage updated successfully',
      data: updatedStage
    });
  } catch (error) {
    next(error);
  }
};

export const deleteStage = async (req, res, next) => {
  try {
    const { stageId } = req.params;
    const userId = req.user.id;

    const stage = await prisma.roadmapStages.findFirst({
      where: {
        id: stageId,
        project: {
          OR: [
            { owner_id: userId },
            { members: { some: { user_id: userId, role: { in: ['owner', 'admin'] } } } }
          ]
        }
      }
    });

    if (!stage) {
      const error = new Error('Stage not found or insufficient permissions');
      error.status = 404;
      return next(error);
    }

    await prisma.roadmapStages.delete({
      where: { id: stageId }
    });

    res.json({
      success: true,
      message: 'Stage deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};