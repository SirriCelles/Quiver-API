import jwt from 'jsonwebtoken';
import { promisify } from 'util';

import User from '../models/user.model.js';
import catchAsync from '../utils/catchError.js';
import {
  JWT_SECRET,
  JWT_EXPIRES_IN,
  JWT_COOKIE_EXPIRES_IN,
  NODE_ENV,
} from '../config/env.js';
import AppError from '../utils/appError.js';

const signToken = async (id) => {
  const token = await promisify(jwt.sign)({ id }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

  return token;
};

// for security always store JWT in an HTTP cookie and not local storage
// A cokkie is a text that the server can send to the client whane the client recieves a cookie it automatically
// stores this cookie and sends it with all future request
const createAndSendToken = async (user, statusCode, res) => {
  const token = await signToken(user._id);
  const cookieOptions = {
    expires: new Date(Date.now() + JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    //secure = true : only encrypted browsers can access the cookie e.g https
    httpOnly: true, //to prevent csrf , that is browers cannot access and modify the cook
  };

  if (NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token);

  user.password = undefined;

  res.status(statusCode).json({
    status: statusCode === 200 || statusCode === 201 ? 'success' : 'failed',
    token,
    data: {
      user,
    },
  });
};

export const signUp = catchAsync(async (req, res, next) => {
  // get user info from req body
  const user = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  // hash pasword and authenticate user
  await createAndSendToken(user, 201, res);
});

export const signIn = catchAsync(async (req, res, next) => {
  // get user and check if email n password  exist
  const { email, password } = req.body;
  if (!email || !password) {
    const message = 'Email or Passord not provided';
    return next(new AppError(message, 400));
  }

  const user = await User.findOne({ email }).select('+password');

  //get user from db and verify user password
  if (!user || !(await user.verifyPassword(password, user.password))) {
    const message = 'Incorrect email or password';
    return next(new AppError(message, 401));
  }

  // log user in, attach user to req object
  await createAndSendToken(user, 200, res);
});
export const forgotPassword = () => {};
export const resetPassword = () => {};
export const authorize = () => {};
export const updatePassword = () => {};
