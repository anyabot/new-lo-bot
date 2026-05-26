import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import { event } from '../src/library/event';

dotenv.config();

admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!)
  ),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

async function seed() {
  const sanitized: Record<string, string> = {};
  for (const [key, url] of Object.entries(event)) {
    sanitized[key.replace(/[.$#[\]/]/g, '_')] = url;
  }
  await admin.database().ref('events').set(sanitized);
  console.log(`Seeded ${Object.keys(sanitized).length} event entries to Firebase.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
