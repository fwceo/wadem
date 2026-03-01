import { NextRequest, NextResponse } from 'next/server';

import otpStore from '@/lib/otp-store';

const OTPIQ_API_KEY = process.env.OTPIQ_API_KEY || '';
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 5;

function generateOTP(): string {
  return Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit
}

function normalizePhone(phone: string): string {
  // Remove +, spaces, dashes
  return phone.replace(/[\s\-\+]/g, '');
}

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json({ error: 'Phone number required' }, { status: 400 });
    }

    const normalizedPhone = normalizePhone(phone);

    if (normalizedPhone.length < 10 || normalizedPhone.length > 15) {
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
    }

    // Rate limit: check if there's a recent OTP
    const existing = otpStore.get(normalizedPhone);
    if (existing && existing.expiresAt > Date.now() && existing.attempts === 0) {
      // OTP was just sent, don't resend within 30 seconds
      const timeSinceSent = OTP_EXPIRY_MS - (existing.expiresAt - Date.now());
      if (timeSinceSent < 30000) {
        return NextResponse.json({ error: 'Please wait before requesting a new code' }, { status: 429 });
      }
    }

    // Generate 4-digit OTP
    const code = generateOTP();

    // Store OTP server-side
    otpStore.set(normalizedPhone, {
      code,
      expiresAt: Date.now() + OTP_EXPIRY_MS,
      attempts: 0,
    });

    // Send via OTPiq
    if (OTPIQ_API_KEY) {
      const res = await fetch('https://api.otpiq.com/api/sms', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OTPIQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: normalizedPhone,
          smsType: 'verification',
          verificationCode: code,
          provider: 'auto',
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        return NextResponse.json(
          { error: errData.message || 'Failed to send OTP' },
          { status: 500 }
        );
      }
    } else {
      // Development fallback — log OTP to console
      console.log(`[DEV] OTP for ${normalizedPhone}: ${code}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Verification code sent',
      // Only expose phone for display
      phone: phone.replace(/(\d{3})\d{4}(\d{3,})/, '$1****$2'),
    });
  } catch {
    return NextResponse.json({ error: 'Failed to send verification code' }, { status: 500 });
  }
}

