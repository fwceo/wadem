import { NextRequest, NextResponse } from 'next/server';
import { fetchRestaurants } from '@/lib/lezzoo';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const restaurants = await fetchRestaurants();
    const restaurant = restaurants.find((r) => r.id === id);

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found', code: 404 }, { status: 404 });
    }

    return NextResponse.json(restaurant, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Failed to fetch restaurant:', error);
    return NextResponse.json({ error: 'Failed to fetch restaurant' }, { status: 502 });
  }
}
