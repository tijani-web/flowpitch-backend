import prisma from '../../lib/prisma.js';

// Create Discussion
export const createDiscussion = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    // ✅ ADD PROJECT ACCESS CHECK
    const project = await prisma.projects.findFirst({
      where: { 
        id: projectId,
        OR: [
          { visibility: 'public' },
          { 
            OR: [
              { owner_id: userId },
              { members: { some: { user_id: userId } } }
            ]
          }
        ]
      }
    });

    if (!project) {
      const error = new Error('Project not found or access denied');
      error.status = 404;
      return next(error);
    }

    const discussion = await prisma.discussions.create({
      data: {
        content,
        author_id: userId,
        project_id: projectId
      },
      include: {
        author: {
          select: { id: true, name: true, username: true, avatar_url: true }
        },
        likes: {
          where: { user_id: userId }, 
          select: { user_id: true }  
        },
        _count: {
          select: { likes: true }
        }
      }
    });

    // Transform the data properly
    const discussionWithLike = {
      ...discussion,
      userHasLiked: discussion.likes.length > 0,
      replies: [] // Empty array for new discussions
    }

    // Create activity log
    await prisma.activityLogs.create({
      data: {
        action: 'DISCUSSION_CREATED',
        user_id: userId,
        project_id: projectId,
        metadata: { 
          discussionId: discussion.id
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Discussion created successfully',
      data: discussionWithLike
    });

  } catch (error) {
    next(error);
  }
};

// Get Project Discussions
export const getProjectDiscussions = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user?.id; // Get current user if authenticated

    // ✅ ADD PROJECT ACCESS CHECK
    const project = await prisma.projects.findFirst({
      where: { 
        id: projectId,
        OR: [
          { visibility: 'public' },
          { 
            OR: [
              { owner_id: userId },
              { members: { some: { user_id: userId } } }
            ]
          }
        ]
      }
    });

    if (!project) {
      const error = new Error('Project not found or access denied');
      error.status = 404;
      return next(error);
    }

    // If we get here, user has access - fetch discussions
    const discussions = await prisma.discussions.findMany({
      where: { project_id: projectId },
      include: {
        author: {
          select: { id: true, name: true, username: true, avatar_url: true }
        },
        likes: {
          where: userId ? { user_id: userId } : undefined, // Check if current user liked
          select: { user_id: true }
        },
        _count: {
          select: { likes: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Transform to include userHasLiked
    const discussionsWithUserLike = discussions.map(discussion => ({
      ...discussion,
      userHasLiked: discussion.likes.length > 0, // Check if current user liked this
      replies: [] // Frontend will fetch replies separately
    }));

    res.json({
      success: true,
      data: discussionsWithUserLike
    });

  } catch (error) {
    next(error);
  }
};

// Update Discussion
export const updateDiscussion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    const discussion = await prisma.discussions.findFirst({
      where: { 
        id,
        author_id: userId 
      }
    });

    if (!discussion) {
      const error = new Error('Discussion not found or access denied');
      error.status = 404;
      return next(error);
    }

    const updatedDiscussion = await prisma.discussions.update({
      where: { id },
      data: { content }
    });

    res.json({
      success: true,
      message: 'Discussion updated successfully',
      data: updatedDiscussion
    });

  } catch (error) {
    next(error);
  }
};

// Delete Discussion
export const deleteDiscussion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const discussion = await prisma.discussions.findFirst({
      where: { 
        id,
        OR: [
          { author_id: userId },
          { project: { owner_id: userId } }
        ]
      }
    });

    if (!discussion) {
      const error = new Error('Discussion not found or access denied');
      error.status = 404;
      return next(error);
    }

    await prisma.discussions.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Discussion deleted successfully'
    });

  } catch (error) {
    next(error);
  }
};

// Like Discussion
export const likeDiscussion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const like = await prisma.discussionLikes.create({
      data: {
        user_id: userId,
        discussion_id: id
      }
    });

    // Get the full updated discussion with like status
    const discussion = await prisma.discussions.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true, username: true, avatar_url: true }
        },
        likes: {
          where: { user_id: userId },
          select: { user_id: true }
        },
        _count: {
          select: { likes: true }
        }
      }
    });

    const discussionWithLike = {
      ...discussion,
      userHasLiked: discussion.likes.length > 0,
      replies: []
    }

    res.json({
      success: true,
      message: 'Discussion liked successfully',
      data: discussionWithLike // Return full discussion data
    });

  } catch (error) {
    next(error);
  }
};

// Unlike Discussion 
export const unlikeDiscussion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await prisma.discussionLikes.delete({
      where: {
        user_id_discussion_id: {
          user_id: userId,
          discussion_id: id
        }
      }
    });

    // Get the full updated discussion
    const discussion = await prisma.discussions.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true, username: true, avatar_url: true }
        },
        likes: {
          where: { user_id: userId },
          select: { user_id: true }
        },
        _count: {
          select: { likes: true }
        }
      }
    });

    const discussionWithLike = {
      ...discussion,
      userHasLiked: discussion.likes.length > 0,
      replies: []
    }

    res.json({
      success: true,
      message: 'Discussion unliked successfully',
      data: discussionWithLike // Return full discussion data
    });

  } catch (error) {
    next(error);
  }
};
