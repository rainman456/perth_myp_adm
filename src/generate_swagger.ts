import fs from 'fs';
import path from 'path';
import swaggerJsdoc from 'swagger-jsdoc';


// If compiled to CommonJS, Node supplies __filename/__dirname
// If for some reason __dirname isn't available, fall back to process.cwd()
const _dirname = (typeof __dirname !== 'undefined') ? __dirname : path.join(process.cwd(), 'src');

// Import your TS definition
import { specs } from './docs/swagger';

try {
  const openapiSpec: any = swaggerJsdoc(specs);

  if (!openapiSpec.paths || Object.keys(openapiSpec.paths).length === 0) {
    console.warn('Warning: No API paths found. Check your @swagger annotations in the scanned files.');
  }

  const jsonPath = path.join(_dirname, 'swagger.json');
  fs.writeFileSync(jsonPath, JSON.stringify(openapiSpec, null, 2), 'utf8');

  console.log(`Swagger JSON generated at: ${jsonPath}`);
  console.log(`Generated spec has ${Object.keys(openapiSpec.paths || {}).length} paths.`);
} catch (error) {
  console.error('Error generating Swagger JSON:', error);
  process.exit(1);
}
