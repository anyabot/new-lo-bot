import * as admin from 'firebase-admin';

// Uses the RTDB REST API instead of the SDK's persistent websocket: Fly suspends
// the machine when idle, and on resume the SDK socket is dead, so `once('value')`
// hung forever. A fresh HTTPS request per fetch survives suspend/resume.

let credential: admin.credential.Credential | null = null;

function getCredential() {
  if (!credential) {
    credential = admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!));
  }
  return credential;
}

// Firebase Realtime Database forbids . $ # [ ] / in keys — replace with _
export function sanitizeKey(key: string): string {
  return key.replace(/[.$#[\]/]/g, '_');
}

let eventsCache: Record<string, string> | null = null;
let cacheExpiry = 0;
const CACHE_TTL = 5 * 60 * 1000;
const FETCH_TIMEOUT = 8000;

export async function getEvents(): Promise<Record<string, string>> {
  if (eventsCache && Date.now() < cacheExpiry) return eventsCache;

  const { access_token } = await getCredential().getAccessToken();
  const base = process.env.FIREBASE_DATABASE_URL!.replace(/\/+$/, '');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
  try {
    const res = await fetch(`${base}/events.json`, {
      headers: { Authorization: `Bearer ${access_token}` },
      signal: controller.signal
    });
    if (!res.ok) throw new Error(`RTDB ${res.status}: ${await res.text()}`);
    eventsCache = ((await res.json()) as Record<string, string> | null) ?? {};
    cacheExpiry = Date.now() + CACHE_TTL;
    return eventsCache;
  } catch (err) {
    // Serve stale data rather than failing if we have any
    if (eventsCache) return eventsCache;
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
