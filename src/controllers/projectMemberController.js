// controllers/projectMemberController.js
import prisma from '../../lib/prisma.js';
import crypto from 'crypto';
import { sendInvitationEmail, sendWelcomeEmail } from '../../lib/emailService.js';

// Generate invite token
const generateInviteToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Invite member to project
export const inviteMember = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { email, role } = req.body;
    const userId = req.user.id;

    // Check if user has permission to invite
    const project = await prisma.projects.findFirst({
      where: {
        id: projectId,
        OR: [
          { owner_id: userId },
          { members: { some: { user_id: userId, role: { in: ['owner', 'admin', 'member', 'editor'] } } } }
        ]
      },
      include: {
        owner: {
          select: { name: true, email: true }
        }
      }
    });

    if (!project) {
      const error = new Error('Project not found or insufficient permissions');
      error.status = 404;
      return next(error);
    }

    // Check if user exists
    const invitedUser = await prisma.users.findUnique({
      where: { email }
    });

    // Check if already a member
    const existingMember = await prisma.projectMembers.findFirst({
      where: {
        project_id: projectId,
        OR: [
          { user: { email } },
          ...(invitedUser ? [{ user_id: invitedUser.id }] : [])
        ]
      }
    });

    if (existingMember) {
      const error = new Error('User is already a project member');
      error.status = 409;
      return next(error);
    }

    // Create invite
    const inviteToken = generateInviteToken();
    const invite = await prisma.projectInvites.create({
      data: {
        token: inviteToken,
        email,
        role: role || 'member',
        project_id: projectId,
        invited_by: userId,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    });

    // Send invitation email
    const inviteLink = `${process.env.FRONTEND_URL}/invite/${inviteToken}`;
    
    await sendInvitationEmail(
      email,
      inviteLink,
      project.title,
      project.owner.name
    );

    res.status(201).json({
      success: true,
      message: 'Invitation sent successfully',
      data: { 
        invite: {
          id: invite.id,
          email: invite.email,
          expires_at: invite.expires_at
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

// Accept invite
export const acceptInvite = async (req, res, next) => {
  try {
    const { token } = req.params;
    const userId = req.user.id;

    const invite = await prisma.projectInvites.findFirst({
      where: {
        token,
        expires_at: { gt: new Date() },
        accepted: false
      },
      include: { 
        project: {
          include: {
            owner: {
              select: { name: true, email: true }
            }
          }
        }
      }
    });

    if (!invite) {
      const error = new Error('Invalid or expired invite');
      error.status = 400;
      return next(error);
    }

    // Verify user email matches invite
    const user = await prisma.users.findUnique({
      where: { id: userId }
    });

    if (user.email !== invite.email) {
      const error = new Error('Invite email does not match your account');
      error.status = 400;
      return next(error);
    }

    // Add user as project member
    const member = await prisma.projectMembers.create({
      data: {
        user_id: userId,
        project_id: invite.project_id,
        role: invite.role
      }
    });

    // Mark invite as accepted
    await prisma.projectInvites.update({
      where: { id: invite.id },
      data: { accepted: true, accepted_at: new Date() }
    });

    // Send welcome email
    await sendWelcomeEmail(
      user.email,
      invite.project.title,
      invite.project.owner.name
    );

    // Create activity log
    await prisma.activityLogs.create({
      data: {
        action: 'MEMBER_JOINED',
        user_id: userId,
        project_id: invite.project_id,
        metadata: { role: invite.role }
      }
    });

    res.json({
      success: true,
      message: 'Invite accepted successfully',
      data: { member, project: invite.project }
    });

  } catch (error) {
    next(error);
  }
};

// Get project members
export const getProjectMembers = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const members = await prisma.projectMembers.findMany({
      where: { project_id: projectId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            avatar_url: true
          }
        }
      },
      orderBy: { joinedAt: 'asc' }
    });

    res.json({
      success: true,
      data: members
    });

  } catch (error) {
    next(error);
  }
};

// Update member role
export const updateMemberRole = async (req, res, next) => {
  try {
    const { projectId, memberId } = req.params;
    const { role } = req.body;
    const userId = req.user.id;

    // Check if user has permission
    const currentUserMember = await prisma.projectMembers.findFirst({
      where: {
        project_id: projectId,
        user_id: userId,
        role: { in: ['owner', 'admin'] }
      }
    });

    if (!currentUserMember) {
      const error = new Error('Insufficient permissions');
      error.status = 403;
      return next(error);
    }

    const updatedMember = await prisma.projectMembers.update({
      where: { id: memberId },
      data: { role }
    });

    // Create activity log
    await prisma.activityLogs.create({
      data: {
        action: 'MEMBER_ROLE_UPDATED',
        user_id: userId,
        project_id: projectId,
        metadata: { memberId, newRole: role }
      }
    });

    res.json({
      success: true,
      message: 'Member role updated successfully',
      data: updatedMember
    });

  } catch (error) {
    next(error);
  }
};

// Remove member
export const removeMember = async (req, res, next) => {
  try {
    const { projectId, memberId } = req.params;
    const userId = req.user.id;

    // Check if user has permission
    const currentUserMember = await prisma.projectMembers.findFirst({
      where: {
        project_id: projectId,
        user_id: userId,
        role: { in: ['owner', 'admin'] }
      }
    });

    if (!currentUserMember) {
      const error = new Error('Insufficient permissions');
      error.status = 403;
      return next(error);
    }

    // Cannot remove yourself if you're the only admin/owner
    const memberToRemove = await prisma.projectMembers.findUnique({
      where: { id: memberId },
      include: {
        user: { select: { id: true, name: true } }
      }
    });

    if (memberToRemove.user_id === userId) {
      const error = new Error('Cannot remove yourself from project');
      error.status = 400;
      return next(error);
    }

    await prisma.projectMembers.delete({
      where: { id: memberId }
    });

    // Create activity log
    await prisma.activityLogs.create({
      data: {
        action: 'MEMBER_REMOVED',
        user_id: userId,
        project_id: projectId,
        metadata: { removedMemberId: memberToRemove.user_id }
      }
    });

    res.json({
      success: true,
      message: 'Member removed successfully'
    });

  } catch (error) {
    next(error);
  }
};