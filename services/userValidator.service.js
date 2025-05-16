import Joi from 'joi';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchError.js';

const updateSchema = Joi.object({
  profile: Joi.object({
    fullName: Joi.string().min(2),
    bio: Joi.string().max(500).allow(''),
    imageName: Joi.string().allow(''),
    imageUrl: Joi.string().allow(''),
    dateOfBirth: Joi.date().max('now').messages({
      'date.max': 'Date of birth cannot be in the future',
    }),
    gender: Joi.string()
      .lowercase()
      .valid('male', 'female', 'non-binary', 'other', 'prefer not to say')
      .messages({
        'string.lowercase': 'Gender must be lowercase',
        'any.only':
          'Gender must be one of: male, female, other, prefer not to say',
      }),
  }).unknown(true),
  location: Joi.object({
    lat: Joi.number().min(-90).max(90),
    lng: Joi.number().min(-180).max(180),
  }),
  city: Joi.array().items(Joi.string()),
  services: Joi.array().items(
    Joi.object({
      name: Joi.string(),
      hourlyRate: Joi.number().min(5),
      description: Joi.string(),
    }),
  ),
  availability: Joi.array().items(
    Joi.object({
      day: Joi.string().valid('mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'),
      slots: Joi.array().items(
        Joi.object({
          start: Joi.date(),
          end: Joi.date(),
        }),
      ),
    }),
  ),
  tags: Joi.array(),
}).unknown(true);

const validateUpdateUser = catchAsync(async (req, res, next) => {
  const { error } = updateSchema.validate(req.body);

  if (error) {
    const msg = error.details[0].message;
    return next(new AppError(msg, 400));
  }

  next();
});

export default validateUpdateUser;
