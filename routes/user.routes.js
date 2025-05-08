import express from 'express';
import { authorize, restrictTo } from '../controllers/auth.controller.js';
import {
  getCurrentUser,
  updateCurrentUser,
} from '../controllers/user.controller.js';
import validateUpdateUser from '../services/userValidator.service.js';

const router = express.Router();

router.route('/:id').get(); //get public profile, view minimal data

router.use(authorize);

router
  .route('/me')
  .get(authorize, getCurrentUser) //Get USER profile
  .patch(
    authorize,
    restrictTo('user', 'escort'),
    validateUpdateUser,
    updateCurrentUser,
  ); //Update USER profile

router.route('/me/location').put(); //Update user location lat/lng

export default router;
