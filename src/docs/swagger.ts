// import type { Options } from 'swagger-jsdoc';

// export const specs: Options = {
//   definition: {
//     openapi: '3.1.0',
//     info: {
//       title: 'Admin API',
//       version: '1.0.0',
//       description: 'API for ARONOVA',
//     },
//     servers: [
//       {
//         url: `http://localhost:${process.env.PORT || 8080}/api`,
//         description: 'Development server',
//       },
//     ],
//     components: {
//       securitySchemes: {
//         AdminAuth: {
//           type: 'http',
//           scheme: 'bearer',
//           bearerFormat: 'JWT',
//         },
//       },
//     },
//     security: [{ AdminAuth: [] }],
//   },
//   apis: ['./src/routes/**/*.ts', './src/controllers/**/*.ts','./src/models/*.ts'], 
// };






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



// src/docs/swagger.ts
import type { Options } from 'swagger-jsdoc';

export const specsOptions: Options = {
  definition: {
    openapi: '3.0.0', // 3.0.0 is safe for most swagger-ui versions
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
      schemas: {
        // User schemas
        UserCreate: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com'
            },
            name: {
              type: 'string',
              example: 'John Doe'
            },
            country: {
              type: 'string',
              example: 'Nigeria'
            }
          },
          required: ['email', 'name']
        },
        UserUpdate: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com'
            },
            name: {
              type: 'string',
              example: 'John Smith'
            },
            country: {
              type: 'string',
              example: 'Ghana'
            }
          }
        },
        // Merchant schemas
        MerchantCreate: {
          type: 'object',
          properties: {
            storeName: {
              type: 'string',
              example: 'Tech Gadgets Store'
            },
            name: {
              type: 'string',
              example: 'Jane Smith'
            },
            personalEmail: {
              type: 'string',
              format: 'email',
              example: 'jane@example.com'
            },
            workEmail: {
              type: 'string',
              format: 'email',
              example: 'info@techgadgets.com'
            },
            phoneNumber: {
              type: 'string',
              example: '+2341234567890'
            },
            businessType: {
              type: 'string',
              example: 'Retail'
            },
            website: {
              type: 'string',
              format: 'uri',
              example: 'https://techgadgets.com'
            },
            businessDescription: {
              type: 'string',
              example: 'Selling the latest tech gadgets'
            },
            businessRegistrationNumber: {
              type: 'string',
              example: 'RC123456789'
            },
            status: {
              type: 'string',
              enum: ['active', 'suspended'],
              example: 'active'
            },
            commissionTier: {
              type: 'string',
              enum: ['standard', 'premium'],
              example: 'standard'
            },
            commissionRate: {
              type: 'string',
              example: '5.00'
            }
          },
          required: ['storeName', 'name', 'personalEmail', 'workEmail', 'businessRegistrationNumber']
        },
        MerchantUpdate: {
          type: 'object',
          properties: {
            storeName: {
              type: 'string',
              example: 'Updated Tech Store'
            },
            name: {
              type: 'string',
              example: 'Jane Smith'
            },
            personalEmail: {
              type: 'string',
              format: 'email',
              example: 'jane@example.com'
            },
            workEmail: {
              type: 'string',
              format: 'email',
              example: 'info@techgadgets.com'
            },
            phoneNumber: {
              type: 'string',
              example: '+2341234567890'
            },
            businessType: {
              type: 'string',
              example: 'Retail'
            },
            website: {
              type: 'string',
              format: 'uri',
              example: 'https://techgadgets.com'
            },
            businessDescription: {
              type: 'string',
              example: 'Selling the latest tech gadgets'
            },
            status: {
              type: 'string',
              enum: ['active', 'suspended'],
              example: 'suspended'
            },
            commissionTier: {
              type: 'string',
              enum: ['standard', 'premium'],
              example: 'premium'
            },
            commissionRate: {
              type: 'string',
              example: '7.00'
            }
          }
        },
        // Category schemas
        CategoryCreate: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              example: 'Electronics'
            },
            parentId: {
              type: 'integer',
              example: 1
            },
            attributes: {
              type: 'object',
              example: {
                color: 'string',
                size: 'string'
              }
            }
          },
          required: ['name']
        },
        CategoryUpdate: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              example: 'Updated Electronics'
            },
            parentId: {
              type: 'integer',
              example: 2
            },
            attributes: {
              type: 'object',
              example: {
                color: 'string',
                size: 'string'
              }
            }
          }
        },
        // Dispute schemas
        DisputeCreate: {
          type: 'object',
          properties: {
            orderId: {
              type: 'string',
              example: 'order-123'
            },
            customerId: {
              type: 'string',
              example: 'customer-123'
            },
            merchantId: {
              type: 'string',
              example: 'merchant-123'
            },
            reason: {
              type: 'string',
              example: 'Damaged product'
            },
            description: {
              type: 'string',
              example: 'Product arrived damaged'
            },
            status: {
              type: 'string',
              example: 'open'
            }
          },
          required: ['orderId', 'customerId', 'merchantId', 'reason', 'description']
        },
        DisputeUpdate: {
          type: 'object',
          properties: {
            orderId: {
              type: 'string',
              example: 'order-123'
            },
            customerId: {
              type: 'string',
              example: 'customer-123'
            },
            merchantId: {
              type: 'string',
              example: 'merchant-123'
            },
            reason: {
              type: 'string',
              example: 'Damaged product'
            },
            description: {
              type: 'string',
              example: 'Product arrived damaged'
            },
            status: {
              type: 'string',
              example: 'resolved'
            },
            resolution: {
              type: 'string',
              example: 'Refunded'
            }
          }
        },
        // Return Request schemas
        ReturnRequestCreate: {
          type: 'object',
          properties: {
            orderItemId: {
              type: 'string',
              example: 'item-123'
            },
            customerId: {
              type: 'string',
              example: 'customer-123'
            },
            reason: {
              type: 'string',
              example: 'Wrong item received'
            },
            description: {
              type: 'string',
              example: 'I ordered a blue shirt but received a red one'
            },
            status: {
              type: 'string',
              example: 'pending'
            }
          },
          required: ['orderItemId', 'customerId', 'reason']
        },
        ReturnRequestUpdate: {
          type: 'object',
          properties: {
            orderItemId: {
              type: 'string',
              example: 'item-123'
            },
            customerId: {
              type: 'string',
              example: 'customer-123'
            },
            reason: {
              type: 'string',
              example: 'Wrong item received'
            },
            description: {
              type: 'string',
              example: 'I ordered a blue shirt but received a red one'
            },
            status: {
              type: 'string',
              enum: ['pending', 'approved', 'rejected', 'completed'],
              example: 'approved'
            },
            merchantNotes: {
              type: 'string',
              example: 'Approved for return'
            }
          }
        },
        // Payout schemas
        PayoutCreate: {
          type: 'object',
          properties: {
            merchantId: {
              type: 'string',
              example: 'merchant-123'
            },
            amount: {
              type: 'string',
              example: '1000.00'
            },
            status: {
              type: 'string',
              enum: ['Pending', 'Processing', 'Completed', 'Failed'],
              example: 'Pending'
            },
            payoutAccountId: {
              type: 'string',
              example: 'account-123'
            }
          },
          required: ['merchantId', 'amount', 'payoutAccountId']
        },
        PayoutUpdate: {
          type: 'object',
          properties: {
            merchantId: {
              type: 'string',
              example: 'merchant-123'
            },
            amount: {
              type: 'string',
              example: '1000.00'
            },
            status: {
              type: 'string',
              enum: ['Pending', 'Processing', 'Completed', 'Failed'],
              example: 'Completed'
            },
            payoutAccountId: {
              type: 'string',
              example: 'account-123'
            }
          }
        },
        // Settings schemas
        SettingsCreate: {
          type: 'object',
          properties: {
            fees: {
              type: 'string',
              example: '5.00'
            },
            taxRate: {
              type: 'string',
              example: '0.00'
            },
            shippingOptions: {
              type: 'object',
              example: {
                standard: '500.00',
                express: '1000.00'
              }
            }
          }
        },
        SettingsUpdate: {
          type: 'object',
          properties: {
            fees: {
              type: 'string',
              example: '7.00'
            },
            taxRate: {
              type: 'string',
              example: '0.00'
            },
            shippingOptions: {
              type: 'object',
              example: {
                standard: '600.00',
                express: '1200.00'
              }
            }
          }
        }
      }
    },
    security: [{ AdminAuth: [] }],
  },
  // When running compiled JS, change this to './dist/**/*.js'
  apis: ['./src/routes/**/*.ts', './src/controllers/**/*.ts', './src/models/**/*.ts'],
};
