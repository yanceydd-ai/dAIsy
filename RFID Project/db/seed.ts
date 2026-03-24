import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { doors } from './schema';

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client);

async function seed() {
  console.log('Seeding doors...');

  await db
    .insert(doors)
    .values([
      { id: 'door-a', label: 'Door A' },
      { id: 'door-b', label: 'Door B' },
    ])
    .onConflictDoNothing();

  console.log('Seed complete.');
  await client.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
