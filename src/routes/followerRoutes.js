import express from 'express';
import {
  followProject,
  unfollowProject,
  getFollowedProjects,
  getProjectFollowers
} from '../controllers/followerController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/projects/:projectId/follow', authMiddleware, followProject);
router.delete('/projects/:projectId/follow', authMiddleware, unfollowProject);
router.get('/users/followed-projects', authMiddleware, getFollowedProjects);
router.get('/projects/:projectId/followers', authMiddleware, getProjectFollowers);

export default router;