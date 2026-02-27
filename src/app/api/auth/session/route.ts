import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getApps, initializeApp, cert } from 'firebase-admin/app';

function getAdminAuth() {
  if (getApps().length === 0) {
    const credsBase64 = process.env.GOOGLE_SHEETS_CREDENTIALS;
    if (!credsBase64) throw new Error('GOOGLE_SHEETS_CREDENTIALS not set');
    const creds = JSON.parse(Buffer.from(credsBase64, 'base64').toString('utf-8'));
    initializeApp({ credential: cert(creds), projectId: creds.project_id });
  }
  return getAuth();
}

// POST — create session cookie from Firebase ID token
export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 });
    }

    const auth = getAdminAuth();
    // Verify the ID token first
    await auth.verifyIdToken(token);

    // Create a session cookie (14 days)
    const expiresIn = 60 * 60 * 24 * 14 * 1000; // 14 days in ms
    const sessionCookie = await auth.createSessionCookie(token, { expiresIn });

    const response = NextResponse.json({ success: true });
    response.cookies.set('__session', sessionCookie, {
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('Session creation failed:', err);
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}

// DELETE — destroy session cookie (logout)
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set('__session', '', {
    maxAge: 0,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
  return response;
}
