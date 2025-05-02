class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    // this.message = message;
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true; //tho only send operational errors to the client

    // capture the stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
