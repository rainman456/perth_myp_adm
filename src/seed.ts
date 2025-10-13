import { drizzle } from 'drizzle-orm/neon-serverless'; // Or neon-http if not switched
import { Pool } from '@neondatabase/serverless';
import { v4 as uuid } from 'uuid';
import { merchantApplication } from './models/merchant_applications.js';
import { merchants } from './models/merchant.js';
import bcrypt from 'bcrypt';
import { admins } from './models/admins.js';

// if (!process.env.DATABASE_URL) {
//   throw new Error('DATABASE_URL is not set');
// }

//const DATABASE_URL="postgresql://neondb_owner:npg_VlAEowN2S6UT@ep-quiet-darkness-adb75ds6-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

const DATABASE_URL="postgresql://neondb_owner:npg_CcwoeLb6V1XH@ep-wild-haze-adu0bdvq-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"


const pool = new Pool({ connectionString: DATABASE_URL });
const db = drizzle(pool);

async function seed() {
/*
  console.log('Seeding merchant_application...');
  await db.insert(merchantApplication).values({
    id: uuid(),
    storeName: 'Test Store',
    name: 'Test Applicant',
    personalEmail: 'test@personal.com',
    workEmail: 'test@work.com',
    phoneNumber: '123-456-7890',
    personalAddress: { street: '123 Personal St', city: 'Test City' },
    workAddress: { street: '456 Work Ave', city: 'Test City' },
    businessType: 'Individual',
    website: 'https://teststore.com',
    businessDescription: 'Test business',
    businessRegistrationNumber: 'TEST123456',
    storeLogoUrl: 'https://test.com/logo.png',
    businessRegistrationCertificate: 'https://test.com/cert.pdf',
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log('Seeding merchant with test accountId...');
  const tempPassword = await bcrypt.hash('testpass', 10);
  await db.insert(merchants).values({
    id: uuid(),
    applicationId: uuid(), // Link to a real app ID if needed
    merchantId: uuid(),
    storeName: 'Seeded Store',
    name: 'Seeded Merchant',
    personalEmail: 'seeded@personal.com',
    workEmail: 'seeded@work.com',
    phoneNumber: '987-654-3210',
    personalAddress: { street: '789 Seeded St', city: 'Seed City' },
    workAddress: { street: '012 Seeded Ave', city: 'Seed City' },
    businessType: 'Individual',
    website: 'https://seeded.com',
    businessDescription: 'Seeded business',
    businessRegistrationNumber: 'SEED987654',
    storeLogoUrl: 'https://seeded.com/logo.png',
    businessRegistrationCertificate: 'https://seeded.com/cert.pdf',
    password: tempPassword,
    status: 'active',
    commissionTier: 'standard',
    commissionRate: '5.00',
    accountBalance: '0.00',
    totalSales: '0.00',
    totalPayouts: '0.00',
    accountId: 'test-seeded-account-12345', // Seeded test accountId
    payoutSchedule: 'weekly',
    lastPayoutDate: null,
    banner: null,
    policies: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log('Seeding complete!');
}

*/
}
console.log('Seeding admins...');
const adminPassword = await bcrypt.hash('adminpass', 10);
await db.insert(admins).values({
  id: uuid(), // Generates UUID
  username: 'adminrt',
  password: adminPassword,
  role: 'admin',
  email: 'admin1@mail.com',
  createdAt: new Date(),
});

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
//npm run seed