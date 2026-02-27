# Wadem — The Fastest Food Delivery for Office Workers

> Order fast. Eat well. Get back to work.

A lightning-fast, mobile-first food delivery PWA built with Next.js 16, TypeScript, and Tailwind CSS. Designed for office workers who want to order lunch in under 60 seconds.

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS v4
- **State:** Zustand (cart, user, UI stores) with localStorage persistence
- **Animations:** Framer Motion
- **Auth:** Firebase Auth (Phone OTP + Google Sign-in)
- **Database:** Google Sheets API (MVP)
- **AI:** OpenAI GPT-4o-mini / Groq Llama (with rule-based fallback)
- **PWA:** Installable, offline menu cache

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual API keys (see `.env.example` for all required variables).

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for production

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Auth pages (login, verify, onboarding)
│   ├── (main)/             # Main app pages (home, search, orders, restaurant, profile)
│   └── api/                # API routes (auth, orders, restaurants, ai, promotions)
├── components/
│   ├── ui/                 # Reusable UI primitives (Button, Input, Card, etc.)
│   ├── home/               # Home screen components (TopBar, BottomNav, RestaurantCard)
│   ├── cart/               # Cart bottom sheet
│   └── ai/                 # AI assistant chat interface
├── stores/                 # Zustand state stores (cart, user, ui)
├── lib/                    # Utilities (firebase, sheets, ai, utils)
├── data/                   # Static data (restaurants.json, categories.json)
└── types/                  # TypeScript type definitions
```

## Key Features

- **3-tap auth** — Phone OTP or Google Sign-in, name, address, done
- **Home feed** — Time-aware greeting, quick reorder, promo carousel, category filters, restaurant cards
- **Restaurant detail** — Parallax hero, sticky category tabs, quick-add buttons, item customization bottom sheet
- **AI food concierge** — Chat interface with structured recommendation cards and one-tap "Add to Cart"
- **Smart search** — Live results, fuzzy matching, category-aware queries
- **Speed-optimized cart** — Bottom sheet checkout, inline promo codes, cash on delivery
- **Promotions engine** — Percentage/fixed/free-delivery promos with validation API

## API Routes

| Method | Route                      | Purpose                        |
|--------|----------------------------|--------------------------------|
| POST   | `/api/auth`                | Verify Firebase token          |
| GET    | `/api/restaurants`         | List all restaurants           |
| GET    | `/api/restaurants/[id]`    | Restaurant detail + menu       |
| POST   | `/api/orders`              | Place a new order              |
| GET    | `/api/orders?userId=X`     | User order history             |
| POST   | `/api/ai`                  | AI meal recommendations        |
| POST   | `/api/promotions/validate` | Validate a promo code          |
| GET    | `/api/promotions/active`   | List active promotions         |

## Deploy on Vercel

```bash
npm i -g vercel
vercel
```

Set all environment variables in the Vercel dashboard.
