// Endpoint to populate Firestore menu_items collection with vector embeddings.
// Call this once (or periodically) to index Lezzoo menu items for semantic search.
//
// POST /api/embed
//   Body: { restaurantIds?: string[], limit?: number }
//   - If restaurantIds is provided, only embed those restaurants' menus
//   - If limit is provided, cap the number of restaurants to process
//   - Default: processes the first 20 open restaurants
//
// Requires: OPENAI_API_KEY, GOOGLE_SHEETS_CREDENTIALS (for Firebase Admin)

import { NextRequest, NextResponse } from 'next/server';
import { fetchRestaurants, fetchMerchantMenu } from '@/lib/lezzoo';
import { batchUpsertMenuItems, getMenuItemCount } from '@/lib/firebase-vector';
import { isFirebaseAdminConfigured } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json(
      { error: 'Firebase Admin not configured. Set GOOGLE_SHEETS_CREDENTIALS.' },
      { status: 500 }
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'OPENAI_API_KEY required for generating embeddings.' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const requestedIds: string[] | undefined = body.restaurantIds;
    const restaurantLimit: number = body.limit || 20;

    // Fetch all restaurants from Lezzoo
    const allRestaurants = await fetchRestaurants();
    const openRestaurants = allRestaurants.filter((r) => r.isOpen);

    // Determine which restaurants to process
    let toProcess = requestedIds
      ? openRestaurants.filter((r) => requestedIds.includes(r.id))
      : openRestaurants.slice(0, restaurantLimit);

    const stats = {
      restaurantsProcessed: 0,
      totalItems: 0,
      embedded: 0,
      failed: 0,
      skipped: 0,
    };

    for (const restaurant of toProcess) {
      try {
        const menu = await fetchMerchantMenu(restaurant.id);
        const items = menu.flatMap((cat) =>
          cat.items
            .filter((item) => item.isAvailable)
            .map((item) => ({
              restaurantId: restaurant.id,
              restaurantName: restaurant.name,
              itemId: item.id,
              itemName: item.name,
              description: item.description || '',
              price: item.price,
              category: item.category || cat.name,
              cuisine: restaurant.cuisine,
              rating: restaurant.rating,
              deliveryTimeMin: restaurant.deliveryTime.min,
              deliveryTimeMax: restaurant.deliveryTime.max,
              deliveryFee: restaurant.deliveryFee,
              isOpen: restaurant.isOpen,
              isAvailable: item.isAvailable,
              image: item.image || '',
              tags: item.tags || [],
            }))
        );

        if (items.length === 0) {
          stats.skipped++;
          continue;
        }

        stats.totalItems += items.length;

        const result = await batchUpsertMenuItems(items);
        stats.embedded += result.success;
        stats.failed += result.failed;
        stats.restaurantsProcessed++;

        console.log(`[Embed] ${restaurant.name}: ${result.success}/${items.length} items embedded`);
      } catch (err) {
        console.error(`[Embed] Failed to process ${restaurant.name}:`, err);
        stats.failed++;
      }
    }

    const totalInFirestore = await getMenuItemCount();

    return NextResponse.json({
      success: true,
      stats,
      totalInFirestore,
      message: `Embedded ${stats.embedded} items from ${stats.restaurantsProcessed} restaurants. ${totalInFirestore} total items in Firestore.`,
    });
  } catch (err) {
    console.error('[Embed] Error:', err);
    return NextResponse.json(
      { error: 'Failed to generate embeddings', details: String(err) },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const count = await getMenuItemCount();
    return NextResponse.json({
      collection: 'menu_items',
      documentCount: count,
      configured: isFirebaseAdminConfigured() && !!process.env.OPENAI_API_KEY,
    });
  } catch {
    return NextResponse.json({ documentCount: 0, configured: false });
  }
}
