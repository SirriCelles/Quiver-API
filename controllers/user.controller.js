import mongoose from 'mongoose';
import Escort from '../models/escort.model.js';
import User from '../models/user.model.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchError.js';
import { sanitizeObject } from '../utils/sanitize.js';
import {
  calculateAge,
  formatLocationToClient,
  formatLocationToGeoJson,
} from '../utils/utility.js';

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
    return next(new AppError('User not found', 404));
  }

  // Role based data filtering
  let responseData;
  if (user.role === 'escort') {
    // const escortProfile = await getEscortProfile(user._id);

    const escortProfile = await Escort.findOne({ _userRef: user._id }).lean();
    responseData = { ...user, ...escortProfile };
  } else {
    responseData = user;
  }

  // Format location data for client
  if (user.location?.coordinates) {
    responseData.location = formatLocationToClient(user.location);
  }

  res.status(200).json({
    status: 'success',
    data: {
      ...responseData,
    },
  });
});

/**
 * @desc    Create escort profile
 * @route   POST /api/user/escort/profile
 * @access  Private (User must be authenticated)
 */

export const createEscortProfile = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  // verify user exist and isn't already an escort
  const user = await User.findById(userId);

  if (!user)
    return next(new AppError('You must sign up to become an escort', 404));

  const {
    role,
    password,
    passwordConfirm,
    verification,
    stats,
    ...safeUpdates
  } = req.body;

  // Sanitize input (remove undefined/empty values)
  let updates = sanitizeObject(safeUpdates);

  updates.role = 'escort';

  // validate required fields
  const { services, availability, tags } = req.body;

  if (!services) {
    return next(new AppError('Please fill out the services section', 400));
  }

  const updatedUser = await User.findByIdAndUpdate(userId, updates, {
    new: true,
    runValidators: true,
  }).lean();

  const escortProfile = await Escort.create({
    _userRef: userId,
    services,
    availability,
    tags,
  }).lean();

  res.status(201).json({
    status: 'success',
    data: {
      ...updatedUser,
      ...escortProfile,
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
  const {
    role,
    password,
    passwordConfirm,
    verification,
    stats,
    ...safeUpdates
  } = req.body;

  // Sanitize input (remove undefined/empty values)
  let updates = sanitizeObject(safeUpdates);

  // Update base user document
  const user = await User.findByIdAndUpdate(req.user.id, updates, {
    new: true,
    runValidators: true,
  }).lean();

  if (!user) {
    return next(new AppError('User update failed, User not found', 404));
  }

  // Handle Escort-Specific Update
  let escortProfile;
  if (
    user.role === 'escort' &&
    (updates.services || updates.availability || updates.tags)
  ) {
    escortProfile = await Escort.findOneAndUpdate(
      { _userRef: user._id },
      updates,
      {
        new: true,
        runValidators: true,
      },
    ).lean();
  }

  // response
  const response = {
    status: 'success',
    data: {
      ...user,
      ...escortProfile,
    },
  };

  res.status(200).json(response);
});

/**
 * @desc    Get user by ID (public profile view)
 * @route   GET /api/v1/users/:id
 * @access  Public (with restricted data for non-authenticated users)
 */
export const getUserById = catchAsync(async (req, res, next) => {
  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return next(new AppError('Invalid user ID', 400));
  }

  // Fetch user data
  const user = await User.findById(req.params.id).lean();

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  const publicProfile = {
    id: user._id,
    aga: calculateAge(user.profile?.dateOfBirth) || null,
    profile: {
      fullName: user.profile.fullName,
      bio: user.profile.bio,
      dateOfBirth: user.profile.dateOfBirth,
      gender: user.profile.gender,
      imageName: user.profile.imageName,
      imageUrl: user.profile.imageUrl,
    },
    role: user.role,
    createdAt: user.createdAt,
    preferences: user.preferences,
  };

  // If User is viewing thier profile or that of an escort
  if (user.role === 'escort') {
    publicProfile.location = user.location;
  }

  // Add escort specific data if user is an escort
  if (user.role === 'escort') {
    const escortProfile = await Escort.findOne({
      _userRef: req.params.id,
    }).lean();

    publicProfile.escortProfile = {
      services: escortProfile.services,
      tags: escortProfile?.tags,
      availability: escortProfile.availability,
      stats: escortProfile?.stats || { completeBookings: 0 },
    };
  }

  res.status(200).json({
    status: 'success',
    data: {
      publicProfile,
    },
  });
});
