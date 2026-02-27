'use client';

import { formatPrice } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface PriceDisplayProps {
  price: number;
  originalPrice?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function PriceDisplay({
  price,
  originalPrice,
  size = 'md',
  className,
}: PriceDisplayProps) {
  const sizes = {
    sm: 'text-sm',
    md: 'text-[15px]',
    lg: 'text-lg',
  };

  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span className={cn('font-bold text-text-primary', sizes[size])}>
        {formatPrice(price)}
      </span>
      {originalPrice && originalPrice > price && (
        <span
          className={cn(
            'line-through text-text-secondary',
            size === 'sm' ? 'text-xs' : 'text-sm'
          )}
        >
          {formatPrice(originalPrice)}
        </span>
      )}
    </span>
  );
}
