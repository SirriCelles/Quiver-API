import Joi from 'joi';
import AppError from '../utils/appError.js';

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
    }),
  ),
}).unknown(false);

const validateUpdateUser = (req, res, next) => {
  const { error } = updateSchema.validate(req.body);

  if (error) return new AppError(error.details[0].message);

  next();
};

export default validateUpdateUser;
