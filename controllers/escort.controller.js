import Escort from '../models/escort.model.js';
import User from '../models/user.model.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchError.js';
import { sanitizeObject } from '../utils/sanitize.js';
import { getAllResource, getResource } from './handleFactory.js';

/**
 * @desc    Get all escorts
 * @route   GET /api/escorts/search
 * @access  Private (Authenticated travelers)
 *
 * @param {string} [gender] - string (e.g., male , female)
 * @param {string} [city] - Comma-seperated city names (e.g., "New York,Los Angeles")
 * @param {number} [minRating] - Minimum rating (1-5)
 * @param {number} [minPrice] - Minimum hourly rate
 * @param {number} [maxPrice] - Maximum hourly rate
 * @param {string} [tags] - Comma-separated tags (e.g., "food,history")
 * @param {string} [languages] - Comma-separated languages (e.g., "en,fr")
 * @param {string} [availability] - ISO date string for availability check
 * @param {number} [page=1] - Pagination page
 * @param {number} [limit=10] - Results per page
 */
export const searchEscorts = catchAsync(async (req, res, next) => {
  const {
    city,
    gender,
    minRating,
    minPrice,
    maxPrice,
    tags,
    languages,
    availability,
    page = 1,
    limit = 5,
  } = req.query;

  // //2. Create Redis cache key
  // const cacheKey = `escorts_search:${location}_${radius}_${JSON.stringify(req.query)}`;

  // //3. Check if data is already cached
  // const cachedData = await redisClient.get(cacheKey);
  // if (cachedData) {
  //   return res.status(200).json({
  //     status: 'success',
  //     data: JSON.parse(cachedData),
  //   });
  // }

  // build the base query for escorts
  const escortQuery = {
    // base Query conditions
  };

  // build user query for population

  // 4. Build query object
  const query = {
    role: 'escort',
    active: true,
  };

  // Gender filter
  if (gender) {
    const genderLower = gender.toLowerCase();
    query['profile.gender'] = { $eq: genderLower };
  }

  // City filter
  if (city) {
    const citiesArray = city.split(',').map((c) => c.trim());
    escortQuery.city = { $in: citiesArray };
  }

  // Rating filter
  if (minRating) {
    const rating = parseFloat(minRating);
    if (isNaN(rating) || rating < 1 || rating > 5) {
      return next(
        new AppError('Invalid minimum rating. Must be between 1 and 5.', 400),
      );
    }
    escortQuery['stats.averageRating'] = { $gte: rating };
  }

  // Price filter
  if (minPrice || maxPrice) {
    escortQuery['services.hourlyRate'] = {};
    if (minPrice) {
      const min = parseFloat(minPrice);
      if (isNaN(min)) {
        return next(new AppError('Invalid minimum price.', 400));
      }
      escortQuery['services.hourlyRate'].$gte = min;
    }
    if (maxPrice) {
      const max = parseFloat(maxPrice);
      if (isNaN(max)) {
        return next(new AppError('Invalid maximum price.', 400));
      }
      escortQuery['services.hourlyRate'].$lte = max;
    }
  }

  // Tags filter (comma-separated string to array)
  if (tags) {
    const tagsArray = tags.split(',').map((tag) => tag.trim());
    escortQuery.tags = { $in: tagsArray };
  }

  // Languages filter (comma-separated string to array)
  if (languages) {
    const languagesArray = languages.split(',').map((lang) => lang.trim());
    query['preferences.language'] = { $in: languagesArray };
  }

  // Availability filter (ISO date string)
  if (availability) {
    const date = new Date(availability);
    if (isNaN(date.getTime())) {
      return next(new AppError('Invalid availability date format.', 400));
    }

    const dayOfTheWeek = date
      .toLocaleString('en-US', { weekday: 'short' })
      .toLowerCase();

    escortQuery['availability'] = {
      $elemMatch: {
        day: dayOfTheWeek,
        slots: {
          $elemMatch: {
            start: { $lte: date },
            end: { $gte: date },
          },
        },
      },
    };
  }

  // 5. Execute the query with pagination
  const skip = (page - 1) * limit;

  // Main query with population of user data

  const results = await Escort.find(escortQuery)
    .populate({
      path: '_userRef',
      select: 'profile location preferences verification',
      match: query,
    })
    .select('city services availability tags stats')
    .sort({ 'stats.averageRating': -1 }) // Sort by highest rating first
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  // filter out results where user population failed
  const filteredResults = results.filter((escort) => escort._userRef);

  // count total matching documents
  const total = await Escort.countDocuments(escortQuery);

  // 6. Prepare response data or Format results
  const formattedResults = filteredResults.map((escort) => {
    const { _userRef, ...escortData } = escort;
    return {
      user: {
        profile: _userRef.profile,
        preferences: _userRef.preferences,
        languages: _userRef.preferences?.languages || [],
        isVerified: _userRef.verification?.isVerified || false,
      },
      ...escortData,
    };
  });

  // Build a response object
  const response = {
    status: 'success',
    results: formattedResults.length,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    },
    data: formattedResults,
  };

  // cache the response data for 15mins
  // await redis.setEx(cacheKey, 900, JSON.stringify(response));

  if (formattedResults.length === 0) {
    return next(new AppError('No escorts found matching your criteria.', 404));
  }

  res.status(200).json(response);
});

