import express from 'express';
import { authorize, restrictTo } from '../controllers/auth.controller.js';
import { validateBooking } from '../services/bookingValidator.service.js';
import { createBooking } from '../controllers/booking.controller.js';

const router = express.Router();

router.use(authorize);

// Traveler routes
router.route('/').post(restrictTo('user'), validateBooking, createBooking);
