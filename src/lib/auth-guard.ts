import { cookies } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import { getApps, initializeApp, cert } from 'firebase-admin/app';

function ensureAdmin() {
  if (getApps().length === 0) {
    const credsBase64 = process.env.GOOGLE_SHEETS_CREDENTIALS;
    if (!credsBase64) return null;
    try {
      const creds = JSON.parse(Buffer.from(credsBase64, 'base64').toString('utf-8'));
      initializeApp({ credential: cert(creds), projectId: creds.project_id });
    } catch {
      return null;
    }
  }
  return getAuth();
}

/**
 * Verify the __session cookie and return the user's UID.
 * Returns null if not authenticated.
 */
export async function getAuthenticatedUid(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('__session')?.value;
    if (!session) return null;

    const auth = ensureAdmin();
    if (!auth) return null;

    const decoded = await auth.verifySessionCookie(session, true);
    return decoded.uid;
  } catch {
    return null;
  }
}
