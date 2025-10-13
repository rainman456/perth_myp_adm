// Input validation using Zod
import { z } from 'zod';

// Example validator for application
export const applicationValidator = z.object({
  storeName: z.string().min(1),
  // Add more fields
});
