import mongoose from 'mongoose';

const escortModel = mongoose.Schema({
  role: {
    type: String,
    default: 'escort',
  },
  phoneNumber: {
    type: Number,
  },
  location: {
    type: Location,
  },
  dateOfBirth: {
    type: Date,
  },
});
