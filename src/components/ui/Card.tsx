'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  pressable?: boolean;
}

export default function Card({
  children,
  className,
  onClick,
  pressable = true,
}: CardProps) {
  const classes = cn(
    'bg-surface rounded-xl overflow-hidden shadow-sm',
    onClick && 'cursor-pointer',
    className
  );

  if (!pressable) {
    return (
      <div className={classes} onClick={onClick}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring' as const, stiffness: 400, damping: 17 }}
      className={classes}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}
