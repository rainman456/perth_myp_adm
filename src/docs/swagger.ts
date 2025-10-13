import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Admin API',
      version: '1.0.0',
      description: 'API for merchant admin panel',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 8080}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        AdminAuth: {
          type: 'http',
          scheme: 'Admin',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ AdminAuth: [] }],  // Global auth for protected routes
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],  // Scan for JSDoc
};

export const specs = swaggerJsdoc(options);