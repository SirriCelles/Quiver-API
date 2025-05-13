import express from 'express';
import { authorize, restrictTo } from '../controllers/auth.controller.js';
import {
  getAllUsers,
  getCurrentUser,
  getUserById,
  updateCurrentUser,
} from '../controllers/user.controller.js';
import validateUpdateUser from '../services/userValidator.service.js';
import { formatLocationToGeoJson } from '../utils/utility.js';

const router = express.Router();

router.route('/:id').get(getUserById); //get public profile, view minimal data

router.use(authorize);

router
  .route('/me')
  .get(authorize, getCurrentUser) //Get USER profile
  .patch(
    authorize,
    restrictTo('user', 'escort'),
    validateUpdateUser,
    formatLocationToGeoJson,
    updateCurrentUser,
  ); //Update USER profile

router.route('/').get(restrictTo('admin'), getAllUsers); //Get all users

export default router;
