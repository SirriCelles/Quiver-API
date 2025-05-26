import express from 'express';
import { authorize, restrictTo } from '../controllers/auth.controller.js';

const router = express.Router();

router.use(authorize);

// Traveler routes
router.route('/').post(restrictTo('user'));
