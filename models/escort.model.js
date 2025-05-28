import mongoose, { Schema } from 'mongoose';
// TODO: Remove the services field ad create a services managemet functioality.

const escortSchema = mongoose.Schema(
  {
    //  inherits all User fields via application logic
    _userRef: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [
        true,
        'Please provide you full user details to become an escort',
      ],
    },
    city: [
      {
        type: String,
        required: [true, 'Please provide atleast one city'],
      },
    ],
    services: [
      {
        name: {
          type: String,
          required: true,
        },
        hourlyRate: {
          type: Number,
          required: true,
        },
        description: String,
      },
    ],
    availability: [
      {
        day: {
          type: String,
          enum: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
        },
        slots: [
          {
            start: {
              type: Date,
              required: [
                true,
                'Start date must be provided for avialable slots',
              ],
            },
            end: {
              type: Date,
              required: [true, 'End date must be provided for avialable slots'],
            },
          },
        ],
      },
    ],
    tags: [
      {
        type: String,
        index: true,
      },
    ],
    stats: {
      completedBookings: {
        type: Number,
        default: 0,
      },
      averageRating: {
        type: Number,
        min: 1,
        max: 5,
      },
      responseTime: Number, //Average in minutes
    },
    bookingBuffer: {
      type: Number,
      // Default buffer time in hours before a booking
    },
  },
  { timestamps: true },
);

escortSchema.index({ city: 1 }); // index for city and tags

// for any find method, get query including these fields
escortSchema.pre(/^find/, function (next) {
  this.select('city services availability tags stats');

  next();
});

const Escort = mongoose.model('Escort', escortSchema);

export default Escort;
