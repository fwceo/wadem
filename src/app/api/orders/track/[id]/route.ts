import { NextRequest, NextResponse } from 'next/server';
import { trackLezzooOrder, isLezzooConfigured } from '@/lib/lezzoo-orders';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id);

    if (!orderId || isNaN(orderId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    if (!isLezzooConfigured()) {
      return NextResponse.json({ error: 'Lezzoo integration not configured' }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language') || 'en';

    const result = await trackLezzooOrder(orderId, language);

    if (result.status === 'success') {
      return NextResponse.json(result.data);
    }

    return NextResponse.json({ error: result.message }, { status: 404 });
  } catch {
    return NextResponse.json({ error: 'Failed to track order' }, { status: 500 });
  }
}
