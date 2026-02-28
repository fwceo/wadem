import { NextRequest, NextResponse } from 'next/server';
import { sheetsService } from '@/lib/sheets';
import { getAuthenticatedUid } from '@/lib/auth-guard';

// GET — fetch user profile (on login)
export async function GET() {
  try {
    const uid = await getAuthenticatedUid();
    if (!uid) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const customer = await sheetsService.getCustomer(uid);
    if (!customer) {
      return NextResponse.json({ profile: null });
    }

    return NextResponse.json({ profile: customer });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

// POST — save/update user profile (on address save, profile update, etc.)
export async function POST(request: NextRequest) {
  try {
    const uid = await getAuthenticatedUid();
    if (!uid) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    
    // Ensure the UID matches the authenticated user
    await sheetsService.upsertCustomer({
      ...body,
      uid,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 });
  }
}
