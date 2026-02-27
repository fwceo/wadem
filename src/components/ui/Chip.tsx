'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ChipProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function Chip({ label, selected = false, onClick, className }: ChipProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      className={cn(
        'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
        selected
          ? 'bg-primary text-white'
          : 'bg-white text-text-primary border border-gray-200 hover:bg-gray-50',
        className
      )}
      onClick={onClick}
    >
      {label}
    </motion.button>
  );
}

interface ChipGroupProps {
  children: React.ReactNode;
  className?: string;
}

export function ChipGroup({ children, className }: ChipGroupProps) {
  return (
    <div
      className={cn(
        'flex gap-2 overflow-x-auto px-4 py-2 no-scrollbar',
        className
      )}
    >
      {children}
    </div>
  );
}
