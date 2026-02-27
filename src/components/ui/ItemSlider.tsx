'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { MenuItem } from '@/types/restaurant';
import { formatPrice } from '@/lib/utils';

const DRINK_SAUCE_KEYWORDS = [
  'drink', 'drinks', 'beverage', 'beverages', 'juice', 'water', 'soda', 'cola',
  'pepsi', 'sprite', 'fanta', 'coffee', 'tea', 'smoothie', 'milkshake', 'lemonade',
  'sauce', 'sauces', 'dip', 'dips', 'ketchup', 'mayo', 'mayonnaise', 'mustard',
  'garlic sauce', 'hot sauce', 'chili sauce', 'extra sauce',
];

function isDrinkOrSauce(item: MenuItem): boolean {
  const nameAndCat = `${item.name} ${item.category}`.toLowerCase();
  return DRINK_SAUCE_KEYWORDS.some((kw) => nameAndCat.includes(kw));
}

interface ItemSliderProps {
  items: MenuItem[];
  onItemTap?: (item: MenuItem) => void;
}

const SWIPE_THRESHOLD = 50;

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? '-100%' : '100%',
    opacity: 0,
  }),
};

export default function ItemSlider({ items, onItemTap }: ItemSliderProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  // Filter to non-drink/sauce items with images, take 5
  const sliderItems = items
    .filter((item) => !isDrinkOrSauce(item) && item.image && item.isAvailable)
    .slice(0, 5);

  const count = sliderItems.length;

  const goToNext = useCallback(() => {
    if (count <= 1) return;
    setDirection(1);
    setActiveIndex((prev) => (prev + 1) % count);
  }, [count]);

  const goToPrev = useCallback(() => {
    if (count <= 1) return;
    setDirection(-1);
    setActiveIndex((prev) => (prev - 1 + count) % count);
  }, [count]);

  const goToIndex = useCallback((idx: number) => {
    setDirection(idx > activeIndex ? 1 : -1);
    setActiveIndex(idx);
  }, [activeIndex]);

  const handleDragEnd = useCallback((_: unknown, info: PanInfo) => {
    if (info.offset.x > SWIPE_THRESHOLD) {
      goToPrev();
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      goToNext();
    }
  }, [goToNext, goToPrev]);

  if (count === 0) return null;

  const currentItem = sliderItems[activeIndex];

  return (
    <div className="relative w-full bg-white">
      {/* Slider container */}
      <div className="relative w-full aspect-[2.2/1] overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={activeIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={handleDragEnd}
            className="absolute inset-0 cursor-grab active:cursor-grabbing"
            onClick={() => onItemTap?.(currentItem)}
          >
            {currentItem.image ? (
              <Image
                src={currentItem.image}
                alt={currentItem.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                <span className="text-4xl text-gray-300">🍽️</span>
              </div>
            )}

            {/* Dark overlay tag — bottom left */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent pt-12 pb-3 px-4">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-white font-bold text-base leading-tight drop-shadow-sm">
                    {currentItem.name}
                  </p>
                  {currentItem.description && (
                    <p className="text-white/70 text-xs mt-0.5 line-clamp-1 max-w-[200px]">
                      {currentItem.description}
                    </p>
                  )}
                </div>
                <span className="bg-white text-secondary font-bold text-sm px-3 py-1.5 rounded-xl shadow-sm flex-shrink-0 ml-3">
                  {formatPrice(currentItem.price)}
                </span>
              </div>
            </div>

            {/* Popular badge */}
            {currentItem.isPopular && (
              <div className="absolute top-3 left-3">
                <span className="bg-accent text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-sm">
                  Popular
                </span>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Pagination dots */}
      {count > 1 && (
        <div className="flex justify-center gap-1.5 py-2.5">
          {sliderItems.map((_, i) => (
            <button
              key={i}
              onClick={() => goToIndex(i)}
              className="p-0.5"
              aria-label={`Go to slide ${i + 1}`}
            >
              <motion.div
                animate={{
                  width: i === activeIndex ? 20 : 6,
                  backgroundColor: i === activeIndex ? '#111111' : '#D1D5DB',
                }}
                transition={{ duration: 0.25 }}
                className="h-1.5 rounded-full"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
