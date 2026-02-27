import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import Groq from 'groq-sdk';
import { AI_CONFIG } from '@/lib/ai';

interface GreetingRequest {
  userName?: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  weatherCondition?: string;
  merchants?: string[];
}

const GREETING_PROMPT = `You are Wadem's concierge — a warm, witty food ordering assistant in Erbil, Iraq.

Generate a SHORT greeting (max 60 characters) based on the context provided.

Rules:
- If userName is null or empty, use "Guest".
- Morning (5am-11am): Suggest a breakfast merchant if available.
  Example: "Good morning, Ahmad! Perfect day for a wrap from Lezzoo."
- Afternoon (12pm-5pm): Be energetic about lunch/fuel.
  Example: "Afternoon, Ahmad! Fuel up with some sushi."
- Evening (5pm-9pm): Wind-down vibes, comfort food.
  Example: "Evening, Ahmad! Time for comfort food."
- Night (9pm-5am): Late-night snack mode.
  Example: "Late craving, Ahmad? We've got you."
- Poem Mode (you will be told when): Write a witty 2-line rhyme including their name.
  Example: "Ahmad's lunch is a serious quest, only the best for our favorite guest."
- STRICT: Max 60 characters total. No emojis. No quotes around the text.
- Return ONLY the greeting text, nothing else. No JSON, no explanation.`;

export async function POST(request: NextRequest) {
  try {
    const body: GreetingRequest = await request.json();
    const { userName, timeOfDay, weatherCondition, merchants } = body;

    const name = userName?.trim() || 'Guest';
    const isPoemMode = Math.random() < 0.1; // 10% chance

    const userPrompt = `Context:
- Name: ${name}
- Time: ${timeOfDay}
- Weather: ${weatherCondition || 'unknown'}
- Nearby merchants: ${merchants?.slice(0, 5).join(', ') || 'various restaurants'}
- Mode: ${isPoemMode ? 'POEM (write a witty 2-line rhyme with their name)' : 'NORMAL greeting'}

Generate the greeting (max 60 chars):`;

    let greeting: string | null = null;

    // Try OpenAI
    if (process.env.OPENAI_API_KEY) {
      try {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const completion = await openai.chat.completions.create({
          model: AI_CONFIG.primaryModel,
          messages: [
            { role: 'system', content: GREETING_PROMPT },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: 80,
          temperature: 0.9,
        });
        greeting = completion.choices[0]?.message?.content?.trim() || null;
      } catch (err) {
        console.error('[Greeting] OpenAI failed:', err);
      }
    }

    // Try Groq fallback
    if (!greeting && process.env.GROQ_API_KEY) {
      try {
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const completion = await groq.chat.completions.create({
          model: AI_CONFIG.fallbackModel,
          messages: [
            { role: 'system', content: GREETING_PROMPT },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: 80,
          temperature: 0.9,
        });
        greeting = completion.choices[0]?.message?.content?.trim() || null;
      } catch (err) {
        console.error('[Greeting] Groq failed:', err);
      }
    }

    // Rule-based fallback
    if (!greeting) {
      greeting = generateFallbackGreeting(name, timeOfDay, weatherCondition);
    }

    // Enforce max length
    if (greeting.length > 60) {
      greeting = greeting.slice(0, 57) + '...';
    }

    return NextResponse.json({ greeting, poem: isPoemMode });
  } catch {
    return NextResponse.json({ greeting: 'Welcome back! What are you craving?', poem: false });
  }
}

function generateFallbackGreeting(
  name: string,
  timeOfDay: string,
  weather?: string
): string {
  const w = weather ? `, ${weather.toLowerCase()} out` : '';
  switch (timeOfDay) {
    case 'morning':
      return `Good morning, ${name}! Breakfast time${w}.`;
    case 'afternoon':
      return `Hey ${name}! Time to fuel up${w}.`;
    case 'evening':
      return `Evening, ${name}! Comfort food awaits.`;
    case 'night':
      return `Late craving, ${name}? We got you.`;
    default:
      return `Hey ${name}! What are you craving?`;
  }
}
