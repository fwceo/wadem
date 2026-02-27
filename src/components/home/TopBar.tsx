'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useUserStore } from '@/stores/user';
import { useCartStore } from '@/stores/cart';
import { useUIStore } from '@/stores/ui';
import { truncateText } from '@/lib/utils';

export default function TopBar() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const itemCount = useCartStore((s) => s.getItemCount());
  const openCart = useUIStore((s) => s.openCart);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const addressText = mounted && user?.address?.formatted
    ? truncateText(user.address.formatted, 30)
    : 'Enter delivery address';

  const initials = mounted && user?.name
    ? user.name.charAt(0).toUpperCase()
    : '?';

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-secondary">
      <div className="max-w-7xl mx-auto">
        {/* Main nav row */}
        <div className="h-14 md:h-16 flex items-center gap-3 px-4 md:px-6">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
              <Image src="/wadem-logo.png" alt="Wadem" width={48} height={48} className="w-full h-full object-contain" />
            </div>
            <span className="hidden sm:block text-white font-extrabold text-lg tracking-tight">
              Wadem
            </span>
          </a>

          {/* Location pill */}
          <button
            onClick={() => router.push('/onboarding')}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 rounded-full px-3 py-1.5 transition-colors min-w-0"
          >
            <svg className="w-4 h-4 text-primary flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span className="text-white text-sm font-medium truncate max-w-[140px] md:max-w-[200px]">
              {addressText}
            </span>
            <svg className="w-3.5 h-3.5 text-white/60 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Desktop search (hidden on mobile — separate search page) */}
          <div className="hidden md:flex flex-1 max-w-xl">
            <button
              onClick={() => router.push('/search')}
              className="w-full flex items-center gap-2 bg-white/10 hover:bg-white/15 rounded-full px-4 py-2 transition-colors"
            >
              <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="text-white/50 text-sm">Search restaurants or dishes...</span>
            </button>
          </div>

          {/* Spacer */}
          <div className="flex-1 md:hidden" />

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Cart button — desktop */}
            <button
              onClick={openCart}
              className="hidden md:flex items-center gap-2 bg-primary hover:bg-primary-dark text-secondary font-bold rounded-full px-4 py-2 text-sm transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
              {mounted && itemCount > 0 && (
                <span className="bg-secondary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </button>

            {/* Profile */}
            <a
              href="/profile"
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <span className="text-sm font-bold text-white">{initials}</span>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
