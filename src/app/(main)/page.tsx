'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useUIStore } from '@/stores/ui';
import { useUserStore } from '@/stores/user';
import RestaurantCard from '@/components/home/RestaurantCard';
import Skeleton from '@/components/ui/Skeleton';
import TypewriterGreeting from '@/components/home/TypewriterGreeting';
import PromoBanners from '@/components/home/PromoBanners';
import WeatherBadge from '@/components/home/WeatherBadge';
import categoriesData from '@/data/categories.json';
import { Restaurant } from '@/types';

const categories = categoriesData as { id: string; name: string; icon: string; image?: string }[];

export default function HomePage() {
  const router = useRouter();
  const openAI = useUIStore((s) => s.openAI);
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/restaurants')
      .then((res) => res.json())
      .then((data) => {
        setRestaurants(data.restaurants || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredRestaurants =
    selectedCategory === 'all'
      ? restaurants
      : restaurants.filter((r) =>
          r.cuisine.some((c) =>
            c.toLowerCase().includes(selectedCategory.toLowerCase())
          )
        );

  const openCount = restaurants.filter((r) => r.isOpen).length;

  return (
    <div>
      {/* Hero Section */}
      <div className="relative bg-primary overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 z-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, #111 1px, transparent 1px), radial-gradient(circle at 75% 75%, #111 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 pt-6 pb-8 md:pt-10 md:pb-12">
          <div className="flex items-center justify-between animate-fade-in-up">
            <h1 className="text-2xl md:text-4xl font-extrabold text-secondary leading-tight">
              Hungry? We&apos;ve got you.
            </h1>
            <WeatherBadge />
          </div>
          <div className="mt-1.5 animate-fade-in-up" style={{ animationDelay: '50ms' }}>
            <TypewriterGreeting />
          </div>
          <p className="text-secondary/70 text-xs mt-1 animate-fade-in-up" style={{ animationDelay: '80ms' }}>
            {openCount > 0
              ? `${openCount} restaurants delivering near you`
              : 'Discover restaurants near you'}
          </p>

          {/* Mobile search bar */}
          <button
            onClick={() => router.push('/search')}
            className="md:hidden mt-4 w-full flex items-center gap-3 bg-white rounded-full px-4 py-3 shadow-sm active:scale-[0.98] transition-transform duration-100 animate-fade-in-up"
            style={{ animationDelay: '100ms' }}
          >
            <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-text-secondary text-sm">Search restaurants or dishes...</span>
          </button>

          {/* AI prompt */}
          <button
            onClick={openAI}
            className="flex items-center gap-2 mt-3 md:mt-4 bg-secondary text-white rounded-full px-4 md:px-5 py-2.5 text-sm font-medium hover:bg-secondary/90 active:scale-[0.97] transition-all duration-100 w-full md:w-auto justify-center md:justify-start animate-fade-in-up"
            style={{ animationDelay: '150ms' }}
          >
            <span>✨</span>
            <span>Ask Wadem AI for a suggestion</span>
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Category Pills — horizontal scroll with menu button */}
        <div className="sticky top-14 md:top-16 z-20 bg-background border-b border-border-light">
          <div className="flex items-center">
            <button
              onClick={() => setShowCategoryModal(true)}
              className="flex-shrink-0 px-3 py-3 border-r border-border-light active:scale-90 transition-transform duration-100"
              aria-label="Browse categories"
            >
              <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex-1 overflow-x-auto no-scrollbar">
              <div className="flex gap-2 px-3 py-3">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-all duration-150 active:scale-[0.92] ${
                      selectedCategory === cat.id
                        ? 'bg-secondary text-white border-secondary shadow-md'
                        : 'bg-white text-secondary border-border hover:border-secondary/30 hover:shadow-sm'
                    }`}
                  >
                    {cat.image ? (
                      <Image src={cat.image} alt={cat.name} width={24} height={24} className="w-6 h-6 object-contain" />
                    ) : (
                      <span>{cat.icon}</span>
                    )}
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Promo Banners — Speed, Delivery, AI-Concierge */}
        <div className="px-4 md:px-6 pt-5">
          <PromoBanners />
        </div>

        {/* Section Header */}
        <div className="px-4 md:px-6 pt-6 pb-2 flex items-center justify-between">
          <h2 className="text-lg md:text-xl font-bold text-secondary">
            {selectedCategory === 'all'
              ? 'All restaurants'
              : `${categories.find((c) => c.id === selectedCategory)?.name || 'Restaurants'}`}
          </h2>
          <span className="text-sm text-text-secondary">
            {filteredRestaurants.length} places
          </span>
        </div>

        {/* Restaurant Grid */}
        <div className="px-4 md:px-6 pb-6">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl overflow-hidden animate-fade-in-up"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <Skeleton className="aspect-[16/10] w-full" />
                  <div className="p-3 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredRestaurants.length > 0 ? (
            <div
              key={selectedCategory}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            >
              {filteredRestaurants.map((restaurant, i) => {
                const isLocked = !isAuthenticated && i >= 20;
                return (
                  <div
                    key={restaurant.id}
                    className="animate-fade-in-up relative"
                    style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}
                  >
                    {isLocked ? (
                      <div className="bg-white rounded-2xl overflow-hidden">
                        <div className="relative aspect-[16/10] w-full bg-gray-100">
                          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
                            <svg className="w-8 h-8 text-white/80 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <p className="text-white text-sm font-semibold mb-2">Login to view all restaurants</p>
                            <button
                              onClick={() => router.push('/login')}
                              className="bg-primary text-secondary text-sm font-bold px-5 py-2 rounded-full hover:bg-primary-dark transition-colors"
                            >
                              Login
                            </button>
                          </div>
                        </div>
                        <div className="px-3 py-2.5">
                          <div className="h-5 w-3/4 bg-gray-200 rounded" />
                          <div className="h-4 w-1/2 bg-gray-100 rounded mt-1.5" />
                        </div>
                      </div>
                    ) : (
                      <RestaurantCard restaurant={restaurant} />
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 animate-fade-in-up">
              <span className="text-5xl block mb-4">🍽️</span>
              <p className="text-text-secondary text-sm">No restaurants found in this category</p>
              <button
                onClick={() => setSelectedCategory('all')}
                className="text-accent font-semibold text-sm mt-3 hover:underline"
              >
                View all restaurants
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Category Navigation Modal */}
      <AnimatePresence>
        {showCategoryModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-50"
              onClick={() => setShowCategoryModal(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl max-h-[70vh] overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <h3 className="text-base font-bold text-secondary">Categories</h3>
                <button onClick={() => setShowCategoryModal(false)} className="p-1">
                  <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="overflow-y-auto max-h-[calc(70vh-52px)] py-2">
                {categories.map((cat) => {
                  const count = cat.id === 'all'
                    ? restaurants.length
                    : restaurants.filter((r) => r.cuisine.some((c) => c.toLowerCase().includes(cat.id.toLowerCase()))).length;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        setShowCategoryModal(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3.5 text-left transition-colors active:bg-gray-100 ${
                        selectedCategory === cat.id ? 'bg-primary/5' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {selectedCategory === cat.id && (
                          <div className="w-1 h-6 bg-primary rounded-full" />
                        )}
                        {cat.image ? (
                          <Image src={cat.image} alt={cat.name} width={32} height={32} className="w-8 h-8 object-contain" />
                        ) : (
                          <span className="text-xl">{cat.icon}</span>
                        )}
                        <span className={`text-sm ${selectedCategory === cat.id ? 'text-secondary font-bold' : 'text-text-primary font-medium'}`}>
                          {cat.name}
                        </span>
                      </div>
                      <span className="text-xs text-text-tertiary">{count}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
