'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
}

export default function Skeleton({ className, variant = 'text' }: SkeletonProps) {
  const variants = {
    text: 'h-4 w-full rounded',
    circular: 'h-10 w-10 rounded-full',
    rectangular: 'h-[180px] w-full rounded-xl',
    card: 'h-[260px] w-full rounded-xl',
  };

  return (
    <div
      className={cn(
        'animate-pulse bg-gray-200',
        variants[variant],
        className
      )}
    />
  );
}

export function RestaurantCardSkeleton() {
  return (
    <div className="bg-surface rounded-xl overflow-hidden shadow-sm mx-4">
      <Skeleton variant="rectangular" className="h-[180px]" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex gap-3">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    </div>
  );
}

export function MenuItemSkeleton() {
  return (
    <div className="flex items-center justify-between p-4">
      <div className="flex-1 space-y-2 pr-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-20 w-20 rounded-lg flex-shrink-0" />
    </div>
  );
}
