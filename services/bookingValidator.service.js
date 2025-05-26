import Joi from 'joi';
import catchAsync from '../utils/catchError.js';
import AppError from '../utils/appError.js';

export const validateBooking = catchAsync(async (req, res, next) => {
  const schema = Joi.object({
    escortRef: Joi.string().required().messages({
      'string.empty': 'Escort reference is required',
      'any.required': 'Escort reference is required',
    }),
    services: Joi.array()
      .items(
        Joi.object({
          name: Joi.string().required().messages({
            'string.empty': 'Service name is required',
            'any.required': 'Service name is required',
          }),
          hourlyRate: Joi.number().required().messages({
            'number.base': 'Hourly rate must be a number',
            'any.required': 'Hourly rate is required',
          }),
        }),
      )
      .required()
      .messages({
        'array.base': 'Services must be an array',
        'array.empty': 'Services cannot be empty',
        'any.required': 'Services are required',
      }),
    startTime: Joi.date().iso().min('now').required(),
    edTime: Joi.date().iso().greater(Joi.ref('startTime')).required().messages({
      'date.base': 'End time must be a valid date',
      'date.greater': 'End time must be after start time',
      'any.required': 'End time is required',
    }),
  }).unknown(true);

  const { error } = schema.validate(req.body);

  if (error) {
    const msg = error.details[0].message;
    return next(new AppError(msg, 400));
  }

  next();
});
