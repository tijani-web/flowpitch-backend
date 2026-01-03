import prisma from '../../lib/prisma.js';

// Create Reply
export const createReply = async (req, res, next) => {
  try {
    const { discussionId } = req.params;
    const { content, parent_id } = req.body;
    const userId = req.user.id;

    // Check if discussion exists and user has access
    const discussion = await prisma.discussions.findFirst({
      where: { 
        id: discussionId,
        project: {
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
      }
    });

    if (!discussion) {
      const error = new Error('Discussion not found or access denied');
      error.status = 404;
      return next(error);
    }

    // FIX: Only set parent_id if it's a valid database ID
    const validParentId = parent_id && 
                         parent_id.length > 5 && 
                         !parent_id.startsWith('temp-') &&
                         parent_id !== 'aaa'

    const reply = await prisma.discussionReplies.create({
      data: {
        content,
        author_id: userId,
        discussion_id: discussionId,
        parent_id: validParentId ? parent_id : null 
      },
      include: {
        author: {
          select: { id: true, name: true, username: true, avatar_url: true }
        },
        _count: {
          select: { replies: true }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Reply created successfully',
      data: reply
    });

  } catch (error) {
    next(error);
  }
};

// Get Discussion Replies
export const getDiscussionReplies = async (req, res, next) => {
  try {
    const { discussionId } = req.params;
    const userId = req.user?.id;

    // Check discussion access
    const discussion = await prisma.discussions.findFirst({
      where: { 
        id: discussionId,
        project: {
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
      }
    });

    if (!discussion) {
      const error = new Error('Discussion not found or access denied');
      error.status = 404;
      return next(error);
    }

    // Recursive function to build nested replies with likes AND PARENT DATA
    const getNestedReplies = async (parentId = null) => {
      const replies = await prisma.discussionReplies.findMany({
        where: { 
          discussion_id: discussionId,
          parent_id: parentId
        },
        include: {
          author: {
            select: { id: true, name: true, username: true, avatar_url: true }
          },
          parent: { // ← ADD THIS: Include parent data with author
            include: {
              author: {
                select: { id: true, name: true, username: true, avatar_url: true }
              }
            }
          },
          likes: {
            where: userId ? { user_id: userId } : undefined,
            select: { user_id: true }
          },
          _count: {
            select: { 
              likes: true,
              replies: true 
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      });

      // Transform to include userHasLiked and recursively get nested replies
      const repliesWithNesting = await Promise.all(
        replies.map(async (reply) => ({
          ...reply,
          userHasLiked: reply.likes.length > 0,
          replies: await getNestedReplies(reply.id) // Recursive call for nested replies
        }))
      );

      return repliesWithNesting;
    };

    const nestedReplies = await getNestedReplies(null);

    res.json({
      success: true,
      data: nestedReplies
    });

  } catch (error) {
    next(error);
  }
};

// Update Reply
export const updateReply = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    const reply = await prisma.discussionReplies.findFirst({
      where: { 
        id,
        author_id: userId 
      }
    });

    if (!reply) {
      const error = new Error('Reply not found or access denied');
      error.status = 404;
      return next(error);
    }

    const updatedReply = await prisma.discussionReplies.update({
      where: { id },
      data: { content }
    });

    res.json({
      success: true,
      message: 'Reply updated successfully',
      data: updatedReply
    });

  } catch (error) {
    next(error);
  }
};

// Delete Reply
export const deleteReply = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const reply = await prisma.discussionReplies.findFirst({
      where: { 
        id,
        OR: [
          { author_id: userId },
          { 
            discussion: { 
              project: { 
                OR: [
                  { owner_id: userId },
                  { members: { some: { user_id: userId, role: { in: ['owner', 'admin'] } } } }
                ]
              } 
            } 
          }
        ]
      }
    });

    if (!reply) {
      const error = new Error('Reply not found or access denied');
      error.status = 404;
      return next(error);
    }

    await prisma.discussionReplies.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Reply deleted successfully'
    });

  } catch (error) {
    next(error);
  }
};



// Like Reply
export const likeReply = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if reply exists
    const reply = await prisma.discussionReplies.findFirst({
      where: { 
        id,
        discussion: {
          project: {
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
        }
      }
    });

    if (!reply) {
      const error = new Error('Reply not found or access denied');
      error.status = 404;
      return next(error);
    }

    // Check if already liked FIRST
    const existingLike = await prisma.discussionReplyLikes.findUnique({
      where: {
        user_id_reply_id: {
          user_id: userId,
          reply_id: id
        }
      }
    });

    if (existingLike) {
      const error = new Error('Reply already liked');
      error.status = 400;
      return next(error);
    }

    // Create like
    const like = await prisma.discussionReplyLikes.create({
      data: {
        user_id: userId,
        reply_id: id
      }
    });

    res.json({
      success: true,
      message: 'Reply liked successfully',
      data: like
    });

  } catch (error) {
    next(error);
  }
};

// Unlike Reply
export const unlikeReply = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if reply exists
    const reply = await prisma.discussionReplies.findFirst({
      where: { 
        id,
        discussion: {
          project: {
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
        }
      }
    });

    if (!reply) {
      const error = new Error('Reply not found or access denied');
      error.status = 404;
      return next(error);
    }

    // Remove like
    await prisma.discussionReplyLikes.delete({
      where: {
        user_id_reply_id: {
          user_id: userId,
          reply_id: id
        }
      }
    });

    res.json({
      success: true,
      message: 'Reply unliked successfully'
    });

  } catch (error) {
    next(error);
  }
};