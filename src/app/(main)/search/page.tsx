'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import Input from '@/components/ui/Input';
import { Chip, ChipGroup } from '@/components/ui/Chip';
import { useUIStore } from '@/stores/ui';
import { Restaurant } from '@/types';

const popularSearches = ['Pizza', 'Burger', 'Shawarma', 'Kebab', 'Sushi', 'Coffee', 'Falafel', 'Donut', 'Pasta', 'Fast Food'];

function fuzzyMatch(text: string, query: string): boolean {
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  if (lower.includes(q)) return true;
  if (q.length >= 3) {
    for (let i = 0; i < q.length; i++) {
      const partial = q.slice(0, i) + q.slice(i + 1);
      if (lower.includes(partial)) return true;
    }
  }
  return false;
}

function useRestaurants() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  useEffect(() => {
    fetch('/api/restaurants')
      .then((res) => res.json())
      .then((data) => setRestaurants(data.restaurants || []))
      .catch(() => {});
  }, []);
  return restaurants;
}

export default function SearchPage() {
  const router = useRouter();
  const openAI = useUIStore((s) => s.openAI);
  const restaurants = useRestaurants();
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const matchedRestaurants = useMemo(() => {
    if (!query.trim()) return [];

    return restaurants.filter((r) =>
      fuzzyMatch(r.name, query) ||
      r.cuisine.some((c: string) => fuzzyMatch(c, query))
    );
  }, [query, restaurants]);

  const handleSearch = (term: string) => {
    setQuery(term);
    if (term.trim() && !recentSearches.includes(term)) {
      setRecentSearches((prev) => [term, ...prev.slice(0, 4)]);
    }
  };

  const hasResults = matchedRestaurants.length > 0;

  return (
    <div className="px-4 pt-4">
      <Input
        placeholder="Search restaurants or dishes..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        }
        rightIcon={
          query && (
            <button onClick={() => setQuery('')}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )
        }
      />

      {!query.trim() && (
        <div className="mt-6 space-y-6">
          {recentSearches.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-text-secondary">Recent Searches</h3>
                <button
                  onClick={() => setRecentSearches([])}
                  className="text-xs text-primary font-medium"
                >
                  Clear
                </button>
              </div>
              {recentSearches.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSearch(s)}
                  className="flex items-center gap-2 py-2 w-full text-left"
                >
                  <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm text-text-primary">{s}</span>
                </button>
              ))}
            </div>
          )}

          <div>
            <h3 className="text-sm font-semibold text-text-secondary mb-2">Popular Searches</h3>
            <ChipGroup className="px-0 flex-wrap">
              {popularSearches.map((s) => (
                <Chip key={s} label={s} onClick={() => handleSearch(s)} />
              ))}
            </ChipGroup>
          </div>
        </div>
      )}

      <AnimatePresence>
        {query.trim() && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-4 space-y-6"
          >
            {matchedRestaurants.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-text-secondary mb-2">
                  Restaurants ({matchedRestaurants.length})
                </h3>
                <div className="space-y-2">
                  {matchedRestaurants.slice(0, 20).map((r) => (
                    <motion.button
                      key={r.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => router.push(`/restaurant/${r.id}`)}
                      className="flex items-center gap-3 w-full p-3 bg-white rounded-xl"
                    >
                      <div className="w-12 h-12 rounded-lg overflow-hidden relative flex-shrink-0 bg-gray-100">
                        {(r.logo || r.image) ? (
                          <Image src={r.logo || r.image} alt={r.name} fill className="object-cover" sizes="48px" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-lg text-gray-300">🍽️</div>
                        )}
                      </div>
                      <div className="text-left min-w-0">
                        <p className="text-sm font-semibold text-text-primary truncate">{r.name}</p>
                        <p className="text-xs text-text-secondary truncate">{r.cuisine.join(' · ')}</p>
                      </div>
                      <div className="ml-auto flex flex-col items-end flex-shrink-0">
                        <div className="flex items-center gap-1">
                          <span className="text-xs">⭐</span>
                          <span className="text-xs font-semibold">{r.rating}</span>
                        </div>
                        <span className="text-[11px] text-text-secondary">
                          {r.deliveryTime.min} min
                        </span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {!hasResults && (
              <div className="text-center py-12">
                <span className="text-4xl block mb-3">🔍</span>
                <p className="text-text-secondary text-sm mb-3">
                  No results for &quot;{query}&quot;
                </p>
                <button
                  onClick={openAI}
                  className="text-primary font-medium text-sm"
                >
                  Can&apos;t find it? Ask Wadem AI →
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
