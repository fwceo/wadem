import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getApps, initializeApp, cert } from 'firebase-admin/app';

const HOOKS_HOST = process.env.WADEM_HOOKS_HOST || '';
const API_KEY = process.env.WADEM_API_KEY || '';

function getAdminAuth() {
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

export async function POST(request: NextRequest) {
  try {
    const { verificationId, code, phone } = await request.json();

    if (!verificationId || !code) {
      return NextResponse.json({ error: 'verification_id and code are required' }, { status: 400 });
    }

    if (!HOOKS_HOST || !API_KEY) {
      return NextResponse.json({ error: 'OTP service not configured' }, { status: 503 });
    }

    // Verify via Lezzoo's OTP API
    const res = await fetch(`${HOOKS_HOST}/api/otp/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: JSON.stringify({
        verification_id: verificationId,
        code,
      }),
    });

    const data = await res.json();

    if (data.status !== 'success' || !data.verified) {
      return NextResponse.json({ error: data.message || 'Invalid or expired code' }, { status: 400 });
    }

    // OTP verified — try to create/get Firebase user + custom token
    const normalizedPhone = phone ? (phone.startsWith('+') ? phone : `+${phone}`) : '';

    try {
      const auth = getAdminAuth();
      if (auth && normalizedPhone) {
        let firebaseUser;
        try {
          firebaseUser = await auth.getUserByPhoneNumber(normalizedPhone);
        } catch {
          firebaseUser = await auth.createUser({
            phoneNumber: normalizedPhone,
            displayName: '',
          });
        }

        const customToken = await auth.createCustomToken(firebaseUser.uid);

        return NextResponse.json({
          success: true,
          verified: true,
          uid: firebaseUser.uid,
          customToken,
          displayName: firebaseUser.displayName || '',
          phoneNumber: normalizedPhone,
        });
      }
    } catch {
      // Firebase Admin failed — fall through to fallback
    }

    // Fallback — OTP was verified by Lezzoo, let user in without Firebase session
    const uid = `phone_${normalizedPhone.replace(/\+/g, '')}`;
    return NextResponse.json({
      success: true,
      verified: true,
      uid,
      customToken: null,
      displayName: '',
      phoneNumber: normalizedPhone,
    });
  } catch {
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
