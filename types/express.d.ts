// // import { ParamsDictionary, Query } from 'express-serve-static-headers';  // Import necessary types
// // import { IncomingHttpHeaders } from 'http';

// // declare module 'express' {
// //   interface Request {
// //     user?: {
// //       id: string;
// //       role: string;
// //     };
// //     params: ParamsDictionary;  // Explicitly add params as record
// //     body: any;                // Allow any body (or use generics in controllers if needed)
// //     query: Query;             // Explicitly add query
// //     headers: IncomingHttpHeaders;  // From 'http' module, for headers
// //   }
// // }
// import { IncomingHttpHeaders } from 'http';
// import 'express';  // Rely on @types/express for ParamsDictionary and Query

// declare module 'express' {
//   interface Request {
//     user?: {
//       id: string;
//       role: string;
//     };
//     body: any;                // Allow any body (or use generics in controllers if needed)
//     headers: IncomingHttpHeaders;  // From 'http' module, for headers
//   }
// }

// import type { IncomingHttpHeaders } from "http"
// import "express"

// declare module "express" {
//   interface Request {
//     user?: {
//       id: string
//       role: string
//       username?: string
//       email?: string
//     }
//     body: any
//     headers: IncomingHttpHeaders
//   }
// }

// import { AdminRole } from "src/roles"; // Adjust path if needed

// declare module "express" {
//   interface Request {
//     user?: {
//       id: string;
//       role: AdminRole; // Now matches enum
//       email: string;
//       username: string;
//     };
//   }
// }
