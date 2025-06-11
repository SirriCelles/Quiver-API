import mongoose from 'mongoose';
import AppError from '../utils/appError.js';

const bookingSchema = mongoose.Schema(
  {
    userRef: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Booking must belong to a User!'],
    },
    escortRef: {
      type: mongoose.Schema.ObjectId,
      ref: 'Escort',
      required: [true, 'Booking must belong to an Escort!'],
    },
    services: [
      {
        serviceId: {
          type: mongoose.Schema.ObjectId,
          required: [true, 'Booking must be for a specific service!'],
        },
        name: { type: String, required: true },
        hourlyRate: { type: Number, required: true },
        durationHours: { type: Number, required: true },
      },
    ],
    startTime: {
      type: Date,
      required: [true, 'Booking must have a start time!'],
    },
    endTime: {
      type: Date,
      required: [true, 'Booking must have an end time!'],
    },
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled', 'disputed'],
      default: 'pending',
    },
    payment: {
      paymentId: String,
      paymentMethod: {
        type: String,
        enum: ['mtnMomo', 'orangeMomo', 'stripe'],
      },
      status: {
        type: String,
        enum: [
          'pending',
          'held',
          'released',
          'refunded',
          'succeeded',
          'failed',
        ],
        default: 'pending',
      },
    },
    notes: String,
    completedAt: Date,
    cancelledAt: Date,
  },

  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes for efficient querying
bookingSchema.index({ 'services.serviceId': 1 });
bookingSchema.index({ userRef: 1 });
bookingSchema.index({ escortRef: 1 });
bookingSchema.index({ startTime: 1, endTime: 1 });
bookingSchema.index({ status: 1 });

// prevent double bookings
bookingSchema.pre('save', async function (next) {
  const overlappingBooking = await this.constructor.findOne({
    escortRef: this.escortRef,
    status: { $in: ['pending', 'confirmed', 'held'] },
    $or: [
      {
        startTime: { $lt: this.endTime },
        endTime: { $gt: this.startTime },
        status: { $ne: 'cancelled' },
      },
    ],
  });

  if (overlappingBooking) {
    return next(
      new AppError('This booking overlaps with an existing booking.', 400),
    );
  }

  next();
});

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
