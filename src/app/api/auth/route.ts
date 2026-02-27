import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: 'Token required', code: 400 }, { status: 400 });
    }

    // TODO: Verify Firebase token server-side
    // const decodedToken = await admin.auth().verifyIdToken(token);
    // Upsert customer in Google Sheets

    return NextResponse.json({ success: true, message: 'Authenticated' });
  } catch {
    return NextResponse.json({ error: 'Authentication failed', code: 500 }, { status: 500 });
  }
}
