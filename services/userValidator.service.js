import Joi from 'joi';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchError.js';

const updateSchema = Joi.object({
  profile: Joi.object({
    fullName: Joi.string().min(2),
    bio: Joi.string().max(500).allow(''),
  }).unknown(false),
  location: Joi.object({
    lat: Joi.number().min(-90).max(90).required(),
    lng: Joi.number().min(-180).max(180).required(),
  }),
  services: Joi.array().items(
    Joi.object({
      name: Joi.string().valid('tour_guide', 'dining', 'adventure'),
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
}).unknown(false);

const validateUpdateUser = catchAsync(async (req, res, next) => {
  const { error } = updateSchema.validate(req.body);

  if (error) {
    const msg = error.details[0].message;
    return next(new AppError(msg, 400));
  }

  next();
});

export default validateUpdateUser;
