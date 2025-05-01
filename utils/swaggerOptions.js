import { PORT, SERVER_URL } from '../config/env.js';

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Quiver API',
      version: '1.0.0',
      description: 'API documentation for Quiver server',
    },
    servers: [
      {
        url: `${SERVER_URL}${PORT}`, // Update with your server URL
        description: 'Development server',
      },
    ],
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [{ bearerAuth: [] }],
  // Path to your API routes (files containing JSDoc comments)
  apis: ['./routes/*.js'],
};

export default swaggerOptions;
