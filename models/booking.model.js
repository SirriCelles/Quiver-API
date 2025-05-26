import mongoose from 'mongoose';
import AppError from '../utils/appError';

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
        name: String,
        hourlyRate: {
          type: Number,
          required: true,
        },
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

    payment: {
      paymentIntentId: String,
      paymentMethod: {
        type: String,
        enum: ['mtnMomo', 'orangeMomo', 'card', 'cash', 'bankTransfer'],
        default: 'card',
      },
      amount: {
        type: Number,
        required: [true, 'Booking must have a payment amount!'],
      },
      currency: {
        type: String,
        enum: ['XAF', 'USD', 'EUR'],
        default: 'XAF',
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
    status: {
      type: String,
      enum: [
        'pending',
        'confirmed',
        'completed',
        'cancelled',
        'held',
        'disputed',
      ],
      default: 'pending',
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

// Indexes
bookingSchema.index({ escort: 1, startTime: 1 });
bookingSchema.index({ user: 1, status: 1 });

// prevent double bookings
bookingSchema.pre('save', async function (next) {
  const overlappingBooking = await this.constructor.findOne({
    escort: this.escort,
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
