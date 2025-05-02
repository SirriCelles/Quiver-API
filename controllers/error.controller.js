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

const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (NODE_ENV === 'development') {
    sendDevelopmentError(err, res);
  } else if (NODE_ENV === 'production') {
    // in production send a meaningful error
    let error = { ...err };

    sendProductionError(err, res);
  }
};
