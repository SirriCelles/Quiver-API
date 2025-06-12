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
  getEscortBookings,
  getMyBookings,
  verifyPayment,
} from '../controllers/booking.controller.js';

const router = express.Router();

router.use(authorize);

// User routes
router
  .route('/create-checkout-session')
  .post(restrictTo('user'), validateBooking, createBooking);
router.get('/verify/:sessionId', verifyPayment);
router.get('/my-bookings', getMyBookings);
router.post('/:id/dispute', restrictTo('user'), disputeBooking);

// Escort routes
router.get('/escort-bookings', restrictTo('escort'), getEscortBookings);
router.patch('/:id/confirm', restrictTo('escort'), confirmBooking);

// Shared routes
router.get('/:id', getBooking);
router.patch('/:id/cancel', cancelBooking);
router.patch('/:id/complete', completeBooking);

export default router;
