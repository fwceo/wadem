'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserStore } from '@/stores/user';

export default function FreeDeliveryBanner() {
  const user = useUserStore((s) => s.user);
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  const remaining = user?.freeDeliveries ?? 0;
  if (remaining <= 0 || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        className="md:hidden fixed bottom-16 left-0 right-0 z-30"
      >
        <div className="mx-2 bg-primary rounded-2xl px-4 py-2.5 flex items-center gap-3 shadow-lg">
          <span className="text-xl flex-shrink-0">🛵</span>
          <p className="flex-1 text-secondary text-sm font-bold">
            <span className="bg-secondary text-primary px-1.5 py-0.5 rounded-md text-xs mr-1.5">{remaining} FREE</span>
            deliveries. Limited time!
          </p>
          <button
            onClick={() => setDismissed(true)}
            className="flex-shrink-0 text-secondary/60 hover:text-secondary"
            aria-label="Dismiss"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