export const getEscortById = getResource(Escort);

/**
 * @desc    Create escort profile
 * @route   POST /api/escorts/profile
 * @access  Private (User must be authenticated)
 */

export const createEscortProfile = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  // verify user exist and isn't already an escort
  let user = await User.findById(userId);

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

  // validate required fields
  const { services, availability, tags } = req.body;

  if (!services) {
    return next(new AppError('Please fill out the services section', 400));
  }

  updates.role = 'escort';

  const updatedUser = await User.findByIdAndUpdate(userId, updates, {
    new: true,
    runValidators: true,
  }).lean();

  const isEcortProfile = await Escort.findOne({ _userRef: userId });

  let escortProfile;

  if (isEcortProfile) {
    escortProfile = await Escort.findOneAndUpdate(
      { _userRef: userId },
      updates,
      {
        new: true,
        runValidators: true,
      },
    );
  } else {
    escortProfile = await Escort.create({
      _userRef: userId,
      services,
      availability,
      tags,
    });
  }

  const escortProfileObj = escortProfile.toObject();

  res.status(201).json({
    status: 'success',
    data: {
      ...updatedUser,
      ...escortProfileObj,
    },
  });
});

/**
 * @desc    Search escorts with filters
 * @route   GET /api/escorts/search
 * @access  Private (Authenticated travelers)
 *
 * @param {string} location - "lat,lng" coordinates (required)
 * @param {number} [radius=10] - Search radius in km
 * @param {number} [minRating] - Minimum rating (1-5)
 * @param {number} [minPrice] - Minimum hourly rate
 * @param {number} [maxPrice] - Maximum hourly rate
 * @param {string} [tags] - Comma-separated tags (e.g., "food,history")
 * @param {string} [languages] - Comma-separated languages (e.g., "en,fr")
 * @param {string} [availability] - ISO date string for availability check
 * @param {number} [page=1] - Pagination page
 * @param {number} [limit=10] - Results per page
 */
