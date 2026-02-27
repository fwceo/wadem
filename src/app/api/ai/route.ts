import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import Groq from 'groq-sdk';
import { AI_CONFIG } from '@/lib/ai';
import { fetchRestaurants } from '@/lib/lezzoo';
import { searchMenuItems, type VectorSearchResult } from '@/lib/firebase-vector';

interface AIRequestBody {
  message: string;
  context?: {
    userId?: string;
    userName?: string;
    preferences?: string[];
    currentTime?: string;
  };
}

// RAG-enhanced system prompt that constrains the AI to only recommend retrieved items
const RAG_SYSTEM_PROMPT = `You are Wadem, a friendly and efficient food ordering assistant for office workers in Erbil, Iraq.

RULES:
1. ONLY recommend items from the RETRIEVED MENU ITEMS section below — never invent items
2. Each recommendation MUST use the exact restaurantId, restaurantName, itemId, itemName, and price from the retrieved data
3. Pick up to 10 of the most relevant items from the retrieved results
4. PRIORITIZE delivery time — office workers need food FAST
5. Be enthusiastic but CONCISE
6. All prices are in IQD (Iraqi Dinar)
7. Never recommend unavailable items or closed restaurants

IMPORTANT: Do NOT recommend more than 3 items from the same restaurant.

RESPONSE FORMAT (strict JSON):
{
  "message": "Brief friendly text explaining your picks",
  "recommendations": [
    {
      "restaurantId": "exact id from retrieved data",
      "restaurantName": "exact name from retrieved data",
      "itemId": "exact id from retrieved data",
      "itemName": "exact name from retrieved data",
      "price": 12000,
      "deliveryTime": "20 min",
      "rating": 4.7,
      "reason": "Short explanation why this is a great pick",
      "tag": "BEST MATCH" | "BUDGET PICK" | "ADVENTUROUS" | "FASTEST"
    }
  ]
}`;

// Fallback system prompt when no vector results (uses restaurant list)
const FALLBACK_SYSTEM_PROMPT = `You are Wadem, a friendly and efficient food ordering assistant for office workers in Erbil, Iraq.

RULES:
1. Suggest up to 10 restaurants from the AVAILABLE RESTAURANTS list
2. Use exact restaurant IDs and names from the list
3. PRIORITIZE delivery time — office workers need food FAST
4. Be enthusiastic but CONCISE
5. All prices are in IQD (Iraqi Dinar)
6. Never recommend closed restaurants

RESPONSE FORMAT (strict JSON):
{
  "message": "Brief friendly text explaining your picks",
  "recommendations": [
    {
      "restaurantId": "exact id from list",
      "restaurantName": "exact name from list",
      "itemId": "",
      "itemName": "cuisine type",
      "price": 0,
      "deliveryTime": "20 min",
      "rating": 4.7,
      "reason": "Short explanation why this is a great pick",
      "tag": "BEST MATCH" | "BUDGET PICK" | "ADVENTUROUS" | "FASTEST"
    }
  ]
}`;

