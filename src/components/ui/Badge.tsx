'use client';

import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'count' | 'status' | 'promo';
  color?: 'primary' | 'success' | 'warning' | 'error';
  className?: string;
}

export default function Badge({
  children,
  variant = 'status',
  color = 'primary',
  className,
}: BadgeProps) {
  const colors = {
    primary: 'bg-primary text-white',
    success: 'bg-success text-white',
    warning: 'bg-warning text-white',
    error: 'bg-error text-white',
  };

  if (variant === 'count') {
    return (
      <span
        className={cn(
          'inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold',
          colors[color],
          className
        )}
      >
        {children}
      </span>
    );
  }

  if (variant === 'promo') {
    return (
      <span
        className={cn(
          'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide',
          'bg-error text-white',
          className
        )}
      >
        {children}
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-[13px] font-medium',
        colors[color],
        className
      )}
    >
      {children}
    </span>
  );
}
