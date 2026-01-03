import prisma from '../../lib/prisma.js';

// Create Project
export const createProject = async (req, res, next) => {
  try {
    const { title, description, category, visibility, progress = 0, stages } = req.body; 
    const userId = req.user.id;

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    let logo_url = req.body.logo_url;
    if (req.file) {
      logo_url = `/uploads/projects/${req.file.filename}`;
    }
    if (!logo_url) {
      logo_url = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(title)}&backgroundColor=0D8ABC&fontWeight=500`;
    }

    // USE CUSTOM STAGES IF PROVIDED, OTHERWUSE USE DEFAULTS
    const stagesToCreate = stages && stages.length > 0 
      ? stages 
      : [
          { title: 'Backlog', position: 1, color: 'bg-gray-500' },
          { title: 'In Progress', position: 2, color: 'bg-yellow-500' },
          { title: 'Completed', position: 3, color: 'bg-green-500' }
        ];

    const project = await prisma.projects.create({
      data: {
        title,
        description,
        category,
        logo_url,
        visibility: visibility || 'public',
        progress,
        slug,
        owner_id: userId,
        stages: {
          create: stagesToCreate // USE stagesToCreate instead of hard-coded stages
        }
      },
      include: {
        stages: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: project
    });
  } catch (error) {
    next(error);
  }
};

// Update Project - ADD progress
export const updateProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, category, logo_url, visibility, progress } = req.body; // ADD progress
    const userId = req.user.id;

    const project = await prisma.projects.findFirst({
      where: { id, owner_id: userId }
    });

    if (!project) {
      const error = new Error('Project not found or access denied');
      error.status = 404;
      return next(error);
    }

    const updatedProject = await prisma.projects.update({
      where: { id },
      data: {
        title,
        description,
        category,
        logo_url,
        visibility,
        progress, // ADD THIS
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: updatedProject
    });
  } catch (error) {
    next(error);
  }
};


// Get User's Projects
export const getMyProjects = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const projects = await prisma.projects.findMany({
      where: {
        OR: [
          { owner_id: userId },
          { members: { some: { user_id: userId } } }
        ]
      },
      include: {
        owner: {
          select: { id: true, name: true, username: true, avatar_url: true }
        },
        _count: {
          select: {
            features: true,
            followers: true,
            members: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: projects
    });

  } catch (error) {
    next(error);
  }
};

// Get Project by ID
export const getProject = async (req, res, next) => {
  try {
    const { id } = req.params;

    const project = await prisma.projects.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, name: true, username: true, avatar_url: true }
        },
        stages: {
          orderBy: { position: 'asc' },
          include: {
            features: {
              include: {
                author: {
                  select: { id: true, name: true, username: true, avatar_url: true }
                },
                votes: true,
                // ✅ ADD COMMENTS TO STAGE FEATURES TOO
                comments: {
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
                },
                _count: {
                  select: { comments: true }
                }
              },
              orderBy: { createdAt: 'desc' }
            }
          }
        },
        // Root-level features with comments
        features: {
          include: {
            author: {
              select: { id: true, name: true, username: true, avatar_url: true }
            },
            votes: true,
            stage: {
              select: { id: true, title: true, color: true }
            },
            // ✅ ADD COMMENTS HERE (THIS IS WHAT'S MISSING)
            comments: {
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
            },
            _count: {
              select: { comments: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        // Include followers data
        followers: {
          include: {
            user: {
              select: { id: true, name: true, username: true, avatar_url: true }
            }
          }
        },
        // Include members data
        members: {
          include: {
            user: {
              select: { id: true, name: true, username: true, avatar_url: true }
            }
          }
        },
        _count: {
          select: {
            features: true,
            followers: true,
            members: true
          }
        }
      }
    });

    if (!project) {
      const error = new Error('Project not found');
      error.status = 404;
      return next(error);
    }

    res.json({
      success: true,
      data: project
    });

  } catch (error) {
    next(error);
  }
};


// Delete Project
export const deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if user owns the project
    const project = await prisma.projects.findFirst({
      where: { id, owner_id: userId }
    });

    if (!project) {
      const error = new Error('Project not found or access denied');
      error.status = 404;
      return next(error);
    }

    await prisma.projects.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });

  } catch (error) {
    next(error);
  }
};