export const searchEscortsWithLocation = catchAsync(async (req, res, next) => {
  const {
    location,
    radius = 10,
    minRating,
    minPrice,
    maxPrice,
    tags,
    languages,
    availability,
    page = 1,
    limit = 10,
  } = req.query;

  // if (!location) {
  //   return next(
  //     new AppError('Location parameter is required for search.', 400),
  //   );
  // }

  // 1. Validate location format
  // const [lat, lng] = location
  //   .split(',')
  //   .map((coord) => parseFloat(coord.trim()));

  // if (isNaN(lat) || isNaN(lng)) {
  //   return next(
  //     new AppError('Invalid location format. Expected "lat,lng".', 400),
  //   );
  // }

  // validate radius
  const maxRadius = 50; //Set maximum search radius
  const searchRadius = Math.min(Math.abs(radius), maxRadius) * 1000; // Convert km to meters

  // //2. Create Redis cache key
  // const cacheKey = `escorts_search:${location}_${radius}_${JSON.stringify(req.query)}`;

  // //3. Check if data is already cached
  // const cachedData = await redisClient.get(cacheKey);
  // if (cachedData) {
  //   return res.status(200).json({
  //     status: 'success',
  //     data: JSON.parse(cachedData),
  //   });
  // }

  // 4. Build query object
  const query = {
    //Geospatial query
    // location: {
    //   $nearSphere: {
    //     $geometry: {
    //       type: 'Point',
    //       coordinates: [lng, lat], // Note: MongoDB uses lng, lat order
    //     },
    //     $maxDistance: searchRadius,
    //   },
    // },
    role: 'escort',
    active: true,
  };

  // Rating filter
  if (minRating) {
    const rating = parseFloat(minRating);
    if (isNaN(rating) || rating < 1 || rating > 5) {
      return next(
        new AppError('Invalid minimum rating. Must be between 1 and 5.', 400),
      );
    }
    query['stats.averageRating'] = { $gte: rating };
  }

  // Price filter
  if (minPrice || maxPrice) {
    query['services.hourlyRate'] = {};
    if (minPrice) {
      const min = parseFloat(minPrice);
      if (isNaN(min)) {
        return next(new AppError('Invalid minimum price.', 400));
      }
      query['services.hourlyRate'].$gte = min;
    }
    if (maxPrice) {
      const max = parseFloat(maxPrice);
      if (isNaN(max)) {
        return next(new AppError('Invalid maximum price.', 400));
      }
      query['services.hourlyRate'].$lte = max;
    }
  }

  // Tags filter (comma-separated string to array)
  if (tags) {
    const tagsArray = tags.split(',').map((tag) => tag.trim());
    query.tags = { $in: tagsArray };
  }

  // Languages filter (comma-separated string to array)
  if (languages) {
    const languagesArray = languages.split(',').map((lang) => lang.trim());
    query['services.languages'] = { $in: languagesArray };
  }

  // Availability filter (ISO date string)
  if (availability) {
    const date = new Date(availability);
    if (isNaN(date.getTime())) {
      return next(new AppError('Invalid availability date format.', 400));
    }
    query['availability'] = {
      $elemMatch: {
        day: {
          $eq: date.toLocaleString('en-US', { weekday: 'short' }).toLowerCase(),
        },
        slots: {
          $elemMatch: {
            start: { $lte: date },
            end: { $gte: date },
          },
        },
      },
    };
  }

  // 5. Execute the query with pagination
  const skip = (page - 1) * limit;

  // Main query with population of user data
  const results = await Escort.find(query)
    .populate({
      path: '_userRef',
      select: 'profile location preferences verification',
      match: { role: 'escort', active: true },
    })
    .select('services availability tags stats')
    .sort({ 'stats.averageRating': -1 }) // Sort by highest rating first
    .skip(skip)
    .limit(parseInt(limit))
    .lean()
    .hint({ 'user.location': '2dsphere' }); //force geospatial index usage

  // filter out results where user population failed
  const filteredResults = results.filter((escort) => escort._userRef);

  // count total matching documents
  const total = await Escort.countDocuments(query);

  // 6. Prepare response data or Format results
  const formattedResults = filteredResults.map((escort) => {
    const { _userRef, ...escortData } = escort;
    return {
      ...escortData,
      user: {
        profile: _userRef.profile,
        preferences: _userRef.preferences,
        languages: _userRef.preferences?.languages || [],
        isVerified: _userRef.verification?.isVerified || false,
      },
      location: {
        lat: _userRef.location.coordinates[1],
        lng: _userRef.location.coordinates[0],
      },
    };
  });

  // Build a response object
  const response = {
    status: 'success',
    results: formattedResults.length,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    },
    data: formattedResults,
  };

  // cache the response data for 15mins
  // await redis.setEx(cacheKey, 900, JSON.stringify(response));

  if (formattedResults.length === 0) {
    return next(new AppError('No escorts found matching your criteria.', 404));
  }

  res.status(200).json(response);
});
