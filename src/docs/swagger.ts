import type { Options } from 'swagger-jsdoc';

export const specs: Options = {
  definition: {
    openapi: '3.1.0',
    info: {
      title: 'Admin API',
      version: '1.0.0',
      description: 'API for ARONOVA',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 8080}/api`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        AdminAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ AdminAuth: [] }],
  },
  apis: ['./src/routes/**/*.ts', './src/controllers/**/*.ts','./src/models/*.ts'], 
};






// src/docs/swagger.ts
// import type { Options } from 'swagger-jsdoc';

// export const specs: Options = {
//   definition: {
//     openapi: '3.0.0',  // Or '3.1.0' for OpenAPI 3.1
//     info: {
//       title: 'Admin API',
//       version: '1.0.0',
//       description: 'API documentation generated from JSDoc/Swagger annotations in controllers and routes',
//       contact: {
//         name: 'API Support',
//         email: 'support@example.com',
//       },
//     },
//     servers: [
//       {
//         url: 'http://localhost:3000',
//         description: 'Development server',
//       },
//       {
//         url: 'https://api.example.com',
//         description: 'Production server',
//       },
//     ],
//     components: {
//       securitySchemes: {
//         BearerAuth: {
//           type: 'http',
//           scheme: 'bearer',
//           bearerFormat: 'JWT',
//         },
//       },
//     },
//   },
//   apis: [
//     './src/controllers/**/*.ts',  // Scan controllers for @swagger annotations
//     './src/routes/**/*.ts',       // Include routes if they have annotations
//     // Add more patterns if needed, e.g., './src/services/**/*.ts'
//   ],
// };

