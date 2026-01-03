import prisma from '../../lib/prisma.js';

// Follow a project
export const followProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    // ✅ Allow public OR if user is owner/admin/member of private project
    const project = await prisma.projects.findFirst({
      where: { 
        id: projectId,
        OR: [
          { visibility: 'public' },
          {
            OR: [
              { owner_id: userId },
               { members: { some: { user_id: userId, role: { in: ['owner', 'admin', 'editor', 'viewer'] } } } }
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

    // ✅ Check if already following
    const existingFollow = await prisma.followers.findUnique({
      where: {
        user_id_project_id: {
          user_id: userId,
          project_id: projectId
        }
      }
    });

    if (existingFollow) {
      const error = new Error('Already following this project');
      error.status = 409;
      return next(error);
    }

    const follow = await prisma.followers.create({
      data: {
        user_id: userId,
        project_id: projectId
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            slug: true,
            visibility: true,
            owner: {
              select: { id: true, name: true, username: true }
            }
          }
        }
      }
    });

    // Create activity log
    await prisma.activityLogs.create({
      data: {
        action: 'PROJECT_FOLLOWED',
        user_id: userId,
        project_id: projectId,
        metadata: { followerCount: await getFollowerCount(projectId) }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Project followed successfully',
      data: follow
    });

  } catch (error) {
    next(error);
  }
};


// Unfollow a project
export const unfollowProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    const follow = await prisma.followers.findUnique({
      where: {
        user_id_project_id: {
          user_id: userId,
          project_id: projectId
        }
      }
    });

    if (!follow) {
      const error = new Error('Not following this project');
      error.status = 404;
      return next(error);
    }

    await prisma.followers.delete({
      where: {
        user_id_project_id: {
          user_id: userId,
          project_id: projectId
        }
      }
    });

    // Create activity log
    await prisma.activityLogs.create({
      data: {
        action: 'PROJECT_UNFOLLOWED',
        user_id: userId,
        project_id: projectId,
        metadata: { followerCount: await getFollowerCount(projectId) }
      }
    });

    res.json({
      success: true,
      message: 'Project unfollowed successfully'
    });

  } catch (error) {
    next(error);
  }
};

// Get user's followed projects
export const getFollowedProjects = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const followedProjects = await prisma.followers.findMany({
      where: { user_id: userId },
      include: {
        project: {
          include: {
            owner: {
              select: { id: true, name: true, username: true, avatar_url: true }
            },
            _count: {
              select: {
                features: true,
                followers: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: followedProjects
    });

  } catch (error) {
    next(error);
  }
};

// Get project followers
export const getProjectFollowers = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    // Check if user has access to see followers
    const project = await prisma.projects.findFirst({
      where: {
        id: projectId,
        OR: [
          { visibility: 'public' },
          { owner_id: req.user.id },
          { members: { some: { user_id: req.user.id } } }
        ]
      }
    });

    if (!project) {
      const error = new Error('Project not found or access denied');
      error.status = 404;
      return next(error);
    }

    const followers = await prisma.followers.findMany({
      where: { project_id: projectId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar_url: true,
            bio: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: followers
    });

  } catch (error) {
    next(error);
  }
};

// Helper function to get follower count
const getFollowerCount = async (projectId) => {
  const count = await prisma.followers.count({
    where: { project_id: projectId }
  });
  return count;
};