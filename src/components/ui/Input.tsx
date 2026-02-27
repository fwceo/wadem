'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export default function Input({
  label,
  error,
  icon,
  rightIcon,
  className,
  onFocus,
  onBlur,
  value,
  ...props
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const hasValue = value !== undefined && value !== '';

  return (
    <div className="relative w-full">
      {icon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary z-10">
          {icon}
        </span>
      )}
      <input
        className={cn(
          'w-full bg-white border rounded-xl px-4 py-3 text-[15px] text-text-primary placeholder-text-secondary transition-all outline-none',
          'focus:border-primary focus:ring-2 focus:ring-primary/20',
          error ? 'border-error' : 'border-gray-200',
          !!icon && 'pl-10',
          !!rightIcon && 'pr-10',
          className
        )}
        value={value}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        {...props}
      />
      {label && (
        <span
          className={cn(
            'absolute left-4 transition-all pointer-events-none',
            !!icon && 'left-10',
            focused || hasValue
              ? 'top-0 -translate-y-1/2 text-xs bg-white px-1 text-primary'
              : 'top-1/2 -translate-y-1/2 text-[15px] text-text-secondary'
          )}
        >
          {label}
        </span>
      )}
      {rightIcon && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary">
          {rightIcon}
        </span>
      )}
      {error && <p className="mt-1 text-xs text-error">{error}</p>}
    </div>
  );
}
