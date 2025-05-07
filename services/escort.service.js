import Escort from '../models/escort.model.js';
import catchAsync from '../utils/catchError.js';

export const getEscortProfile = (userId) =>
  catchAsync(async (req, res, next) => {
    await Escort.findOne({ userRef: userId }).lean();
  });
