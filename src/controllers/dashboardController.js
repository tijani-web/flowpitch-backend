// controllers/dashboardController.js
import prisma from '../../lib/prisma.js';

// Enhanced Get User Dashboard
export const getUserDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { timeframe = 'week' } = req.query; // week, month, all-time

    // Calculate date ranges for timeframe
    const getDateRange = () => {
      const now = new Date();
      switch (timeframe) {
        case 'week':
          return new Date(now.setDate(now.getDate() - 7));
        case 'month':
          return new Date(now.setMonth(now.getMonth() - 1));
        default:
          return new Date(0); // all time
      }
    };

    const dateRange = getDateRange();

    // 1. USER SUMMARY STATS
    const [
      userProjects,
      userFeatures,
      userVotes,
      userFollowers,
      recentActivity,
      followedProjects,
      weeklyStats
    ] = await Promise.all([
      // Get user's projects
      prisma.projects.findMany({
        where: {
          OR: [
            { owner_id: userId },
            { members: { some: { user_id: userId } } }
          ]
        },
        include: {
          _count: {
            select: {
              features: true,
              followers: true,
              members: true
            }
          },
          features: {
            select: { 
              status: true,
              progress: true,
              vote_count: true
            }
          }
        }
      }),

      // Get user's features
      prisma.features.findMany({
        where: { author_id: userId },
        select: { 
          status: true, 
          vote_count: true,
          progress: true,
          createdAt: true
        }
      }),

      // Get user's votes
      prisma.votes.findMany({
        where: { user_id: userId },
        include: {
          feature: {
            select: { project_id: true }
          }
        }
      }),

      // Get user's followers count
      prisma.followers.count({
        where: { user_id: userId }
      }),

      // Get recent activity (enhanced)
      prisma.activityLogs.findMany({
        where: {
          OR: [
            { user_id: userId },
            { project: { members: { some: { user_id: userId } } } }
          ],
          createdAt: { gte: dateRange }
        },
        include: {
          user: {
            select: { id: true, name: true, username: true, avatar_url: true }
          },
          project: {
            select: { id: true, title: true, slug: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 15
      }),

      // Get followed projects with details
      prisma.followers.findMany({
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
              },
              features: {
                select: {
                  status: true,
                  progress: true
                }
              }
            }
          }
        },
        take: 6
      }),

      // Weekly/Monthly stats
      Promise.all([
        // Features created this period
        prisma.features.count({
          where: { 
            author_id: userId,
            createdAt: { gte: dateRange }
          }
        }),
        // Comments this period
        prisma.comments.count({
          where: { 
            author_id: userId,
            createdAt: { gte: dateRange }
          }
        }),
        // Votes this period
        prisma.votes.count({
          where: { 
            user_id: userId,
            createdAt: { gte: dateRange }
          }
        }),
        // New followers this period
        prisma.followers.count({
          where: { 
            user_id: userId,
            createdAt: { gte: dateRange }
          }
        })
      ])
    ]);

    // 2. CALCULATE ADVANCED METRICS
    const totalProgress = userProjects.reduce((sum, project) => sum + (project.progress || 0), 0);
    const avgProgress = userProjects.length > 0 ? Math.round(totalProgress / userProjects.length) : 0;

    // Engagement Score Calculation (0-100)
    const engagementScore = calculateEngagementScore(userFeatures, userVotes, recentActivity);

    // Feature Status Distribution
    const featureStatus = {
      completed: userFeatures.filter(f => f.status === 'completed').length,
      in_progress: userFeatures.filter(f => f.status === 'in_progress').length,
      under_review: userFeatures.filter(f => f.status === 'under_review').length,
      open: userFeatures.filter(f => f.status === 'open').length,
      rejected: userFeatures.filter(f => f.status === 'rejected').length
    };

    // Project Progress Breakdown
    const projectsProgress = userProjects.slice(0, 5).map(project => ({
      id: project.id,
      title: project.title,
      progress: project.progress || 0,
      color: getProgressColor(project.progress || 0),
      featureCount: project._count.features,
      followerCount: project._count.followers
    }));

    // 3. FORMAT RESPONSE
    res.json({
      success: true,
      data: {
        // User Summary
        summary: {
          totalProjects: userProjects.length,
          totalFeatures: userFeatures.length,
          totalVotes: userVotes.length,
          engagementScore,
          completionRate: userFeatures.length > 0 ? 
            Math.round((featureStatus.completed / userFeatures.length) * 100) : 0,
          followersCount: userFollowers
        },

        // Progress Analytics
        progress: {
          overallProgress: avgProgress,
          projectsProgress,
          featureStatus
        },

        // Recent Activity (enriched)
        recentActivity: recentActivity.map(activity => ({
          id: activity.id,
          type: activity.action,
          user: activity.user,
          project: activity.project,
          timestamp: activity.createdAt,
          metadata: activity.metadata
        })),

        // Projects Overview
        projects: {
          owned: userProjects.filter(p => p.owner_id === userId).slice(0, 6),
          collaborating: userProjects.filter(p => p.owner_id !== userId).slice(0, 6),
          trending: userProjects
            .sort((a, b) => (b._count.followers || 0) - (a._count.followers || 0))
            .slice(0, 3),
          needingAttention: userProjects
            .filter(p => (p.progress || 0) < 30)
            .slice(0, 3)
        },

        // Followed Projects
        followedProjects: followedProjects.map(f => ({
          ...f.project,
          progress: calculateProjectProgress(f.project.features)
        })),

        // Quick Stats (timeframe based)
        quickStats: {
          featuresThisPeriod: weeklyStats[0],
          commentsThisPeriod: weeklyStats[1],
          votesThisPeriod: weeklyStats[2],
          newFollowers: weeklyStats[3],
          timeframe
        },

        // Personal Insights
        insights: generateInsights(userFeatures, userProjects, engagementScore)
      }
    });

  } catch (error) {
    next(error);
  }
};

