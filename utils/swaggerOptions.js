import { PORT, SERVER_URL } from '../config/env.js';

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Quiver API',
      version: '1.0.0',
      description: 'API documentation for Quiver server',
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
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
      // 👈 JWT Auth Setup
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT token in format: **Bearer <token>**',
      },
    },
    schemas: {
      // User Schema
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: '507f1f77bcf86cd799439011',
          },
          name: {
            type: 'string',
            example: 'John Doe',
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2023-05-01T12:00:00Z',
          },
        },
      },
      // Error Schema
      Error: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'Error message',
          },
          status: {
            type: 'integer',
            example: 400,
          },
        },
      },
      // Generic Response Schema
      SuccessResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          data: {
            type: 'object',
            description: 'Response data',
          },
        },
      },
    },
  },
  // security: [{ bearerAuth: [] }],
  // // Path to your API routes (files containing JSDoc comments)
  apis: ['./routes/*.js'],
};

export default swaggerOptions;
