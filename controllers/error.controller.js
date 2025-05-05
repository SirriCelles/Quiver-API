import { NODE_ENV } from '../config/env.js';
import AppError from '../utils/appError.js';

const sendDevelopmentError = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack,
  });
};

const sendProductionError = (err, res) => {
  // checking if the error was created by the AppError Class
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    // log error
    console.error('ERROR ', err);

    // send geneic message
    res.status(500).json({
      status: 'error',
      message: 'Something Unexpected occurred!',
    });
  }
};

// handling Invalid IDS
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path} : ${err.value}.`;

  return new AppError(message, 404);
};

// Handle duplicate fields
const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value`;
  return new AppError(message, 400);
};

// Handle Validation Error
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid Input data. ${errors.join(': ')}`;
  return new AppError(message, 400);
};

//
const handleJWTError = () =>
  new AppError('Invalid token. Please login again', 401);

const handleTokenExpiredError = () =>
  new AppError('Expired token. Please login again', 401);

const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (NODE_ENV === 'development') {
    sendDevelopmentError(err, res);
  } else if (NODE_ENV === 'production') {
    // in production send a meaningful error
    let error = { ...err };

    if (err.name === 'CastError') error = handleCastErrorDB(error);
    if (err.code === 11000) error = handleDuplicateFieldsDB(error);
    if (err.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleTokenExpiredError();

    sendProductionError(error, res);
  }
};

export default globalErrorHandler;
