// Firebase Vector Search with OpenAI Embeddings
// Uses Firestore's findNearest for KNN vector search on menu_items collection.
//
// Prerequisites:
//   1. Run the /api/embed endpoint to populate Firestore with menu item embeddings
//   2. Create a Firestore KNN vector index via gcloud CLI:
//      gcloud firestore indexes composite create \
//        --collection-group=menu_items \
//        --query-scope=COLLECTION \
//        --field-config field-path=vector_embedding,vector-config='{"dimension":"1536","flat":{}}' \
//        --database="(default)"

import OpenAI from 'openai';
import { getDb, isFirebaseAdminConfigured } from './firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSION = 1536;
const COLLECTION = 'menu_items';

export interface MenuItemDocument {
  restaurantId: string;
  restaurantName: string;
  itemId: string;
  itemName: string;
  description: string;
  price: number;
  category: string;
  cuisine: string[];
  rating: number;
  deliveryTimeMin: number;
  deliveryTimeMax: number;
  deliveryFee: number;
  isOpen: boolean;
  isAvailable: boolean;
  image: string;
  tags: string[];
  embeddingText: string;
  vector_embedding: number[] | typeof FieldValue;
  updatedAt: string;
}

export interface VectorSearchResult {
  restaurantId: string;
  restaurantName: string;
  itemId: string;
  itemName: string;
  description: string;
  price: number;
  category: string;
  cuisine: string[];
  rating: number;
  deliveryTimeMin: number;
  deliveryTimeMax: number;
  deliveryFee: number;
  isOpen: boolean;
  isAvailable: boolean;
  image: string;
  tags: string[];
}

/**
 * Generate an embedding vector for the given text using OpenAI
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY required for embeddings');
  }

  const openai = new OpenAI({ apiKey });
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
    dimensions: EMBEDDING_DIMENSION,
  });

  return response.data[0].embedding;
}

/**
 * Build the text string that gets embedded for a menu item.
 * Combines restaurant info + item info for richer semantic search.
 */
export function buildEmbeddingText(doc: {
  restaurantName: string;
  itemName: string;
  description: string;
  category: string;
  cuisine: string[];
  tags: string[];
  price: number;
}): string {
  const parts = [
    doc.restaurantName,
    doc.itemName,
    doc.description,
    doc.category,
    ...(doc.cuisine || []),
    ...(doc.tags || []),
  ].filter(Boolean);

  if (doc.price > 0) {
    parts.push(`${doc.price} IQD`);
  }

  return parts.join(' | ');
}

/**
 * Upsert a menu item document with its embedding into Firestore
 */
export async function upsertMenuItemEmbedding(
  doc: Omit<MenuItemDocument, 'vector_embedding' | 'embeddingText' | 'updatedAt'>
): Promise<void> {
  if (!isFirebaseAdminConfigured()) {
    throw new Error('Firebase Admin not configured');
  }

  const db = getDb();
  const embeddingText = buildEmbeddingText(doc);
  const vector = await generateEmbedding(embeddingText);

  const docId = `${doc.restaurantId}_${doc.itemId}`;
  await db.collection(COLLECTION).doc(docId).set({
    ...doc,
    embeddingText,
    vector_embedding: FieldValue.vector(vector),
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Batch upsert multiple menu items (generates embeddings in parallel batches)
 */
export async function batchUpsertMenuItems(
  items: Omit<MenuItemDocument, 'vector_embedding' | 'embeddingText' | 'updatedAt'>[]
): Promise<{ success: number; failed: number }> {
  if (!isFirebaseAdminConfigured()) {
    throw new Error('Firebase Admin not configured');
  }

  const db = getDb();
  let success = 0;
  let failed = 0;

  // Process in batches of 20 to avoid rate limits
  const BATCH_SIZE = 20;
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map(async (item) => {
        const embeddingText = buildEmbeddingText(item);
        const vector = await generateEmbedding(embeddingText);
        const docId = `${item.restaurantId}_${item.itemId}`;

        await db.collection(COLLECTION).doc(docId).set({
          ...item,
          embeddingText,
          vector_embedding: FieldValue.vector(vector),
          updatedAt: new Date().toISOString(),
        });
      })
    );

    for (const r of results) {
      if (r.status === 'fulfilled') success++;
      else {
        failed++;
        console.error('[Vector] Failed to embed item:', r.reason);
      }
    }

    // Small delay between batches to avoid OpenAI rate limits
    if (i + BATCH_SIZE < items.length) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  return { success, failed };
}

/**
 * Semantic search: vectorize the query and find nearest menu items in Firestore
 */
export async function searchMenuItems(
  query: string,
  limit: number = 5,
  onlyOpen: boolean = true
): Promise<VectorSearchResult[]> {
  if (!isFirebaseAdminConfigured() || !process.env.OPENAI_API_KEY) {
    return [];
  }

  try {
    const db = getDb();
    const queryVector = await generateEmbedding(query);

    let baseQuery = db.collection(COLLECTION).where('isAvailable', '==', true);
    if (onlyOpen) {
      baseQuery = baseQuery.where('isOpen', '==', true);
    }

    // findNearest does KNN vector search
    const vectorQuery = baseQuery.findNearest('vector_embedding', FieldValue.vector(queryVector), {
      limit,
      distanceMeasure: 'COSINE',
    });
    const snapshot = await vectorQuery.get();

    return snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
      const d = doc.data();
      return {
        restaurantId: d.restaurantId,
        restaurantName: d.restaurantName,
        itemId: d.itemId,
        itemName: d.itemName,
        description: d.description,
        price: d.price,
        category: d.category,
        cuisine: d.cuisine || [],
        rating: d.rating,
        deliveryTimeMin: d.deliveryTimeMin,
        deliveryTimeMax: d.deliveryTimeMax,
        deliveryFee: d.deliveryFee,
        isOpen: d.isOpen,
        isAvailable: d.isAvailable,
        image: d.image,
        tags: d.tags || [],
      };
    });
  } catch (err) {
    console.error('[Vector] Search failed:', err);
    return [];
  }
}

/**
 * Get the count of documents in the menu_items collection
 */
export async function getMenuItemCount(): Promise<number> {
  if (!isFirebaseAdminConfigured()) return 0;
  try {
    const db = getDb();
    const snapshot = await db.collection(COLLECTION).count().get();
    return snapshot.data().count;
  } catch {
    return 0;
  }
}
