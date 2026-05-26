import * as admin from 'firebase-admin';

let initialized = false;

function init() {
  if (initialized || admin.apps.length > 0) return;
  initialized = true;
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!)
    ),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });
}

// Firebase Realtime Database forbids . $ # [ ] / in keys — replace with _
export function sanitizeKey(key: string): string {
  return key.replace(/[.$#[\]/]/g, '_');
}

let eventsCache: Record<string, string> | null = null;
let cacheExpiry = 0;
const CACHE_TTL = 5 * 60 * 1000;

export async function getEvents(): Promise<Record<string, string>> {
  init();
  if (eventsCache && Date.now() < cacheExpiry) return eventsCache;
  const snapshot = await admin.database().ref('events').once('value');
  eventsCache = (snapshot.val() as Record<string, string>) ?? {};
  cacheExpiry = Date.now() + CACHE_TTL;
  return eventsCache;
}
