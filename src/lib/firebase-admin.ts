// Server-side Firebase Admin SDK initialization
// Reuses GOOGLE_SHEETS_CREDENTIALS (base64-encoded service account JSON)
// which is the same Firebase project service account.

import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let _app: App | null = null;
let _db: Firestore | null = null;

function getAdminApp(): App {
  if (_app) return _app;

  if (getApps().length > 0) {
    _app = getApps()[0];
    return _app;
  }

  const credsBase64 = process.env.GOOGLE_SHEETS_CREDENTIALS;
  if (!credsBase64) {
    throw new Error('GOOGLE_SHEETS_CREDENTIALS not set — needed for Firebase Admin');
  }

  const creds = JSON.parse(Buffer.from(credsBase64, 'base64').toString('utf-8'));

  _app = initializeApp({
    credential: cert(creds),
    projectId: creds.project_id,
  });

  return _app;
}

export function getDb(): Firestore {
  if (_db) return _db;
  _db = getFirestore(getAdminApp());
  return _db;
}

export function isFirebaseAdminConfigured(): boolean {
  return !!process.env.GOOGLE_SHEETS_CREDENTIALS;
}
