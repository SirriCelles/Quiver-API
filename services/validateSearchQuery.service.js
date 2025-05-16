import Joi from 'joi';
import catchAsync from '../utils/catchError.js';
import AppError from '../utils/appError.js';

export const validateSearchQuery = catchAsync(async (req, res, next) => {
  const schema = Joi.object({
    city: Joi.string()
      .pattern(/^[a-zA-Z,]+$/)
      .messages({
        'string.pattern.base': 'City name must contain only letters and commas',
      }),
    gender: Joi.string().pattern(
      /^(male|female|non-binary|other|prefer not to say)$/,
    ),
    minRating: Joi.number().min(1).max(5),
    minPrice: Joi.number().min(0),
    maxPrice: Joi.number().min(Joi.ref('minPrice')),
    tags: Joi.string().pattern(/^[a-zA-Z0-9,]+$/),
    languages: Joi.string().pattern(/^[a-zA-Z,]+$/),
    availability: Joi.date().iso(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
  });

  const { error } = schema.validate(req.query);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }

  next();
});

export const validateSearchLocationQuery = catchAsync(
  async (req, res, next) => {
    const schema = Joi.object({
      location: Joi.string()
        .pattern(/^-?\d+\.\d+,-?\d+\.\d+$/)
        .required(),
      radius: Joi.number().min(1).max(50).default(10),
      minRating: Joi.number().min(1).max(5),
      minPrice: Joi.number().min(0),
      maxPrice: Joi.number().min(Joi.ref('minPrice')),
      tags: Joi.string().pattern(/^[a-zA-Z0-9,]+$/),
      languages: Joi.string().pattern(/^[a-zA-Z,]+$/),
      availability: Joi.date().iso(),
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(10),
    });

    const { error } = schema.validate(req.query);
    if (error) {
      return next(new AppError(error.details[0].message, 400));
    }

    next();
  },
);
