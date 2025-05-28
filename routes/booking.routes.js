import express from 'express';
import { authorize, restrictTo } from '../controllers/auth.controller.js';
import { validateBooking } from '../services/bookingValidator.service.js';
import {
  cancelBooking,
  completeBooking,
  confirmBooking,
  createBooking,
  disputeBooking,
  getBooking,
  getCheckoutSession,
  getEscortBookings,
  getMyBookings,
} from '../controllers/booking.controller.js';

const router = express.Router();

router.use(authorize);

// User routes
router.route('/').post(restrictTo('user'), validateBooking, createBooking);
router.get('/my-bookings', getMyBookings);
router.post('/:id/dispute', restrictTo('user'), disputeBooking);

// Escort routes
router.get('/escort-bookings', restrictTo('escort'), getEscortBookings);
router.patch('/:id/confirm', restrictTo('escort'), confirmBooking);

// Shared routes
router
  .route('/:id')
  .get(getBooking)
  .patch('/cancel', cancelBooking)
  .patch('/complete', completeBooking);

export default router;
