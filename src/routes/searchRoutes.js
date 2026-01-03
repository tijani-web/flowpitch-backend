import express from 'express';
import {
  globalSearch,
  searchProjects,
  searchFeatures,
  publicProjectSearch
} from '../controllers/searchController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/search', authMiddleware, globalSearch);
router.get('/search/projects', authMiddleware, searchProjects);
router.get('/search/features', authMiddleware, searchFeatures);
router.get('/search/public/projects', publicProjectSearch);

export default router;