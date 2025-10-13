
// Logging utility for audit and errors
// export const log = (message: string, level = 'info') => {
//   const timestamp = new Date().toISOString();
//   console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
// };

// src/utils/logger.ts
import winston from "winston";

export const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] ${level}: ${message}`;
    })
  ),
  transports: [new winston.transports.Console()],
});
