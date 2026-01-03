import prisma from '../../lib/prisma.js';




// Helper function to parse mentions
const parseMentions = (content) => {
  const mentionRegex = /@([a-zA-Z0-9_]+)/g;
  const mentions = [];
  let match;
  
  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1]); // username without @
  }
  
  return mentions;
};

// Add Comment
export const addComment = async (req, res, next) => {
  try {
    const { featureId } = req.params;
    const { content, parent_id } = req.body;
    const userId = req.user.id;

    const comment = await prisma.comments.create({
      data: {
        content,
        parent_id: parent_id || null,
        author_id: userId,
        feature_id: featureId
      },
      include: {
        author: {
          select: { id: true, name: true, username: true, avatar_url: true }
        },
        replies: {
          include: {
            author: {
              select: { id: true, name: true, username: true, avatar_url: true }
            }
          }
        },
        feature: {
          include: {
            project: {
              select: { id: true, title: true }
            }
          }
        }
      }
    });

    // Handle mentions
    const mentions = parseMentions(content);
    if (mentions.length > 0) {
      for (const username of mentions) {
        const mentionedUser = await prisma.users.findUnique({
          where: { username }
        });

        if (mentionedUser && mentionedUser.id !== userId) {
          // Create notification for mentioned user
          await prisma.notifications.create({
            data: {
              type: 'mention',
              user_id: mentionedUser.id,
              reference_id: comment.id,
              message: `${req.user.name} mentioned you in a comment`
            }
          });

          // Create activity log
          await prisma.activityLogs.create({
            data: {
              action: 'USER_MENTIONED',
              user_id: userId,
              project_id: comment.feature.project_id,
              metadata: { 
                mentionedUserId: mentionedUser.id,
                commentId: comment.id,
                featureId: featureId
              }
            }
          });
        }
      }
    }

    // Create activity log for comment
    await prisma.activityLogs.create({
      data: {
        action: 'COMMENT_ADDED',
        user_id: userId,
        project_id: comment.feature.project_id,
        metadata: { 
          commentId: comment.id,
          featureId: featureId,
          featureTitle: comment.feature.title
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: comment
    });

  } catch (error) {
    next(error);
  }
};

// Get Feature Comments
export const getFeatureComments = async (req, res, next) => {
  try {
    const { featureId } = req.params;

    const comments = await prisma.comments.findMany({
      where: { 
        feature_id: featureId,
        parent_id: null // Only top-level comments
      },
      include: {
        author: {
          select: { id: true, name: true, username: true, avatar_url: true }
        },
        replies: {
          include: {
            author: {
              select: { id: true, name: true, username: true, avatar_url: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json({
      success: true,
      data: comments
    });

  } catch (error) {
    next(error);
  }
};

// Update Comment
export const updateComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    const comment = await prisma.comments.findFirst({
      where: { id, author_id: userId }
    });

    if (!comment) {
      const error = new Error('Comment not found or access denied');
      error.status = 404;
      return next(error);
    }

    const updatedComment = await prisma.comments.update({
      where: { id },
      data: { content }
    });

    res.json({
      success: true,
      message: 'Comment updated successfully',
      data: updatedComment
    });

  } catch (error) {
    next(error);
  }
};

// Delete Comment
export const deleteComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const comment = await prisma.comments.findFirst({
      where: { 
        id,
        OR: [
          { author_id: userId },
          { feature: { project: { owner_id: userId } } }
        ]
      }
    });

    if (!comment) {
      const error = new Error('Comment not found or access denied');
      error.status = 404;
      return next(error);
    }

    await prisma.comments.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });

  } catch (error) {
    next(error);
  }
};