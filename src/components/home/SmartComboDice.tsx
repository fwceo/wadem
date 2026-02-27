'use client';

import { useState, useMemo, forwardRef } from 'react';
import Image from 'next/image';
import { MenuItem } from '@/types/restaurant';

interface SmartComboDiceProps {
  restaurantId: string;
  restaurantName: string;
  menuItems: MenuItem[];
  onAddToCart: (item: MenuItem) => void;
}

// Keywords to identify drink / sauce categories
const DRINK_KEYWORDS = ['drink', 'beverage', 'juice', 'water', 'soda', 'cola', 'pepsi', 'coffee', 'tea', 'lemonade', 'smoothie', 'milkshake', 'shake'];
const SAUCE_KEYWORDS = ['sauce', 'dip', 'ketchup', 'mayo', 'mayonnaise', 'garlic sauce', 'dressing', 'condiment', 'extra sauce', 'hot sauce'];

function isDrink(item: MenuItem): boolean {
  const text = `${item.name} ${item.category}`.toLowerCase();
  return DRINK_KEYWORDS.some((kw) => text.includes(kw));
}

function isSauce(item: MenuItem): boolean {
  const text = `${item.name} ${item.category}`.toLowerCase();
  return SAUCE_KEYWORDS.some((kw) => text.includes(kw));
}

function smartPick(items: MenuItem[], count: number): MenuItem[] {
  const available = items.filter((m) => m.isAvailable);
  const foods = available.filter((m) => !isDrink(m) && !isSauce(m));
  const drinks = available.filter((m) => isDrink(m));
  const sauces = available.filter((m) => isSauce(m));

  const shuffle = <T,>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5);
  const result: MenuItem[] = [];

  // Pick main food items first (count - up to 1 drink - up to 1 sauce)
  const foodSlots = Math.max(count - (drinks.length > 0 ? 1 : 0) - (sauces.length > 0 ? 1 : 0), count - 2);
  result.push(...shuffle(foods).slice(0, foodSlots));

  // Add max 1 drink
  if (drinks.length > 0 && result.length < count) {
    result.push(shuffle(drinks)[0]);
  }
  // Add max 1 sauce
  if (sauces.length > 0 && result.length < count) {
    result.push(shuffle(sauces)[0]);
  }
  // Fill remaining slots with food if needed
  if (result.length < count) {
    const usedIds = new Set(result.map((r) => r.id));
    const remaining = shuffle(foods).filter((f) => !usedIds.has(f.id));
    result.push(...remaining.slice(0, count - result.length));
  }

  return shuffle(result).slice(0, count);
}

const SmartComboDice = forwardRef<HTMLDivElement, SmartComboDiceProps>(
  function SmartComboDice({ restaurantId, restaurantName, menuItems, onAddToCart }, ref) {
  const [picks, setPicks] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  // Initial picks — stable until shuffle
  const initialPicks = useMemo(
    () => smartPick(menuItems.filter((m) => m.image), 4),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [menuItems.length]
  );

  const handleShuffle = () => {
    if (menuItems.length < 2) return;
    setLoading(true);
    setIsShuffling(true);
    setPicks([]);
    setAddedIds(new Set());

    setTimeout(() => {
      setPicks(smartPick(menuItems, 4));
      setIsShuffling(false);
      setLoading(false);
    }, 1000);
  };

  const handleAdd = (item: MenuItem) => {
    onAddToCart(item);
    setAddedIds((prev) => new Set(prev).add(item.id));
  };

  const displayPicks = picks.length > 0 ? picks : initialPicks;

  const renderCard = (item: MenuItem) => {
    const isAdded = addedIds.has(item.id);
    return (
      <div
        key={item.id}
        className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm max-w-[220px]"
      >
        <div className="relative aspect-[4/3] bg-gray-50">
          {item.image ? (
            <Image
              src={item.image}
              alt={item.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 45vw, 200px"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-4xl text-gray-300">
              🍽️
            </div>
          )}
          <button
            onClick={() => handleAdd(item)}
            disabled={isAdded}
            className={`absolute bottom-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all duration-150 ${
              isAdded
                ? 'bg-accent text-white'
                : 'bg-white text-secondary hover:bg-gray-50'
            }`}
          >
            {isAdded ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
              </svg>
            ) : (
              <span className="text-lg font-bold leading-none">+</span>
            )}
          </button>
        </div>
        <div className="px-2.5 py-2">
          <p className="text-[13px] font-semibold text-secondary leading-tight line-clamp-2">
            {item.name}
          </p>
          <p className="text-[13px] font-bold text-secondary mt-1">
            IQD {item.price.toLocaleString()}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div ref={ref} className="pt-5 pb-2">
      {/* Header row */}
      <div className="flex items-center justify-between px-4 md:px-6 mb-3">
        <div>
          <h3 className="text-base font-bold text-secondary">Picks for you 🔥</h3>
          <p className="text-[11px] text-text-secondary">Curated just for you</p>
        </div>
        <button
          onClick={handleShuffle}
          disabled={loading || menuItems.length < 2}
          className="flex items-center gap-1.5 bg-primary hover:bg-primary-dark text-secondary font-bold rounded-full px-3 py-1.5 text-sm active:scale-95 transition-all duration-150 disabled:opacity-40"
        >
          <span className={`text-base ${isShuffling ? 'animate-spin' : ''}`}>🎲</span>
          <span>{loading ? 'Shuffling...' : 'Shuffle'}</span>
        </button>
      </div>

      {/* Shuffle animation */}
      {isShuffling && (
        <div className="px-4 md:px-6 py-6 flex items-center justify-center">
          <div className="flex gap-4">
            {['🍔', '🥗', '🥤', '🍰'].map((emoji, i) => (
              <span
                key={i}
                className="text-3xl animate-bounce"
                style={{ animationDelay: `${i * 120}ms` }}
              >
                {emoji}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 2-col mobile / 4-col desktop grid */}
      {!isShuffling && displayPicks.length > 0 && (
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-2.5 px-4 md:px-6 ${picks.length > 0 ? 'animate-fade-in-up' : ''}`}>
          {displayPicks.map(renderCard)}
        </div>
      )}
    </div>
  );
});

export default SmartComboDice;
