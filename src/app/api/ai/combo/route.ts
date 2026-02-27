import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import Groq from 'groq-sdk';
import { AI_CONFIG } from '@/lib/ai';
import { fetchRestaurants } from '@/lib/lezzoo';
import { searchMenuItems } from '@/lib/firebase-vector';

interface ComboRequest {
  style: 'healthy' | 'comfort' | 'spicy' | 'budget';
}

const COMBO_PROMPT = `You are Wadem's Smart Combo generator. Create a complete meal combo of exactly 4 items that pair well together.

Structure: Main + Side + Drink + Dessert

Rules:
1. ONLY use items from the MENU ITEMS section — never invent items
2. Use exact restaurantId, restaurantName, itemId, itemName, price from the data
3. Items can be from different restaurants
4. Match the requested style/vibe
5. Keep total price reasonable

RESPONSE FORMAT (strict JSON):
{
  "title": "Short combo name (e.g. 'The Perfect Lunch Combo')",
  "items": [
    {
      "role": "main" | "side" | "drink" | "dessert",
      "restaurantId": "exact id",
      "restaurantName": "exact name",
      "itemId": "exact id",
      "itemName": "exact name",
      "price": 12000,
      "emoji": "🍔"
    }
  ],
  "totalPrice": 45000,
  "tagline": "Short witty description (max 40 chars)"
}`;

export async function POST(request: NextRequest) {
  try {
    const body: ComboRequest = await request.json();
    const { style } = body;

    if (!['healthy', 'comfort', 'spicy', 'budget'].includes(style)) {
      return NextResponse.json({ error: 'Invalid style' }, { status: 400 });
    }

    // Search for relevant menu items
    const searchQueries: Record<string, string> = {
      healthy: 'salad bowl grilled chicken juice fruit',
      comfort: 'burger pizza pasta fries cola cake',
      spicy: 'spicy hot chicken kebab wings chili',
      budget: 'affordable cheap value meal deal sandwich',
    };

    let menuContext = '';
    try {
      const items = await searchMenuItems(searchQueries[style], 20);
      if (items.length > 0) {
        menuContext = items.map((item, i) => (
          `[${i + 1}] restaurantId:${item.restaurantId} | restaurantName:${item.restaurantName} | itemId:${item.itemId} | itemName:${item.itemName} | price:${item.price} IQD | category:${item.category}`
        )).join('\n');
      }
    } catch {
      // Fallback: use restaurant names
    }

    // Fallback if no vector results
    if (!menuContext) {
      const restaurants = await fetchRestaurants();
      const open = restaurants.filter((r) => r.isOpen).slice(0, 20);
      menuContext = open.map((r, i) => (
        `[${i + 1}] restaurantId:${r.id} | restaurantName:${r.name} | cuisine:${r.cuisine.join(', ')} | rating:${r.rating}`
      )).join('\n');
    }

    const userPrompt = `Style: ${style}

MENU ITEMS:
${menuContext}

Generate a Smart Combo (Main + Side + Drink + Dessert):`;

    let aiResponse: string | null = null;

    if (process.env.OPENAI_API_KEY) {
      try {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const completion = await openai.chat.completions.create({
          model: AI_CONFIG.primaryModel,
          messages: [
            { role: 'system', content: COMBO_PROMPT },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: 500,
          temperature: 0.8,
          response_format: { type: 'json_object' },
        });
        aiResponse = completion.choices[0]?.message?.content || null;
      } catch (err) {
        console.error('[Combo] OpenAI failed:', err);
      }
    }

    if (!aiResponse && process.env.GROQ_API_KEY) {
      try {
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const completion = await groq.chat.completions.create({
          model: AI_CONFIG.fallbackModel,
          messages: [
            { role: 'system', content: COMBO_PROMPT },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: 500,
          temperature: 0.8,
          response_format: { type: 'json_object' },
        });
        aiResponse = completion.choices[0]?.message?.content || null;
      } catch (err) {
        console.error('[Combo] Groq failed:', err);
      }
    }

    if (aiResponse) {
      try {
        const parsed = JSON.parse(aiResponse);
        return NextResponse.json(parsed);
      } catch {
        return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
      }
    }

    // Fallback
    return NextResponse.json({
      title: `The ${style.charAt(0).toUpperCase() + style.slice(1)} Combo`,
      items: [],
      totalPrice: 0,
      tagline: 'Our AI is taking a break — try again!',
    });
  } catch {
    return NextResponse.json({ error: 'Combo generation failed' }, { status: 500 });
  }
}
