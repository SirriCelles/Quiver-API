import mongoose from 'mongoose';

const bookingSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Booking must belong to a User!'],
    },
    escort: {
      type: mongoose.Schema.ObjectId,
      ref: 'Escort',
      required: [true, 'Booking must belong to an Escort!'],
    },
    service: {
      type: mongoose.Schema.ObjectId,
      ref: 'Service',
      required: [true, 'Booking must be for a specific Service!'],
    },
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
