'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface QuantitySelectorProps {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  min?: number;
  max?: number;
  className?: string;
}

export default function QuantitySelector({
  quantity,
  onIncrement,
  onDecrement,
  min = 1,
  max = 99,
  className,
}: QuantitySelectorProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center bg-gray-100 rounded-full',
        className
      )}
    >
      <motion.button
        whileTap={{ scale: 0.85 }}
        className="w-9 h-9 flex items-center justify-center rounded-full text-lg font-medium text-text-primary disabled:opacity-30"
        onClick={onDecrement}
        disabled={quantity <= min}
      >
        −
      </motion.button>
      <motion.span
        key={quantity}
        initial={{ scale: 1.2 }}
        animate={{ scale: 1 }}
        className="w-8 text-center text-[15px] font-bold text-text-primary"
      >
        {quantity}
      </motion.span>
      <motion.button
        whileTap={{ scale: 0.85 }}
        className="w-9 h-9 flex items-center justify-center rounded-full text-lg font-medium text-primary disabled:opacity-30"
        onClick={onIncrement}
        disabled={quantity >= max}
      >
        +
      </motion.button>
    </div>
  );
}
