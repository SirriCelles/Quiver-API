import mongoose from 'mongoose';

const escortSchema = mongoose.Schema({
  //  inherits all User fields via application logic
  userRef: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [
      true,
      'Please provide you full user details to become an escort',
    ],
  },
  services: [
    {
      name: {
        type: String,
        required: true,
        enum: ['tour_guide', 'dining', 'adventure'],
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
            required: [true, 'Start date must be provided for avialable slots'],
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
});

// for any find method, get query including these fields
escortSchema.pre(/^find/, function (next) {
  this.select('services availability availability stats');

  next();
});

const Escort = mongoose.model('Escort', escortSchema);

export default Escort;
