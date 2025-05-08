import Escort from '../models/escort.model.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchError.js';

export const getEscortProfile = (userId) =>
  catchAsync(async (req, res, next) => {
    if (!userId) return next(new AppError('User not defined', 404));

    const escort = await Escort.findOne({ _userRef: userId }).lean();

    console.log(escort);

    return escort;
  });
