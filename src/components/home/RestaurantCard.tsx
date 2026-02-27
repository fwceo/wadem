'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Restaurant, MenuItem } from '@/types';
import ItemSlider from '@/components/ui/ItemSlider';

export default function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  const discountPromo = restaurant.promos.find((p) => p.type === 'percentage' && p.value > 0);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  useEffect(() => {
    fetch(`/api/restaurants/${restaurant.id}/menu`)
      .then((res) => res.json())
      .then((data) => {
        const items = (data.categories || []).flatMap((c: { items: MenuItem[] }) => c.items);
        setMenuItems(items);
      })
      .catch(() => {});
  }, [restaurant.id]);

  const hasSliderItems = menuItems.length > 0;

  return (
    <div className="bg-white rounded-2xl overflow-hidden transition-shadow hover:shadow-md">
      {/* Image area — slider if menu loaded, static fallback otherwise */}
      <div className="relative">
        {hasSliderItems ? (
          <ItemSlider items={menuItems} />
        ) : (
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-gray-100">
            {restaurant.image ? (
              <Image
                src={restaurant.image}
                alt={restaurant.name}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl text-gray-300">🍽️</div>
            )}
          </div>
        )}

        {/* Overlay badges — always on top */}
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
        <div className="absolute bottom-3 right-3 z-10">
          <span className="bg-white text-secondary text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
            {restaurant.deliveryTime.min}–{restaurant.deliveryTime.max} min
          </span>
        </div>

        {/* Logo — bottom left */}
        {restaurant.logo && (
          <div className="absolute bottom-3 left-3 w-12 h-12 rounded-lg overflow-hidden border-2 border-white shadow bg-white z-10">
            <Image
              src={restaurant.logo}
              alt=""
              fill
              className="object-cover"
              sizes="40px"
            />
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
