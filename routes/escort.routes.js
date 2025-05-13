import express from 'express';
import validateUpdateUser from '../services/userValidator.service.js';
import {
  createEscortProfile,
  getUserById,
} from '../controllers/user.controller.js';
import { getAllEscorts } from '../controllers/escort.controller.js';
import { authorize } from '../controllers/auth.controller.js';

const router = express.Router();

router.use(authorize);

router.route('/').get(getAllEscorts); //get all escort profiles
router.route('/:id').get(getUserById); //get escort profile by id

// Protect all routes after this middleware
router.route('/profile').post(validateUpdateUser, createEscortProfile);

export default router;