// Helper Functions
const calculateEngagementScore = (features, votes, activities) => {
  const featureScore = features.length * 2;
  const voteScore = votes.length * 1;
  const activityScore = activities.length * 0.5;
  
  const totalScore = featureScore + voteScore + activityScore;
  return Math.min(100, Math.round(totalScore / 10)); // Normalize to 0-100
};

const getProgressColor = (progress) => {
  if (progress >= 80) return '#10B981'; // green
  if (progress >= 50) return '#F59E0B'; // yellow
  return '#EF4444'; // red
};

const calculateProjectProgress = (features) => {
  if (!features || features.length === 0) return 0;
  const totalProgress = features.reduce((sum, f) => sum + (f.progress || 0), 0);
  return Math.round(totalProgress / features.length);
};

const generateInsights = (features, projects, engagement) => {
  const insights = [];
  
  if (engagement > 80) {
    insights.push("You're highly engaged! Keep up the great work contributing to the community.");
  }
  
  if (features.length > 10) {
    insights.push(`You've suggested ${features.length} features - you're full of ideas!`);
  }
  
  if (projects.length === 0) {
    insights.push("Ready to start your first project? Create one to begin your roadmap journey!");
  }
  
  return insights.slice(0, 3);
};

// Enhanced Get Project Dashboard
export const getProjectDashboard = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    // Enhanced project query with more analytics
    const project = await prisma.projects.findFirst({
      where: {
        id: projectId,
        OR: [
          { visibility: 'public' },
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
        },
        features: {
          select: { 
            status: true,
            priority: true,
            vote_count: true,
            stage_id: true,
            progress: true,
            createdAt: true
          }
        },
        stages: {
          include: {
            _count: {
              select: { features: true }
            },
            features: {
              select: {
                progress: true,
                status: true
              }
            }
          },
          orderBy: { position: 'asc' }
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, username: true, avatar_url: true }
            }
          }
        }
      }
    });

    if (!project) {
      const error = new Error('Project not found or access denied');
      error.status = 404;
      return next(error);
    }

    // Enhanced analytics calculations
    const completionRate = project.features.length > 0 ? 
      Math.round((project.features.filter(f => f.status === 'completed').length / project.features.length) * 100) : 0;

    const avgVotesPerFeature = project.features.length > 0 ? 
      (project.features.reduce((sum, f) => sum + f.vote_count, 0) / project.features.length).toFixed(1) : 0;

    res.json({
      success: true,
      data: {
        project,
        analytics: {
          completionRate,
          avgVotesPerFeature,
          engagementRate: project._count.followers > 0 ? 
            Math.round((project._count.features / project._count.followers) * 100) : 0,
          priorityBreakdown: {
            high: project.features.filter(f => f.priority === 'high').length,
            medium: project.features.filter(f => f.priority === 'medium').length,
            low: project.features.filter(f => f.priority === 'low').length
          }
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

// NEW: Get Dashboard Stats for Charts
export const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { period = '30d' } = req.query; // 7d, 30d, 90d

    // Implementation for chart data
    // This would return data for line charts, bar charts, etc.
    
    res.json({
      success: true,
      data: {
        // Chart data would go here
        activityOverTime: [],
        projectProgress: [],
        featureTrends: []
      }
    });
  } catch (error) {
    next(error);
  }
};