import prisma from '../../lib/prisma.js';

// Add/Update Vote
export const addVote = async (req, res, next) => {
  try {
    const { featureId } = req.params;
    const { value } = req.body; // +1 or -1
    const userId = req.user.id;

    // Check if feature exists
    const feature = await prisma.features.findUnique({
      where: { id: featureId }
    });

    if (!feature) {
      const error = new Error('Feature not found');
      error.status = 404;
      return next(error);
    }

    // Upsert vote (update if exists, create if not)
    const vote = await prisma.votes.upsert({
      where: {
        user_id_feature_id: {
          user_id: userId,
          feature_id: featureId
        }
      },
      update: {
        value,
        createdAt: new Date()
      },
      create: {
        value,
        user_id: userId,
        feature_id: featureId
      }
    });

    // Update feature vote count
    const voteCount = await prisma.votes.aggregate({
      where: { feature_id: featureId },
      _sum: { value: true }
    });

    await prisma.features.update({
      where: { id: featureId },
      data: { vote_count: voteCount._sum.value || 0 }
    });

    res.json({
      success: true,
      message: 'Vote added successfully',
      data: vote
    });

  } catch (error) {
    next(error);
  }
};

// Remove Vote
export const removeVote = async (req, res, next) => {
  try {
    const { featureId } = req.params;
    const userId = req.user.id;

    const vote = await prisma.votes.findUnique({
      where: {
        user_id_feature_id: {
          user_id: userId,
          feature_id: featureId
        }
      }
    });

    if (!vote) {
      const error = new Error('Vote not found');
      error.status = 404;
      return next(error);
    }

    await prisma.votes.delete({
      where: {
        user_id_feature_id: {
          user_id: userId,
          feature_id: featureId
        }
      }
    });

    // Update feature vote count
    const voteCount = await prisma.votes.aggregate({
      where: { feature_id: featureId },
      _sum: { value: true }
    });

    await prisma.features.update({
      where: { id: featureId },
      data: { vote_count: voteCount._sum.value || 0 }
    });

    res.json({
      success: true,
      message: 'Vote removed successfully'
    });

  } catch (error) {
    next(error);
  }
};

// Get User Votes
export const getUserVotes = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const votes = await prisma.votes.findMany({
      where: { user_id: userId },
      include: {
        feature: {
          select: { id: true, title: true, project_id: true }
        }
      }
    });

    res.json({
      success: true,
      data: votes
    });

  } catch (error) {
    next(error);
  }
};