import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import swaggerJsdoc from 'swagger-jsdoc';
/*
// Polyfill __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import your TS definition
import { specs } from './src/docs/swagger.ts';

try {
  const openapiSpec = swaggerJsdoc(specs);

  if (!openapiSpec.paths || Object.keys(openapiSpec.paths).length === 0) {
    console.warn('Warning: No API paths found. Check your @swagger annotations in the scanned files.');
  }

  // Write to swagger.json
  const jsonPath = path.join(__dirname, 'swagger.json');
  fs.writeFileSync(jsonPath, JSON.stringify(openapiSpec, null, 2), 'utf8');

  console.log(`Swagger JSON generated at: ${jsonPath}`);
  console.log(`Generated spec has ${Object.keys(openapiSpec.paths || {}).length} paths.`);
} catch (error) {
  console.error('Error generating Swagger JSON:', error);
  process.exit(1);
}

*/