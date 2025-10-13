// import express from 'express';
// import { registerRoutes } from './routes/index';  // Changed to named import (fixes TS1192)
// import { config } from './config';
// import { loggingMiddleware } from './middleware/logging';

// const app = express();

// // Middleware
// app.use(express.json());
// app.use(loggingMiddleware);

// // Register routes and start server (replaces app.use('/api', router) and app.listen())
// registerRoutes(app);  // Call the function; no need for await since it's sync (see below)
// import express from 'express';

// import { registerRoutes } from './routes/index';  // Changed to named import (fixes TS1192)
// import { loggingMiddleware } from './middleware/logging';
// import { config } from 'dotenv';

// const app = express();

// // Middleware
// app.use(express.json());
// app.use(loggingMiddleware);

// // Register routes and start server (replaces app.use('/api', router) and app.listen())
// registerRoutes(app);  // Call the function; no need for await since it's sync (see below)

// // const port = process.env.PORT || 5000;  // Use env or default
// // app.listen(port, () => {
// //   console.log(`Server running on port ${port}`);
// // });

// app.listen(config.port, () => {
//   console.log(`Server on port ${config.port}`);
// });

/*
import { config } from 'dotenv';
config(); // Load .env first

import express from 'express';
import { registerRoutes } from './routes/index';
import { loggingMiddleware } from './middleware/logging';
import { config as appConfig } from './config/index';

const app = express();

// Middleware
app.use(express.json());
app.use(loggingMiddleware);

// Register routes
registerRoutes(app);

app.listen(appConfig.port, () => {
  console.log(`Server on port ${appConfig.port}`);
});
*/

import "dotenv/config";
import express from "express";
// import session from "express-session";
// import connectRedis from "connect-redis";
// import { createClient } from "redis";
//import { Pool } from "@neondatabase/serverless";
import { registerRoutes } from "./routes/index.js";
//import { loggingMiddleware } from "./middleware/logging.js";
import { config as appConfig } from "./config/index.js";
import swaggerUi from "swagger-ui-express";
import { specs } from "./docs/swagger.js";
// import { adminRouter } from "./admin/admin.js"; // Commented out - module doesn't exist
import expressWinston from "express-winston";
import { logger } from "./utils/logger.js";
import webhookRouter from "./routes/webhook.js"
import { startPayoutSchedulers } from "./jobs/payout-scheduler.js"
// import "dotenv/config";  // <-- loads .env before any other module

// import express from "express"
// //import cors from "cors"
// import { registerRoutes } from "./routes/index"
// import { loggingMiddleware } from "./middleware/logging"
// import { config as appConfig } from "./config/index"
// import swaggerUi from 'swagger-ui-express';
// import { specs } from './docs/swagger';
// // import AdminJS from 'adminjs';
// import AdminJSExpress from '@adminjs/express';
// import { admins } from "./models/admins";
// import { categories } from "./models/category";
// import { merchants } from "./models/merchant";

const app = express();

app.use("/webhook", express.raw({ type: "application/json" }), webhookRouter);
// 📌 Request logging middleware
app.use(
  expressWinston.logger({
    winstonInstance: logger,
    meta: false, // no full metadata (keeps it clean)
    msg: "HTTP {{req.method}} {{req.url}} → {{res.statusCode}}",
    colorize: true,
  })
);

//app.use(cors())
app.use(express.json());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));
//app.use(express.raw({ type: "application/webhook+json" }))
//app.use(loggingMiddleware)

// Removed admin router - module doesn't exist
// app.use("/admin", adminRouter);

// TEST ENDPOINT: Add this temporarily to confirm Express routing works
app.get("/test-admin", (req, res) =>
  res.json({ message: "Admin route base is working!" })
);

registerRoutes(app);

app.use(
  expressWinston.errorLogger({
    winstonInstance: logger,
  })
);

// export default app;

// const adminJs = new AdminJS({
//   resources: [merchants, admins, categories ],
//   rootPath: '/admin',
// });
// const router = AdminJSExpress.buildRouter(adminJs);
// app.use(adminJs.options.rootPath, router);

// const port = appConfig.port
// app.listen(port, () => {
//   console.log(`Server running on port ${port}`)
// })

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : appConfig.port;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

if (
  appConfig.env === "production" ||
  process.env.ENABLE_SCHEDULERS === "true"
) {
  startPayoutSchedulers();
  logger.info("Payout schedulers enabled");
} else {
  logger.info(
    "Payout schedulers disabled (set ENABLE_SCHEDULERS=true to enable)"
  );
}

export default app;
