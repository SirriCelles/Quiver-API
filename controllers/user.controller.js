import Escort from '../models/escort.model.js';
import User from '../models/user.model.js';
import { getEscortProfile } from '../services/escort.service.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchError.js';
import { sanitizeObject } from '../utils/sanitize.js';

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
 * @route   GET /api/v1/users/me
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

/**
 * @desc    Update current user's profile
 * @route   PATCH /api/v1/users/me
 * @access  Private
 */
export const updateCurrentUser = catchAsync(async (req, res, next) => {
  // Do not allow direct role/password update via this endpoint
  const { role, password, passwordConfirm, verification, ...safeUpdates } =
    req.body;

  // Sanitize input (remove undefined/empty values)
  const updates = sanitizeObject(safeUpdates);

  // Handle location format conversion (lat/lng -> GeoJSON )
  if (updates.location) {
    updates.location = {
      type: 'Point',
      coordinates: [updates.location.lng, updates.location.lat],
    };
  }

  // Update base user document
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { $set: updates },
    { new: true, runValidators: true },
  );

  if (!user) {
    return new AppError('User update failed, User not found', 404);
  }

  // Handle Escort-Specific Update
  let escortData;
  if (
    user.role === 'escort' &&
    (updates.services || updates.availabilit || updates.tags)
  ) {
    escortData = await Escort.findByIdAndUpdate(
      { userRef: user._id },
      { $set: updates },
      { new: true, runValidators: true },
    );
  }

  // response
  const response = {
    status: 'success',
    data: {
      ...user.toObject(),
      ...(escortData ? escortData.toObject() : {}),
      location: {
        //convert back to client format
        lat: user.location.coordinates[1],
        lng: user.location.coordinates[0],
      },
    },
  };

  res.status(200).json(response);
});
