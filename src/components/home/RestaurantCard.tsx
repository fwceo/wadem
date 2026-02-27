'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Restaurant } from '@/types';

export default function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  const discountPromo = restaurant.promos.find((p) => p.type === 'percentage' && p.value > 0);

  return (
    <Link
      href={`/restaurant/${restaurant.id}`}
      className="group bg-white rounded-2xl overflow-hidden cursor-pointer transition-shadow hover:shadow-md active:scale-[0.98] transition-transform duration-100 block"
    >
      {/* Image */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-gray-100">
        {restaurant.image ? (
          <Image
            src={restaurant.image}
            alt={restaurant.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-gray-300">🍽️</div>
        )}

        {/* Overlay badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
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
        <div className="absolute bottom-3 right-3">
          <span className="bg-white text-secondary text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
            {restaurant.deliveryTime.min}–{restaurant.deliveryTime.max} min
          </span>
        </div>

        {/* Logo — bottom left */}
        {restaurant.logo && (
          <div className="absolute bottom-3 left-3 w-12 h-12 rounded-lg overflow-hidden border-2 border-white shadow bg-white">
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

      {/* Info */}
      <div className="px-3 py-2.5">
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
      </div>
    </Link>
  );
}
