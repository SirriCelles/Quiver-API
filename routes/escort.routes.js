import express from 'express';
import validateUpdateUser from '../services/userValidator.service.js';
import { getUserById } from '../controllers/user.controller.js';
import {
  createEscortProfile,
  searchEscorts,
} from '../controllers/escort.controller.js';
import { authorize, restrictTo } from '../controllers/auth.controller.js';
import { validateSearchQuery } from '../services/validateSearchQuery.service.js';
import { formatLocationToGeoJson } from '../utils/utility.js';

const router = express.Router();

router.use(authorize);

router.route('/search').get(validateSearchQuery, searchEscorts);

//router.route('/').get(getAllEscorts); //get all escort profiles

router.route('/:id').get(getUserById); //get escort public profile by id

// Protect all routes after this middleware
router
  .route('/profile')
  .post(validateUpdateUser, formatLocationToGeoJson, createEscortProfile);

export default router;
