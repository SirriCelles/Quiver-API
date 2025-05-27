import express from 'express';
import path from 'path';
import { dirname } from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import expressMongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
// import hpp from 'hpp';
import cors from 'cors';

import { NODE_ENV } from './config/env.js';

import authRouter from './routes/auth.routes.js';
import userRouter from './routes/user.routes.js';
import escortRouter from './routes/escort.routes.js';
import bookingRouter from './routes/booking.routes.js';
import swaggerOptions from './utils/swaggerOptions.js';
import globalErrorHandler from './controllers/error.controller.js';
import AppError from './utils/appError.js';

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(path.resolve(), 'views'));

//Serving static files
app.use(express.static(path.join(dirname, 'public')));

// Enable CORS for all routes
app.use(cors());

// set security HTTP headers
app.use(helmet());

//log APIs in development
if (NODE_ENV === 'development') {
  app.use(logger('dev'));
}

// set maximum request from a given IP
const limiter = rateLimit({
  max: 100,
  windows: 30 * 60 * 1000,
  message: 'Too many requests, Please try again in an hour!',
});

const authLimiter = rateLimit({
  max: 100,
  windowMs: 15 * 60 * 1000,
  message: 'Too many requests, Please try again in an hour!',
});

app.use('/api', limiter);

app.use('/api/v1/auth', authLimiter);

// middle ware to render the body to the request. simply put , it will attach a body json object to
// the incomming request
app.use(express.json({ limit: '10kb' }));

// clean the data from the body
// Data sanitization against NoSQL query injection
app.use(expressMongoSanitize());

// Data sanitization against XSS. Clean user input like forms from malicious html code(cross site scripting)
app.use(xss());

// app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

const specs = swaggerJSDoc(swaggerOptions);

// ROUTES
app.use('/api/v1/auth', authRouter);

app.use('/api/v1/users', userRouter);

app.use('/api/v1/escorts', escortRouter);

app.use('/api/v1/bookings', bookingRouter);

// Serve Swagger UI at /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

app.all('*', (req, res, next) => {
  const error = new AppError(`Resource ${req.originalUrl} not found`, 404);
  next(error);
});

app.use(globalErrorHandler);

export default app;
