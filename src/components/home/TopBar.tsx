'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserStore } from '@/stores/user';
import { useCartStore } from '@/stores/cart';
import { useUIStore } from '@/stores/ui';
import { truncateText } from '@/lib/utils';

export default function TopBar() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const setAddress = useUserStore((s) => s.setAddress);
  const setDefaultAddress = useUserStore((s) => s.setDefaultAddress);
  const itemCount = useCartStore((s) => s.getItemCount());
  const openCart = useUIStore((s) => s.openCart);
  const [mounted, setMounted] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  // Close dropdown on outside click
  useEffect(() => {
    if (!showDropdown) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showDropdown]);

  const hasAddress = mounted && user?.address?.formatted && user.address.formatted.trim();
  const savedAddresses = (mounted && user?.savedAddresses) || [];
  const addressText = hasAddress
    ? truncateText(user!.address.formatted, 30)
    : 'Add address';

  const initials = mounted && user?.name
    ? user.name.charAt(0).toUpperCase()
    : '?';

  const handleSelectAddress = (addr: { formatted: string; lat: number; lng: number; building?: string; floor?: string; unit?: string; addressType?: string; id?: string }) => {
    setAddress({
      formatted: addr.formatted,
      lat: addr.lat,
      lng: addr.lng,
      building: addr.building,
      floor: addr.floor,
      unit: addr.unit,
      addressType: addr.addressType as 'home' | 'apartment' | 'office' | 'other' | undefined,
    });
    if (addr.id) {
      setDefaultAddress(addr.id);
    }
    setShowDropdown(false);
  };

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

          {/* Location pill + dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => {
                if (!hasAddress && savedAddresses.length === 0) {
                  router.push('/onboarding');
                  return;
                }
                setShowDropdown(!showDropdown);
              }}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 rounded-full px-3 py-1.5 transition-colors min-w-0"
            >
              <svg className="w-4 h-4 text-primary flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              <span className="text-white text-sm font-medium truncate max-w-[140px] md:max-w-[200px]">
                {addressText}
              </span>
              <svg className={`w-3.5 h-3.5 text-white/60 flex-shrink-0 transition-transform ${showDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Address dropdown */}
            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50"
                >
                  {/* Current address */}
                  {hasAddress && (
                    <div className="px-4 py-3 bg-primary/5 border-b border-gray-100">
                      <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1">Delivering to</p>
                      <p className="text-sm font-semibold text-secondary truncate">{user!.address.formatted}</p>
                    </div>
                  )}

                  {/* Saved addresses */}
                  {savedAddresses.length > 0 && (
                    <div className="max-h-48 overflow-y-auto">
                      {savedAddresses.map((addr) => {
                        const isActive = user?.address?.formatted === addr.formatted;
                        return (
                          <button
                            key={addr.id}
                            onClick={() => handleSelectAddress(addr)}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${isActive ? 'bg-primary/5' : ''}`}
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-primary text-secondary' : 'bg-gray-100 text-text-secondary'}`}>
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-text-primary truncate">{addr.label}</p>
                              <p className="text-xs text-text-secondary truncate">{addr.formatted}</p>
                            </div>
                            {isActive && (
                              <svg className="w-4 h-4 text-primary flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* + Add new address */}
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      router.push('/onboarding');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors border-t border-gray-100"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <span className="text-sm font-semibold text-primary">Add new address</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

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
