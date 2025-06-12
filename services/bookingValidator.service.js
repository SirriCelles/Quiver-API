import Joi from 'joi';
import catchAsync from '../utils/catchError.js';
import AppError from '../utils/appError.js';

const schema = Joi.object({
  escortId: Joi.string().required().messages({
    'string.empty': 'Escort reference is required',
    'any.required': 'Escort reference is required',
  }),
  // services: Joi.array()
  //   .items(
  //     Joi.object({
  //       id: Joi.string().required(),
  //       name: Joi.string().required().messages({
  //         'string.empty': 'Service name is required',
  //         'any.required': 'Service name is required',
  //       }),
  //       hourlyRate: Joi.number().required().messages({
  //         'number.base': 'Hourly rate must be a number',
  //         'any.required': 'Hourly rate is required',
  //       }),
  //     }),
  //   )
  //   .required()
  //   .messages({
  //     'array.base': 'Services must be an array',
  //     'array.empty': 'Services cannot be empty',
  //     'any.required': 'Services are required',
  //   }),
  startTime: Joi.date().iso().min('now').required(),
  notes: Joi.string().max(500).allow(''),
}).unknown(true);

export const validateBooking = catchAsync(async (req, res, next) => {
  console.log(req.body);
  const { error } = schema.validate(req.body);

  if (error) {
    const msg = error.details[0].message;
    return next(new AppError(msg, 400));
  }

  next();
});

export const validateBuffer = catchAsync(async (req, res, next) => {
  const schema = Joi.object({
    hours: Joi.number().integer().min(0).max(24).required(),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }

  next();
});
