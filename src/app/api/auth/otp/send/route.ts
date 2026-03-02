import { NextRequest, NextResponse } from 'next/server';

const HOOKS_HOST = process.env.WADEM_HOOKS_HOST || '';
const API_KEY = process.env.WADEM_API_KEY || '';

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json({ error: 'Phone number required' }, { status: 400 });
    }

    if (!HOOKS_HOST || !API_KEY) {
      return NextResponse.json({ error: 'OTP service not configured' }, { status: 503 });
    }

    // Forward to Lezzoo's OTP API
    const res = await fetch(`${HOOKS_HOST}/api/otp/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: JSON.stringify({ phone }),
    });

    const data = await res.json();

    if (data.status === 'success') {
      return NextResponse.json({
        success: true,
        message: data.message,
        verificationId: data.verification_id,
        throttled: data.throttled || false,
      });
    }

    return NextResponse.json({ error: data.message || 'Failed to send OTP' }, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Failed to send verification code' }, { status: 500 });
  }
}
