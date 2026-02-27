import { NextResponse } from 'next/server';
import { fetchRestaurants } from '@/lib/lezzoo';

export async function GET() {
  try {
    const restaurants = await fetchRestaurants();
    return NextResponse.json(
      { restaurants },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    console.error('Failed to fetch restaurants from Lezzoo:', error);
    return NextResponse.json(
      { error: 'Failed to fetch restaurants', restaurants: [] },
      { status: 502 }
    );
  }
}
