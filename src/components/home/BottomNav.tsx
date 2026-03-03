'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import { useUIStore } from '@/stores/ui';
import { useCartStore } from '@/stores/cart';

const tabs = [
  {
    id: 'home',
    label: 'Home',
    path: '/',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6" />
      </svg>
    ),
  },
  {
    id: 'search',
    label: 'Search',
    path: '/search',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    id: 'cart',
    label: 'Cart',
    path: '',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
      </svg>
    ),
  },
  {
    id: 'orders',
    label: 'Orders',
    path: '/orders',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { setActiveTab, openCart } = useUIStore();
  const itemCount = useCartStore((s) => s.getItemCount());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getActiveTab = () => {
    if (pathname === '/') return 'home';
    if (pathname.startsWith('/search')) return 'search';
    if (pathname.startsWith('/orders')) return 'orders';
    return 'home';
  };

  const activeTab = getActiveTab();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border shadow-[0_-2px_10px_rgba(0,0,0,0.05)] h-16 flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]">
      {tabs.map((tab) => {
        const isCart = tab.id === 'cart';
        const isActive = !isCart && activeTab === tab.id;

        return (
          <motion.button
            key={tab.id}
            whileTap={{ scale: 0.85 }}
            onClick={() => {
              if (isCart) {
                openCart();
              } else {
                setActiveTab(tab.id as 'home' | 'search' | 'orders');
                router.push(tab.path);
              }
            }}
            className="relative flex flex-col items-center justify-center gap-0.5 w-16 h-full"
          >
            <span className={
              isCart
                ? 'text-secondary'
                : isActive
                  ? 'text-secondary'
                  : 'text-text-tertiary'
            }>
              {tab.icon}
            </span>
            <span className={`text-[10px] font-medium ${
              isCart
                ? 'text-secondary'
                : isActive
                  ? 'text-secondary font-semibold'
                  : 'text-text-tertiary'
            }`}>
              {tab.label}
            </span>

            {/* Cart badge */}
            <AnimatePresence>
              {isCart && mounted && itemCount > 0 && (
                <motion.span
                  key={itemCount}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                  className="absolute top-1.5 right-2 bg-accent text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1"
                >
                  {itemCount}
                </motion.span>
              )}
            </AnimatePresence>

            {/* Active indicator dot */}
            {isActive && (
              <motion.span
                layoutId="nav-indicator"
                className="absolute bottom-1 w-1 h-1 bg-primary rounded-full"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </motion.button>
        );
      })}
    </nav>
  );
}
