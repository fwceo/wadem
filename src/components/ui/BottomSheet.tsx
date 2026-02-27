'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  height?: string;
  title?: string;
}

export default function BottomSheet({
  isOpen,
  onClose,
  children,
  height = '85vh',
  title,
}: BottomSheetProps) {
  const [isDragging, setIsDragging] = useState(false);
  const y = useMotionValue(0);
  const backdropOpacity = useTransform(y, [0, 300], [1, 0]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      y.set(0);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, y]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    setIsDragging(false);
    if (info.offset.y > 60 || info.velocity.y > 200) {
      onClose();
    }
  };

  return (
    <AnimatePresence mode="sync">
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/40 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ opacity: backdropOpacity }}
            onClick={onClose}
          />
          <div className="fixed bottom-0 left-0 right-0 md:inset-0 md:flex md:items-center md:justify-center z-50 pointer-events-none">
            <motion.div
              className="pointer-events-auto bg-surface rounded-t-2xl md:rounded-2xl md:w-full md:max-w-lg w-full flex flex-col overflow-hidden touch-none md:mx-auto"
              style={{ maxHeight: height, y }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'tween', duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.4 }}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={handleDragEnd}
              dragSnapToOrigin={!isDragging}
            >
              <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
                <div className="w-10 h-1 bg-gray-300 rounded-full" />
              </div>
              {title && (
                <div className="px-4 pb-3 border-b border-gray-100">
                  <h2 className="text-lg font-bold text-text-primary">{title}</h2>
                </div>
              )}
              <div className="flex-1 overflow-y-auto overscroll-contain">{children}</div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
