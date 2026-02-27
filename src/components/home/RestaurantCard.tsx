'use client';

import { useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { Restaurant, MenuItem } from '@/types';
import { formatPrice } from '@/lib/utils';

const DRINK_SAUCE_KEYWORDS = [
  'drink', 'drinks', 'beverage', 'juice', 'water', 'soda', 'cola',
  'pepsi', 'sprite', 'fanta', 'coffee', 'tea', 'smoothie',
  'sauce', 'sauces', 'dip', 'ketchup', 'mayo', 'garlic sauce',
];

interface Slide {
  type: 'hero' | 'item';
  image: string;
  name?: string;
  price?: number;
  isPopular?: boolean;
}

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0 }),
};

export default function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  const discountPromo = restaurant.promos.find((p) => p.type === 'percentage' && p.value > 0);

  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [menuSlides, setMenuSlides] = useState<Slide[]>([]);
  const [fetched, setFetched] = useState(false);
  const fetchingRef = useRef(false);

  // Build slides: hero first, then menu items (loaded on first swipe)
  const heroSlide: Slide = { type: 'hero', image: restaurant.image };
  const allSlides: Slide[] = [heroSlide, ...menuSlides];
  const count = allSlides.length;
  const showDots = fetched && count > 1;

  const fetchMenuItems = useCallback(async () => {
    if (fetched || fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const res = await fetch(`/api/restaurants/${restaurant.id}/menu`);
      const data = await res.json();
      const items: MenuItem[] = (data.categories || []).flatMap((c: { items: MenuItem[] }) => c.items);
      const filtered = items
        .filter((item) => {
          const nameAndCat = `${item.name} ${item.category}`.toLowerCase();
          return !DRINK_SAUCE_KEYWORDS.some((kw) => nameAndCat.includes(kw)) && item.image && item.isAvailable;
        })
        .slice(0, 4);
      setMenuSlides(filtered.map((item) => ({
        type: 'item' as const,
        image: item.image,
        name: item.name,
        price: item.price,
        isPopular: item.isPopular,
      })));
    } catch { /* silent */ }
    setFetched(true);
    fetchingRef.current = false;
  }, [restaurant.id, fetched]);

  const goToNext = useCallback(() => {
    setDirection(1);
    setActiveIndex((prev) => (prev + 1) % count);
  }, [count]);

  const goToPrev = useCallback(() => {
    setDirection(-1);
    setActiveIndex((prev) => (prev - 1 + count) % count);
  }, [count]);

  const handleDragEnd = useCallback(async (_: unknown, info: PanInfo) => {
    // On first swipe, fetch menu items
    if (!fetched) {
      await fetchMenuItems();
    }
    if (info.offset.x > 50) {
      goToPrev();
    } else if (info.offset.x < -50) {
      goToNext();
    }
  }, [fetched, fetchMenuItems, goToNext, goToPrev]);

  const currentSlide = allSlides[activeIndex] || heroSlide;

  return (
    <div className="bg-white rounded-2xl overflow-hidden transition-shadow hover:shadow-md">
      {/* Image area — swipeable */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-gray-100">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={activeIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.12}
            onDragEnd={handleDragEnd}
            className="absolute inset-0 cursor-grab active:cursor-grabbing"
          >
            {currentSlide.image ? (
              <Image
                src={currentSlide.image}
                alt={currentSlide.name || restaurant.name}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl text-gray-300">🍽️</div>
            )}

            {/* Item overlay — only for menu item slides */}
            {currentSlide.type === 'item' && currentSlide.name && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent pt-10 pb-3 px-3">
                <div className="flex items-end justify-between">
                  <p className="text-white font-bold text-sm leading-tight drop-shadow-sm line-clamp-1">
                    {currentSlide.name}
                  </p>
                  {currentSlide.price !== undefined && (
                    <span className="bg-white text-secondary font-bold text-xs px-2 py-1 rounded-lg shadow-sm flex-shrink-0 ml-2">
                      {formatPrice(currentSlide.price)}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Popular badge on item slides */}
            {currentSlide.type === 'item' && currentSlide.isPopular && (
              <div className="absolute top-3 right-3">
                <span className="bg-accent text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-sm">
                  Popular
                </span>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Overlay badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
          {discountPromo && (
            <span className="bg-accent text-white text-xs font-bold px-2 py-1 rounded-md">
              {discountPromo.value}% OFF
            </span>
          )}
          {restaurant.deliveryFee === 0 && (
            <span className="bg-secondary/80 text-white text-xs font-medium px-2 py-1 rounded-md backdrop-blur-sm">
              Free delivery
            </span>
          )}
        </div>

        {/* Delivery time pill — bottom right */}
        {currentSlide.type === 'hero' && (
          <div className="absolute bottom-3 right-3 z-10">
            <span className="bg-white text-secondary text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
              {restaurant.deliveryTime.min}–{restaurant.deliveryTime.max} min
            </span>
          </div>
        )}

        {/* Logo — bottom left (hero only) */}
        {currentSlide.type === 'hero' && restaurant.logo && (
          <div className="absolute bottom-3 left-3 w-12 h-12 rounded-lg overflow-hidden border-2 border-white shadow bg-white z-10">
            <Image src={restaurant.logo} alt="" fill className="object-cover" sizes="40px" />
          </div>
        )}

        {/* Pagination dots */}
        {showDots && (
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1 z-10">
            {allSlides.map((_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all duration-200 ${
                  i === activeIndex ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50'
                }`}
              />
            ))}
          </div>
        )}

        {/* Swipe hint dots — before fetch, show 3 faint dots to hint swipeability */}
        {!fetched && (
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1 z-10">
            <div className="w-4 h-1.5 bg-white rounded-full" />
            <div className="w-1.5 h-1.5 bg-white/40 rounded-full" />
            <div className="w-1.5 h-1.5 bg-white/40 rounded-full" />
          </div>
        )}
      </div>

      {/* Info — links to restaurant page */}
      <Link
        href={`/restaurant/${restaurant.id}`}
        className="block px-3 py-2.5 active:scale-[0.98] transition-transform duration-100"
      >
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[15px] font-bold text-secondary leading-tight line-clamp-1">
            {restaurant.name}
          </h3>
          {restaurant.rating > 0 && (
            <span className="flex-shrink-0 bg-accent/10 text-accent text-xs font-bold px-1.5 py-0.5 rounded">
              ★ {restaurant.rating.toFixed(1)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 mt-1 text-[13px] text-text-secondary">
          <span>{restaurant.cuisine.slice(0, 2).join(' · ')}</span>
          {restaurant.distance !== undefined && (
            <>
              <span className="text-border">•</span>
              <span>{restaurant.distance.toFixed(1)} km</span>
            </>
          )}
        </div>
      </Link>
    </div>
  );
}
