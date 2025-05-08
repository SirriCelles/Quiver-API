import jwt from 'jsonwebtoken';
import { promisify } from 'util';
import crypto from 'crypto';

import User from '../models/user.model.js';
import catchAsync from '../utils/catchError.js';
import {
  JWT_SECRET,
  JWT_EXPIRES_IN,
  JWT_COOKIE_EXPIRES_IN,
  NODE_ENV,
} from '../config/env.js';
import AppError from '../utils/appError.js';
import sendEMail from '../utils/email.js';

const signToken = async (id) => {
  const token = await promisify(jwt.sign)({ id }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

  return token;
};

const verifyToken = async (token) => {
  return await promisify(jwt.verify)(token, JWT_SECRET);
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

/**
 * @desc    User can sign up
 * @route   POST /api/v1/auth/signup
 * @access  Public
 */
export const signUp = catchAsync(async (req, res, next) => {
  // get user info from req body
  const user = await User.create({
    profile: req.body.profile,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    // isEscort: req.body.isEscort,
  });

  // hash pasword and authenticate user
  await createAndSendToken(user, 201, res);
});

/**
 * @desc    Login In users
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
export const signIn = catchAsync(async (req, res, next) => {
  // get user and check if email n password  exist
  const { email, password } = req.body;
  if (!email || !password) {
    const message = 'Email or Password not provided';
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

/**
 * @desc    Forgot password
 * @route   POST /api/v1/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = catchAsync(async (req, res, next) => {
  // 1- Get user based on req email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(
      new AppError(`No user with email ${req.body.email} found`, 404),
    );
  }

  // 2- Generate random token
  // to generate random token we will create an instance method on the user
  const resetTokenString = await user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3- send token back as an email
  const resetPwdURL = `${req.protocol}://${req.get('host')}/api/v1/auth/reset-password/${resetTokenString}`;

  const message = `Forgot your password? Submit you new password and
    password confirmation to the link : ${resetPwdURL}. \n If you didn't request
    for a password change, please ignore this email `;

  try {
    await sendEMail({
      email: user.email,
      subject: 'Reset Your Password (Only valid for 10minutes)',
      message,
    });
  } catch (error) {
    console.log(error);
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'There was an error sending email. Please try again later',
        500,
      ),
    );
  }

  res.status(200).json({
    status: 'success',
    message: 'Reset password link sent to your email!',
  });
});

/**
 * @desc    Set a new password via reset link
 * @route   PATCH /api/v1/auth/reset-password
 * @access  Public
 */
export const resetPassword = catchAsync(async (req, res, next) => {
  // get user based on reset token
  const resetToken = req.params.token;

  const hashedToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetTokenExpires: { $gt: Date.now() },
  });

  // if token has not expired and there is user, set the new password
  if (!user) {
    return next(
      new AppError(
        'Reset Token is invalid or has expired. Please Try again',
        400,
      ),
    );
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetTokenExpires = undefined;

  await user.save();

  await createAndSendToken(user, 200, res);
});

/**
 * @desc    User can update their password
 * @route   PATCH /api/v1/auth/change-password
 * @access  Private
 */
export const updatePassword = catchAsync(async (req, res, next) => {
  // when user is logged in, allow them to change password
  const user = await User.findById(req.user._id).select('+password');
  if (!req.user || !user) {
    return next(
      new AppError(
        'Please login to change your password. something went wrong user not found',
        401,
      ),
    );
  }

  const { oldPassword, password, passwordConfirm } = req.body;

  if (!oldPassword)
    return next(
      new AppError(
        'Provide old password to update new one. Did you forget the old password? Then reset your password.',
        401,
      ),
    );

  // check if password is correct
  if (!(await user.verifyPassword(oldPassword, user.password))) {
    const message =
      'Incorrect password. Enter your old password to update the new one';
    return next(new AppError(message, 401));
  }

  // update password
  user.password = password;
  user.passwordConfirm = passwordConfirm;
  await user.save();

  await createAndSendToken(user, 201, res);
});

// AUTHORIZE
export const authorize = catchAsync(async (req, res, next) => {
  // to authorize user,
  let token;
  // Get Token
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) return next(new AppError('Please login to get access', 401));

  // validate token
  // check that token has not  expired
  // get and verify user
  const decoded = await verifyToken(token);
  const authUser = await User.findById(decoded.id);

  if (!authUser)
    return next(new AppError('Invalid token. User no longer exist'), 401);

  // check if user changed password after the jwt was issued
  if (await authUser.checkForChangedPassword(decoded.iat)) {
    return next(
      new AppError(
        'Invalid token. User recently changed password! Please login',
        401,
      ),
    );
  }

  // authorize user
  req.user = authUser;

  next();
});

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403),
      );
    }

    next();
  };
};
