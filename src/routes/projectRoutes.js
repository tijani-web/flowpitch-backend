import express from 'express';
import {
  createProject,
  getMyProjects,
  getProject,
  updateProject,
  deleteProject
} from '../controllers/projectController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { createProjectValidation, updateProjectValidation } from '../middleware/validation.js';
import { uploadProjectLogo } from '../middleware/upload.js';

const router = express.Router();

// All routes protected
router.post('/', authMiddleware, uploadProjectLogo, createProjectValidation, createProject);
router.get('/my-projects', authMiddleware, getMyProjects);
router.get('/:id', getProject); // Public route
router.put('/:id', authMiddleware, uploadProjectLogo, updateProjectValidation, updateProject);
router.delete('/:id', authMiddleware, deleteProject);

export default router;