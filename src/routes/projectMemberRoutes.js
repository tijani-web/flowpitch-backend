import express from 'express';
import {
  inviteMember,
  acceptInvite,
  getProjectMembers,
  updateMemberRole,
  removeMember
} from '../controllers/projectMemberController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { inviteValidation, updateRoleValidation } from '../middleware/validation.js';

const router = express.Router();

router.post('/:projectId/invites', authMiddleware, inviteValidation, inviteMember);
router.post('/invites/:token/accept', authMiddleware, acceptInvite);
router.get('/:projectId/members', getProjectMembers);
router.put('/:projectId/members/:memberId', authMiddleware, updateRoleValidation, updateMemberRole);
router.delete('/:projectId/members/:memberId', authMiddleware, removeMember);

export default router;