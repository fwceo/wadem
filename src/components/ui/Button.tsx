'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-secondary text-white hover:bg-secondary/90 active:bg-secondary/80',
    secondary:
      'bg-white text-secondary border border-border hover:bg-gray-50 active:bg-gray-100',
    ghost: 'bg-transparent text-secondary hover:bg-gray-100 active:bg-gray-200',
    icon: 'bg-transparent text-text-secondary hover:bg-gray-100 rounded-full p-2',
  };

  const sizes = {
    sm: 'text-sm px-3 py-1.5 rounded-lg',
    md: 'text-[15px] px-5 py-2.5 rounded-xl',
    lg: 'text-lg px-6 py-3.5 rounded-xl',
  };

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      className={cn(
        baseStyles,
        variants[variant],
        variant !== 'icon' && sizes[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || loading}
      {...(props as React.ComponentProps<typeof motion.button>)}
    >
      {loading ? (
        <svg
          className="animate-spin h-5 w-5 mr-2"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      ) : null}
      {children}
    </motion.button>
  );
}