export async function POST(request: NextRequest) {
  try {
    const body: AIRequestBody = await request.json();
    const { message, context } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // ── Step 1: Try vector search (RAG) for real menu items ──
    let vectorResults: VectorSearchResult[] = [];
    try {
      vectorResults = await searchMenuItems(message, 15);
      console.log(`[AI] Vector search returned ${vectorResults.length} results for: "${message}"`);
    } catch (err) {
      console.warn('[AI] Vector search failed, falling back to restaurant list:', err);
    }

    const useRAG = vectorResults.length > 0;
    let systemPrompt: string;
    let userPrompt: string;

    if (useRAG) {
      // ── RAG path: use real menu items from Firestore ──
      const retrievedContext = vectorResults.map((item, i) => (
        `[${i + 1}] restaurantId:${item.restaurantId} | restaurantName:${item.restaurantName} | itemId:${item.itemId} | itemName:${item.itemName} | price:${item.price} IQD | category:${item.category} | cuisine:${item.cuisine.join(', ')} | rating:★${item.rating} | delivery:${item.deliveryTimeMin}-${item.deliveryTimeMax}min | deliveryFee:${item.deliveryFee === 0 ? 'Free' : item.deliveryFee + ' IQD'}${item.description ? ' | desc:' + item.description.slice(0, 80) : ''}`
      )).join('\n');

      systemPrompt = RAG_SYSTEM_PROMPT;
      userPrompt = `${context?.userName ? `User: ${context.userName}` : ''}
Time: ${context?.currentTime || new Date().toLocaleTimeString()}

RETRIEVED MENU ITEMS (from semantic search — ONLY recommend from these):
${retrievedContext}

USER MESSAGE: ${message}`;
    } else {
      // ── Fallback path: use restaurant list ──
      const restaurants = await fetchRestaurants();
      const openRestaurants = restaurants.filter((r) => r.isOpen).slice(0, 50);
      const restaurantContext = openRestaurants.map((r) => (
        `${r.name} (id:${r.id}) — ${r.cuisine.join(', ')} — ★${r.rating} — ${r.deliveryTime.min}-${r.deliveryTime.max}min — ${r.deliveryFee === 0 ? 'Free delivery' : r.deliveryFee + ' IQD delivery'}`
      )).join('\n');

      systemPrompt = FALLBACK_SYSTEM_PROMPT;
      userPrompt = `${context?.userName ? `User: ${context.userName}` : ''}
Time: ${context?.currentTime || new Date().toLocaleTimeString()}

AVAILABLE RESTAURANTS:
${restaurantContext}

USER MESSAGE: ${message}`;
    }

    // ── Step 2: Generate AI response ──
    let aiResponse: string | null = null;

    // Priority 1: OpenAI
    if (process.env.OPENAI_API_KEY) {
      try {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const completion = await openai.chat.completions.create({
          model: AI_CONFIG.primaryModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: AI_CONFIG.maxTokens,
          temperature: AI_CONFIG.temperature,
          response_format: { type: 'json_object' },
        });
        aiResponse = completion.choices[0]?.message?.content || null;
      } catch (err) {
        console.error('[AI] OpenAI failed, trying Groq fallback:', err);
      }
    }

    // Priority 2: Groq
    if (!aiResponse && process.env.GROQ_API_KEY) {
      try {
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const completion = await groq.chat.completions.create({
          model: AI_CONFIG.fallbackModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: AI_CONFIG.maxTokens,
          temperature: AI_CONFIG.temperature,
          response_format: { type: 'json_object' },
        });
        aiResponse = completion.choices[0]?.message?.content || null;
      } catch (err) {
        console.error('[AI] Groq failed, using rule-based fallback:', err);
      }
    }

    // Parse AI JSON response
    if (aiResponse) {
      try {
        const parsed = JSON.parse(aiResponse);
        // Enrich with logos + enforce max 3 per merchant
        const allRestaurants = await fetchRestaurants();
        const logoMap = new Map(allRestaurants.map((r) => [r.id, r.logo]));
        const enriched = enforcePerMerchantLimit(
          (parsed.recommendations || []).map((rec: Record<string, unknown>) => ({
            ...rec,
            restaurantLogo: logoMap.get(rec.restaurantId as string) || '',
          })),
          3
        );
        return NextResponse.json({ ...parsed, recommendations: enriched, source: useRAG ? 'rag' : 'restaurant-list' });
      } catch {
        return NextResponse.json({
          message: aiResponse,
          recommendations: [],
          source: useRAG ? 'rag' : 'restaurant-list',
        });
      }
    }

    // Priority 3: Rule-based fallback
    const restaurants = await fetchRestaurants();
    const fallback = generateFallback(message, restaurants.filter((r) => r.isOpen));
    return NextResponse.json(fallback);
  } catch {
    return NextResponse.json({ error: 'AI request failed' }, { status: 500 });
  }
}

function generateFallback(query: string, restaurants: { id: string; name: string; cuisine: string[]; rating: number; deliveryTime: { min: number; max: number }; deliveryFee: number }[]) {
  const q = query.toLowerCase();
  let filtered = [...restaurants];

  if (q.includes('fast') || q.includes('quick')) {
    filtered.sort((a, b) => a.deliveryTime.min - b.deliveryTime.min);
  } else if (q.includes('best') || q.includes('rated') || q.includes('top')) {
    filtered.sort((a, b) => b.rating - a.rating);
  } else if (q.includes('free delivery')) {
    filtered = filtered.filter((r) => r.deliveryFee === 0);
  }

  const keywords = ['pizza', 'burger', 'chicken', 'kebab', 'shawarma', 'sushi', 'coffee', 'sweets'];
  for (const kw of keywords) {
    if (q.includes(kw)) {
      filtered = filtered.filter((r) => r.cuisine.some((c) => c.toLowerCase().includes(kw)));
      break;
    }
  }

  const picks = filtered.slice(0, 3);
  const tags = ['BEST MATCH', 'GREAT VALUE', 'TRY SOMETHING NEW'];

  return {
    message: picks.length > 0
      ? `Here are my top picks for you! ${picks.length} great options nearby.`
      : "I couldn't find an exact match, but here are some popular spots!",
    source: 'fallback',
    recommendations: picks.map((r, i) => ({
      restaurantId: r.id,
      restaurantName: r.name,
      restaurantLogo: (r as Record<string, unknown>).logo || '',
      itemId: '',
      itemName: r.cuisine.slice(0, 2).join(' & '),
      price: 0,
      deliveryTime: `${r.deliveryTime.min} min`,
      rating: r.rating,
      reason: i === 0 ? 'Top rated nearby' : i === 1 ? 'Fast delivery' : 'Something different',
      tag: tags[i] || 'RECOMMENDED',
    })),
  };
}

/** Enforce max N items per restaurant */
function enforcePerMerchantLimit(recs: Record<string, unknown>[], maxPerMerchant: number) {
  const counts = new Map<string, number>();
  return recs.filter((rec) => {
    const rid = rec.restaurantId as string;
    const count = counts.get(rid) || 0;
    if (count >= maxPerMerchant) return false;
    counts.set(rid, count + 1);
    return true;
  });
}
