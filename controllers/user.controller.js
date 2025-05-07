import User from '../models/user.model.js';
import { getEscortProfile } from '../services/escort.service.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchError.js';

const formatLocation = (location) => {
  const locat = {
    lat: location.coordinates[1],
    lng: location.coordinates[0],
  };

  return locat;
};

export const createUser = async (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not deffined! Please use /signup instead',
  });
};

/**
 * @desc    Get current authenticated user's profile
 * @route   GET /api/users/me
 * @access  Private (All roles)
 */
export const getCurrentUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).lean();

  if (!user) {
    return new AppError('User not found', 404);
  }

  // Role based data filtering
  let responseData;
  if (user.role === 'escort') {
    const escortProfile = getEscortProfile(user._id);
    responseData = { ...user, ...escortProfile };
  } else {
    responseData = user;
  }

  // Format location data for client
  if (user.location?.coordinates) {
    responseData.location = formatLocation(user.location);
  }

  res.status(200).json({
    status: 'success',
    data: {
      responseData,
    },
  });
});
