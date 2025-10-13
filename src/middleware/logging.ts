// Request and audit logging middleware
import { Request, Response, NextFunction } from 'express';
// import { log } from '../utils/logger.js';

// // Logging middleware
// export const loggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
//   // Log request details
//   log(`${req.method} ${req.url} - ${req.ip}`);

//   // Audit log for sensitive actions (expand as needed)
//   if (req.url.includes('/financial')) {
//     log(`Audit: Financial action by user ${req.user?.id}`);
//   }

//   next();
// };
