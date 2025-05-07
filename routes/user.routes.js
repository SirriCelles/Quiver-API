import express from 'express';
import { authorize } from '../controllers/auth.controller.js';
import { getCurrentUser } from '../controllers/user.controller.js';

const router = express.Router();

router.route('/:id').get(); //get public profile, view minimal data

router.use(authorize);

router
  .route('/me')
  .get(getCurrentUser) //Get USER profile
  .patch(); //Update USER profile

router.route('/me/location').put(); //Update user location lat/lng
