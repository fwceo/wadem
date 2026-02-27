'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserStore } from '@/stores/user';

export default function FreeDeliveryBanner() {
  const user = useUserStore((s) => s.user);
  const [mounted, setMounted] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  const remaining = user?.freeDeliveries ?? 0;
  const used = 4 - remaining;
  if (remaining <= 0) return null;

  return (
    <div className="md:hidden fixed bottom-16 left-0 right-0 z-30">
      <AnimatePresence mode="wait">
        {/* Collapsed: small pill */}
        {collapsed && !expanded && (
          <motion.button
            key="pill"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={() => { setCollapsed(false); }}
            className="mx-auto block mb-1 bg-primary px-4 py-2 rounded-full shadow-lg"
          >
            <span className="text-secondary text-xs font-bold">🛵 {remaining} free deliveries left</span>
          </motion.button>
        )}

        {/* Expanded: full banner */}
        {!collapsed && !expanded && (
          <motion.div
            key="banner"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
          >
            <div
              className="mx-2 bg-primary rounded-2xl px-4 py-3 shadow-lg cursor-pointer"
              onClick={() => setExpanded(true)}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl flex-shrink-0">🛵</span>
                <div className="flex-1">
                  <p className="text-secondary text-sm font-bold">
                    <span className="bg-secondary text-primary px-1.5 py-0.5 rounded-md text-xs mr-1.5">{remaining} FREE</span>
                    deliveries left!
                  </p>
                  <p className="text-secondary/60 text-[11px] mt-0.5">Tap to see details</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setCollapsed(true); }}
                  className="flex-shrink-0 text-secondary/60 hover:text-secondary p-1"
                  aria-label="Collapse"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded detail view */}
      <AnimatePresence>
        {expanded && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-[55]"
              onClick={() => setExpanded(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-[55] bg-white rounded-t-3xl max-w-lg mx-auto"
            >
              <div className="px-6 pt-6 pb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-extrabold text-secondary">
                    <span className="bg-primary text-secondary px-2 py-0.5 rounded-lg mr-1">FREE</span>
                    Deliveries
                  </h3>
                  <button onClick={() => setExpanded(false)} className="p-1">
                    <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <p className="text-text-secondary text-sm mb-5">
                  You have <span className="font-bold text-secondary">{remaining}</span> free {remaining === 1 ? 'delivery' : 'deliveries'} remaining.
                  Just add items to your cart and the delivery fee will be waived automatically at checkout!
                </p>

                {/* 4 delivery cards showing used/remaining */}
                <div className="grid grid-cols-4 gap-2 mb-6">
                  {[0, 1, 2, 3].map((i) => {
                    const isUsed = i < used;
                    const labels = ['1st', '2nd', '3rd', '4th'];
                    return (
                      <div
                        key={i}
                        className={`rounded-xl p-3 text-center border-2 transition-all ${
                          isUsed
                            ? 'bg-gray-100 border-gray-200 opacity-60'
                            : 'bg-primary/10 border-primary'
                        }`}
                      >
                        <div className={`text-2xl mb-1 ${isUsed ? 'grayscale' : ''}`}>
                          {isUsed ? '✓' : '🛵'}
                        </div>
                        <p className={`text-[10px] font-bold ${isUsed ? 'text-text-tertiary line-through' : 'text-secondary'}`}>
                          Free
                        </p>
                        <p className={`text-[10px] font-bold ${isUsed ? 'text-text-tertiary line-through' : 'text-secondary'}`}>
                          delivery
                        </p>
                        <p className={`text-[9px] mt-1 font-medium ${isUsed ? 'text-accent' : 'text-text-secondary'}`}>
                          {isUsed ? 'Used' : `${labels[i]} order`}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-primary/10 rounded-xl px-4 py-3 text-center">
                  <p className="text-sm text-secondary font-medium">
                    🎉 Delivery fee is <span className="font-bold">automatically waived</span> at checkout
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
