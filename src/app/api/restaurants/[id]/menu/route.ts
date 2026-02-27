import { NextRequest, NextResponse } from 'next/server';
import { fetchMerchantMenu } from '@/lib/lezzoo';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const categories = await fetchMerchantMenu(id);

    return NextResponse.json({ categories }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Failed to fetch menu:', error);
    return NextResponse.json({ error: 'Failed to fetch menu' }, { status: 502 });
  }
}
