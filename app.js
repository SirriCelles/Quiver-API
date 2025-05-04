import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import { NODE_ENV } from './config/env.js';

import authRouter from './routes/auth.routes.js';
import swaggerOptions from './utils/swaggerOptions.js';
import globalErrorHandler from './controllers/error.controller.js';
import AppError from './utils/appError.js';

const app = express();

//log APIs in development
if (NODE_ENV === 'development') {
  app.use(logger('dev'));
}

// middle ware to render the body to the request. simply put , it will attach a body json object to
// the incomming request
app.use(express.json({ limit: '10kb' }));

// app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

//Serving static files
// app.use(express.static(path.join(__dirname, 'public')));

const specs = swaggerJSDoc(swaggerOptions);

// ROUTES
app.use('/api/v1/auth', authRouter);

// Serve Swagger UI at /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

app.all('*', (req, res, next) => {
  const error = new AppError(`Resource ${req.originalUrl} not found`, 404);
  next(error);
});

app.use(globalErrorHandler);

export default app;
