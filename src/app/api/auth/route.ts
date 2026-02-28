import { NextResponse } from 'next/server';

// Deprecated — use /api/auth/session instead
export async function POST() {
  return NextResponse.json({ error: 'Use /api/auth/session instead' }, { status: 410 });
}
