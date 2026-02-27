'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserStore } from '@/stores/user';

export default function FreeDeliveryModal() {
  const user = useUserStore((s) => s.user);
  const setFreeDeliveryModalSeen = useUserStore((s) => s.setFreeDeliveryModalSeen);
  const [show, setShow] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted && user && !user.hasSeenFreeDeliveryModal && (user.freeDeliveries ?? 0) > 0) {
      const timer = setTimeout(() => setShow(true), 800);
      return () => clearTimeout(timer);
    }
  }, [mounted, user]);

  const handleDismiss = () => {
    setShow(false);
    setFreeDeliveryModalSeen();
  };

  if (!show) return null;

  const totalCards = 4;
  const remaining = user?.freeDeliveries ?? 0;

  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[60]"
            onClick={handleDismiss}
          />
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-[60] bg-white rounded-t-3xl max-w-lg mx-auto overflow-hidden"
          >
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-4 left-4 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center z-10"
            >
              <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="px-6 pt-12 pb-8 text-center">
              {/* Title */}
              <h2 className="text-3xl font-extrabold text-secondary mb-2">
                <span className="bg-primary text-secondary px-2 py-0.5 rounded-lg inline-block mr-1">4 FREE</span>
                deliveries
              </h2>
              <p className="text-text-secondary text-sm mb-8">
                Enjoy free delivery on your first 4 orders
              </p>

              {/* Delivery cards — fanned out */}
              <div className="relative flex justify-center items-end h-48 mb-8">
                {/* Decorative stars */}
                <motion.span
                  animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                  className="absolute left-4 top-4 text-primary text-2xl"
                >✦</motion.span>
                <motion.span
                  animate={{ rotate: [0, -15, 15, 0], scale: [1, 1.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1.5 }}
                  className="absolute right-4 top-8 text-primary text-xl"
                >✦</motion.span>
                <motion.span
                  animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                  transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 0.5 }}
                  className="absolute left-8 bottom-2 text-primary text-lg"
                >✦</motion.span>
                <motion.span
                  animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
                  className="absolute right-6 bottom-6 text-primary text-xl"
                >✦</motion.span>

                {Array.from({ length: totalCards }).map((_, i) => {
                  const rotation = -12 + i * 8;
                  const xOffset = -60 + i * 40;
                  const used = i >= remaining;

                  return (
                    <motion.div
                      key={i}
                      initial={{ y: 100, opacity: 0, rotate: 0 }}
                      animate={{ y: 0, opacity: 1, rotate: rotation }}
                      transition={{ delay: 0.3 + i * 0.1, type: 'spring', stiffness: 200, damping: 15 }}
                      className="absolute"
                      style={{ left: `calc(50% + ${xOffset}px)`, transform: `translateX(-50%) rotate(${rotation}deg)` }}
                    >
                      <div className={`w-28 h-36 rounded-2xl shadow-lg flex flex-col items-center justify-center gap-2 border-2 ${
                        used
                          ? 'bg-gray-100 border-gray-200 opacity-50'
                          : 'bg-primary border-primary-dark'
                      }`}>
                        <span className="text-lg font-extrabold text-secondary leading-none">Free</span>
                        <span className="text-sm font-bold text-secondary/80">delivery</span>
                        <div className="w-10 h-10 bg-white/30 rounded-full flex items-center justify-center mt-1">
                          <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                          </svg>
                        </div>
                        <span className="text-[11px] font-bold text-secondary/70 mt-1">
                          {i === 0 ? '1st' : i === 1 ? '2nd' : i === 2 ? '3rd' : '4th'} order
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* CTA */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleDismiss}
                className="w-full bg-secondary text-white font-bold text-base py-4 rounded-2xl hover:bg-secondary/90 transition-colors"
              >
                Start exploring
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
