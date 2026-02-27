'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore, Toast as ToastType } from '@/stores/ui';

function ToastItem({ toast }: { toast: ToastType }) {
  const removeToast = useUIStore((s) => s.removeToast);
  const openCart = useUIStore((s) => s.openCart);

  const isCartToast = toast.type === 'success' && toast.message.includes('added to cart');

  if (isCartToast) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 60, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 60, scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="bg-secondary text-white rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center gap-3 px-4 py-3">
          <motion.div
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.1 }}
            className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">{toast.message.replace(' added to cart', '')}</p>
            <p className="text-xs text-white/70">Added to your cart</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={(e) => { e.stopPropagation(); removeToast(toast.id); openCart(); }}
            className="bg-white text-secondary text-xs font-bold px-3 py-1.5 rounded-full flex-shrink-0"
          >
            View Cart
          </motion.button>
        </div>
        <motion.div
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: 3, ease: 'linear' }}
          className="h-0.5 bg-white/30 origin-left"
        />
      </motion.div>
    );
  }

  const styles = {
    success: { bg: 'bg-green-600', icon: '✓' },
    error: { bg: 'bg-red-500', icon: '✕' },
    info: { bg: 'bg-primary', icon: 'ℹ' },
  };

  const s = styles[toast.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 60, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 60, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl text-white text-sm font-medium shadow-2xl ${s.bg}`}
      onClick={() => removeToast(toast.id)}
    >
      <span className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold">{s.icon}</span>
      <span className="flex-1">{toast.message}</span>
    </motion.div>
  );
}

export default function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts);

  return (
    <div className="fixed bottom-20 left-3 right-3 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
