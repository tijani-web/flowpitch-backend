import prisma from '../../lib/prisma.js';

// Global search across projects and features
export const globalSearch = async (req, res, next) => {
  try {
    const { q, type, category, status, priority, page = 1, limit = 20 } = req.query;
    const userId = req.user.id;

    if (!q || q.length < 2) {
      const error = new Error('Search query must be at least 2 characters');
      error.status = 400;
      return next(error);
    }

    const searchTerm = q.toLowerCase();
    const skip = (page - 1) * limit;

    // Build where clauses for projects and features
    const projectWhere = {
      OR: [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { category: { contains: searchTerm, mode: 'insensitive' } }
      ],
      OR: [
        { visibility: 'public' },
        { owner_id: userId },
        { members: { some: { user_id: userId } } }
      ]
    };

    const featureWhere = {
      OR: [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { tags: { has: searchTerm } }
      ],
      project: {
        OR: [
          { visibility: 'public' },
          { owner_id: userId },
          { members: { some: { user_id: userId } } }
        ]
      }
    };

    // Add filters
    if (category) projectWhere.category = category;
    if (status) featureWhere.status = status;
    if (priority) featureWhere.priority = priority;

    let projects = [];
    let features = [];
    let totalCount = 0;

    // Search based on type
    if (!type || type === 'projects') {
      projects = await prisma.projects.findMany({
        where: projectWhere,
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
        orderBy: { createdAt: 'desc' },
        skip,
        take: type ? parseInt(limit) : Math.floor(parseInt(limit) / 2)
      });
    }

    if (!type || type === 'features') {
      features = await prisma.features.findMany({
        where: featureWhere,
        include: {
          author: {
            select: { id: true, name: true, username: true, avatar_url: true }
          },
          project: {
            select: { id: true, title: true, slug: true, visibility: true }
          },
          stage: true,
          _count: {
            select: {
              votes: true,
              comments: true
            }
          }
        },
        orderBy: { vote_count: 'desc' },
        skip,
        take: type ? parseInt(limit) : Math.floor(parseInt(limit) / 2)
      });
    }

    // Get total counts for pagination
    if (!type || type === 'projects') {
      totalCount += await prisma.projects.count({ where: projectWhere });
    }
    if (!type || type === 'features') {
      totalCount += await prisma.features.count({ where: featureWhere });
    }

    res.json({
      success: true,
      data: {
        projects,
        features,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          hasMore: totalCount > skip + parseInt(limit)
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

// Advanced project search with filters
export const searchProjects = async (req, res, next) => {
  try {
    const { q, category, visibility, sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 20 } = req.query;
    const userId = req.user.id;

    const where = {
      OR: [
        { visibility: 'public' },
        { owner_id: userId },
        { members: { some: { user_id: userId } } }
      ]
    };

    if (q) {
      where.OR = [
        ...where.OR,
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } }
      ];
    }

    if (category) where.category = category;
    if (visibility) where.visibility = visibility;

    const projects = await prisma.projects.findMany({
      where,
      include: {
        owner: {
          select: { id: true, name: true, username: true, avatar_url: true }
        },
        _count: {
          select: {
            features: true,
            followers: true,
            members: true,
            votes: true
          }
        },
        features: {
          select: {
            vote_count: true,
            status: true,
            progress: true 
          }
        }, 
        stages: {
          include: {
            features: {
              select: {
                status: true,
                progress: true
              }
            }
          }
        }
      },  
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: parseInt(limit)
    });

    const total = await prisma.projects.count({ where });

    res.json({
      success: true,
      data: {
        projects,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          hasMore: total > (page - 1) * limit + parseInt(limit)
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

// Public project search
export const publicProjectSearch = async (req, res, next) => {
  try {
    const { q, category, sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 50 } = req.query;

    const where = {
      visibility: 'public'
    };

    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { category: { contains: q, mode: 'insensitive' } }
      ];
    }

    if (category && category !== 'All') {
      where.category = category;
    }

    // Get projects first
    const projects = await prisma.projects.findMany({
      where,
      include: {
        owner: {
          select: { id: true, name: true, username: true, avatar_url: true }
        },
        _count: {
          select: {
            features: true,
            followers: true
          }
        },
        features: {
          select: {
            vote_count: true,
            status: true,
            progress: true
          }
        },
        stages: {  
          include: {
            features: {
              select: {
                status: true,
                progress: true
              }
            }
          }
        }
      },
      // Only use safe fields for initial orderBy
      orderBy: { createdAt: 'desc' }, // Default order
      skip: (page - 1) * limit,
      take: parseInt(limit)
    });

    // Calculate total votes for each project and add progress
    const projectsWithStats = projects.map(project => {
      // Calculate total votes from all features
      const totalVotes = project.features?.reduce((sum, feature) => 
        sum + (feature.vote_count || 0), 0) || 0;
      
      // Calculate progress from feature statuses
      const allFeatures = project.stages?.flatMap(stage => stage.features) || [];
      const completedFeatures = allFeatures.filter(f => f.status === 'completed').length;
      const progress = allFeatures.length > 0 ? Math.round((completedFeatures / allFeatures.length) * 100) : 0;

      return {
        ...project,
        totalVotes,
        progress
      };
    });

    // Apply custom sorting in JavaScript
    let sortedProjects = [...projectsWithStats];
    
    switch (sortBy) {
      case 'votes':
        sortedProjects.sort((a, b) => 
          sortOrder === 'desc' ? b.totalVotes - a.totalVotes : a.totalVotes - b.totalVotes
        );
        break;
      case 'followers':
        sortedProjects.sort((a, b) => 
          sortOrder === 'desc' ? b._count.followers - a._count.followers : a._count.followers - b._count.followers
        );
        break;
      case 'progress':
        sortedProjects.sort((a, b) => 
          sortOrder === 'desc' ? b.progress - a.progress : a.progress - b.progress
        );
        break;
      case 'createdAt':
      default:
        sortedProjects.sort((a, b) => 
          sortOrder === 'desc' ? new Date(b.createdAt) - new Date(a.createdAt) : new Date(a.createdAt) - new Date(b.createdAt)
        );
        break;
    }

    res.json({
      success: true,
      data: {
        projects: sortedProjects,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: sortedProjects.length,
          hasMore: false
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

// Advanced feature search with filters
export const searchFeatures = async (req, res, next) => {
  try {
    const { q, status, priority, tags, projectId, sortBy = 'vote_count', sortOrder = 'desc', page = 1, limit = 20 } = req.query;
    const userId = req.user.id;

    const where = {
      project: {
        OR: [
          { visibility: 'public' },
          { owner_id: userId },
          { members: { some: { user_id: userId } } }
        ]
      }
    };

    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } }
      ];
    }

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (tags) where.tags = { hasSome: Array.isArray(tags) ? tags : [tags] };
    if (projectId) where.project_id = projectId;

    const features = await prisma.features.findMany({
      where,
      include: {
        author: {
          select: { id: true, name: true, username: true, avatar_url: true }
        },
        project: {
          select: { id: true, title: true, slug: true }
        },
        stage: true,
        _count: {
          select: {
            votes: true,
            comments: true
          }
        }
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: parseInt(limit)
    });

    const total = await prisma.features.count({ where });

    res.json({
      success: true,
      data: {
        features,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          hasMore: total > (page - 1) * limit + parseInt(limit)
        }
      }
    });

  } catch (error) {
    next(error);
  }
};