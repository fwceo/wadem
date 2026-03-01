import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import otpStore from '@/lib/otp-store';

const MAX_ATTEMPTS = 5;

function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-\+]/g, '');
}

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
    const { phone, code } = await request.json();

    if (!phone || !code) {
      return NextResponse.json({ error: 'Phone and code required' }, { status: 400 });
    }

    const normalizedPhone = normalizePhone(phone);
    const stored = otpStore.get(normalizedPhone);

    if (!stored) {
      return NextResponse.json({ error: 'No verification code found. Please request a new one.' }, { status: 400 });
    }

    if (stored.expiresAt < Date.now()) {
      otpStore.delete(normalizedPhone);
      return NextResponse.json({ error: 'Code expired. Please request a new one.' }, { status: 400 });
    }

    if (stored.attempts >= MAX_ATTEMPTS) {
      otpStore.delete(normalizedPhone);
      return NextResponse.json({ error: 'Too many attempts. Please request a new code.' }, { status: 429 });
    }

    stored.attempts += 1;

    if (stored.code !== code) {
      return NextResponse.json({ error: 'Incorrect code. Please try again.' }, { status: 400 });
    }

    // OTP verified — clean up
    otpStore.delete(normalizedPhone);

    // Create a Firebase custom token for this phone user
    const auth = getAdminAuth();
    let sessionCookie = '';

    if (auth) {
      const phoneWithPlus = '+' + normalizedPhone;
      // Get or create user by phone number
      let firebaseUser;
      try {
        firebaseUser = await auth.getUserByPhoneNumber(phoneWithPlus);
      } catch {
        // User doesn't exist — create one
        firebaseUser = await auth.createUser({
          phoneNumber: phoneWithPlus,
          displayName: '',
        });
      }

      // Create a custom token
      const customToken = await auth.createCustomToken(firebaseUser.uid);

      // We can't create a session cookie from a custom token directly.
      // Instead, return the custom token + uid to the client.
      // The client will sign in with the custom token to get an ID token,
      // then exchange that for a session cookie.
      return NextResponse.json({
        success: true,
        verified: true,
        uid: firebaseUser.uid,
        customToken,
        displayName: firebaseUser.displayName || '',
        phoneNumber: phoneWithPlus,
      });
    }

    // Fallback if Firebase Admin is not configured — return a pseudo-auth
    return NextResponse.json({
      success: true,
      verified: true,
      uid: `phone_${normalizedPhone}`,
      customToken: null,
      displayName: '',
      phoneNumber: '+' + normalizedPhone,
    });
  } catch {
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
