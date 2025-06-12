import Stripe from 'stripe';
import Escort from '../models/escort.model.js';
import Booking from '../models/booking.model.js';
import catchAsync from '../utils/catchError.js';
import AppError from '../utils/appError.js';
import { STRIPE_SECRET_KEY } from '../config/env.js';

const stripe = new Stripe(STRIPE_SECRET_KEY);

const checkBufferTime = async (escortId, startTime, bufferHours) => {
  const bufferEnd = new Date(startTime);
  bufferEnd.setHours(bufferEnd.getHours() - bufferHours);

  const conflictingBookings = await Booking.find({
    escortRef: escortId,
    endTime: { $gt: bufferEnd },
    startTime: { $lt: startTime },
    status: { $in: ['confirmed', 'pending'] },
  });

  return conflictingBookings.length === 0;
};

/**
 * @desc    Create new booking with escrow payment
 * @route   POST /api/v1/bookings
 * @access  Private (User)
 */
// when a customer is ready to book an escort, your create a new checkout session
// Show embedded checkout form to the customer from the front end
// customers enter their payment details and submit the form
// after the transaction is successful, the checkout.session.completed webhook event is triggers the order fulfillment process

export const createBooking = catchAsync(async (req, res, next) => {
  console.log(req.body);
  const { escortId, services, startTime, notes, duration } = req.body;
  const userId = req.user.id;
  if (!escortId || !services.length === 0) {
    return next(new AppError('Escort ID and Service ID are required', 400));
  }

  // validate escort
  const escort = await Escort.findById(escortId).populate('_userRef');
  if (!escort) {
    return next(new AppError('Escort not found', 404));
  }

  // Validate services and calculate amount
  let totalAmount = 0;
  let totalDuration = 0;
  const bookingServices = [];
  const serviceIds = [];

  for (const serviceRef of services) {
    // const service = escort.services.find(_id === serviceRef._id);
    // if (!service) {
    //   return next(new AppError(`Service ${serviceRef.name} not found`, 404));
    // }

    // calaculate duration for each service (could be same or different durations)
    // const duration = serviceRef?.duration;
    // const sduration = duration;
    totalDuration += duration;
    totalAmount += duration * serviceRef.hourlyRate;

    serviceIds.push(serviceRef._id);

    bookingServices.push({
      serviceId: serviceRef._id,
      name: serviceRef.name,
      hourlyRate: serviceRef.hourlyRate,
      durationHours: duration,
    });
  }

  // Calculate endTime based on total duration
  const endTime = new Date(startTime);
  endTime.setHours(endTime.getHours() + totalDuration);

  // check buffer time
  const hasBufferTime = await checkBufferTime(
    escortId,
    new Date(startTime),
    escort.bookingBuffer ? escort.bookingBuffer : 2,
  );
  if (!hasBufferTime) {
    return next(
      new AppError(
        `This escort requires ${escort.bookingBuffer || 2} hours notice for bookings`,
        400,
      ),
    );
  }

  // Calculate amount
  const amount = Math.round(totalAmount * 100); // in cents

  //create a stripe checkout session
  const session = await stripe.checkout.sessions.create({
    ui_mode: 'embedded',
    client_reference_id: escort.email,
    customer_email: req.user.email,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Service for Escort ${escort._userRef.profile.fullName} with ID: ${escortId}`,
            description: `Services: ${bookingServices.map((s) => s.name).join(', ')}`,
          },
          amount: amount,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    // return_url: `${req.protocol}://${req.get('host')}/api/v1/bookings/checkout/sessions/success?session_id={CHECKOUT_SESSION_ID}`,
    return_url: `http://localhost:5173/booking/success?session_id={CHECKOUT_SESSION_ID}`,
    metadata: {
      escortId: escort._userRef._id,
      serviceIds: serviceIds.join(','),
      startTime,
      endTime,
      // bookingId: booking._id.toString(),
    },
  });

  const booking = await Booking.create({
    userRef: req.user.id,
    escortRef: escortId,
    services: bookingServices,
    startTime,
    endTime,
    totalAmount,
    payment: {
      paymentId: session.id,
      paymentMethod: 'stripe',
    },
    notes,
  });

  res.status(201).json({
    status: 'success',
    data: {
      booking,
      clientSecret: session.client_secret,
    },
  });
});

/**
 * @desc    Verify booking payment
 * @route   GET /api/v1/bookings/verify/:sessionId
 * @access  Private
 */
export const verifyPayment = catchAsync(async (req, res, next) => {
  const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);

  if (session.payment_status !== 'paid') {
    return res.status(400).json({
      status: 'pending',
      message: 'Payment not completed',
    });
  }

  // Update booking status
  const booking = await Booking.findOneAndUpdate(
    { 'payment.paymentId': session.id },
    { status: 'confirmed' },
    { new: true },
  );

  res.status(200).json({
    status: 'success',
    data: {
      status: session.payment_status,
      booking,
    },
  });
});

/**
 * @desc Escort Confirms booking
 * @route PATCH /api/v1/bookings/:id/confirm
 * @access Private (Escort)
 */
export const confirmBooking = catchAsync(async (req, res, next) => {
  const booking = await Booking.findById(req.params.bookingId);

  if (!booking) {
    return next(new AppError('Booking not found', 404));
  }

  if (booking.escortRef.toString() !== req.user.id) {
    return next(new AppError('Not authorized to confirm!', 403));
  }

  booking.status = 'confirmed';
  await booking.save();

  res.status(200).json({
    status: 'success',
    data: { booking },
  });
});

export const getBooking = catchAsync(async (req, res, next) => {});

export const completeBooking = catchAsync(async (req, res, next) => {});

export const getMyBookings = catchAsync(async (req, res, next) => {});

export const cancelBooking = catchAsync(async (req, res, next) => {});

export const getEscortBookings = catchAsync(async (req, res, next) => {});

export const disputeBooking = catchAsync(async (req, res, next) => {});

export const setBookingBuffer = catchAsync(async (req, res, next) => {});
