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

export const proccessedAvailability = (availability) => {
  const proccessedValue = availability.map((day) => {
    return {
      day: day.day,
      slots: day.slots.map((slot) => ({
        start: new Date(slot.start),
        end: new Date(slot.start),
      })),
    };
  });

  return proccessedValue;
};
