/**
 * Premium Button Components
 *
 * Luxury button styles with smooth animations and 3D effects
 */

'use client';

import { ReactNode, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface PremiumButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost' | 'luxury';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: any;
  iconPosition?: 'left' | 'right';
  glow?: boolean;
}

export function PremiumButton({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon: Icon,
  iconPosition = 'left',
  glow = false,
  className,
  disabled,
  ...props
}: PremiumButtonProps) {
  const variants = {
    primary: cn(
      'bg-gradient-to-r from-blue-600 to-indigo-600',
      'text-white font-semibold',
      'shadow-lg shadow-blue-500/30',
      'hover:shadow-xl hover:shadow-blue-500/40',
      'hover:from-blue-700 hover:to-indigo-700',
      'active:scale-[0.98]'
    ),
    secondary: cn(
      'bg-gradient-to-r from-gray-600 to-gray-700',
      'text-white font-semibold',
      'shadow-lg shadow-gray-500/20',
      'hover:shadow-xl hover:shadow-gray-500/30',
      'hover:from-gray-700 hover:to-gray-800',
      'active:scale-[0.98]'
    ),
    success: cn(
      'bg-gradient-to-r from-emerald-600 to-teal-600',
      'text-white font-semibold',
      'shadow-lg shadow-emerald-500/30',
      'hover:shadow-xl hover:shadow-emerald-500/40',
      'hover:from-emerald-700 hover:to-teal-700',
      'active:scale-[0.98]'
    ),
    danger: cn(
      'bg-gradient-to-r from-red-600 to-rose-600',
      'text-white font-semibold',
      'shadow-lg shadow-red-500/30',
      'hover:shadow-xl hover:shadow-red-500/40',
      'hover:from-red-700 hover:to-rose-700',
      'active:scale-[0.98]'
    ),
    ghost: cn(
      'bg-transparent',
      'text-gray-700 dark:text-gray-300',
      'border border-gray-300 dark:border-gray-600',
      'hover:bg-gray-100 dark:hover:bg-gray-800',
      'active:scale-[0.98]'
    ),
    luxury: cn(
      'bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600',
      'text-white font-bold',
      'shadow-2xl shadow-purple-500/40',
      'hover:shadow-2xl hover:shadow-pink-500/50',
      'hover:scale-[1.02]',
      'active:scale-[0.98]',
      'relative overflow-hidden',
      'before:absolute before:inset-0',
      'before:bg-gradient-to-r before:from-white/0 before:via-white/20 before:to-white/0',
      'before:translate-x-[-200%] hover:before:translate-x-[200%]',
      'before:transition-transform before:duration-700'
    ),
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm rounded-lg',
    md: 'px-4 py-2 text-base rounded-xl',
    lg: 'px-6 py-3 text-lg rounded-2xl',
  };

  return (
    <button
      className={cn(
        variants[variant],
        sizes[size],
        'transition-all duration-300 ease-out',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
        'flex items-center justify-center gap-2',
        glow && 'animate-pulse',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {!loading && Icon && iconPosition === 'left' && <Icon className="w-4 h-4" />}
      <span>{children}</span>
      {!loading && Icon && iconPosition === 'right' && <Icon className="w-4 h-4" />}
    </button>
  );
}

/**
 * Premium Icon Button with circular design
 */
export function PremiumIconButton({
  icon: Icon,
  variant = 'primary',
  size = 'md',
  ...props
}: {
  icon: any;
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  size?: 'sm' | 'md' | 'lg';
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const variants = {
    primary: 'bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/30',
    secondary: 'bg-gradient-to-br from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 shadow-gray-500/20',
    success: 'bg-gradient-to-br from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/30',
    danger: 'bg-gradient-to-br from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-red-500/30',
  };

  const sizes = {
    sm: 'p-2',
    md: 'p-3',
    lg: 'p-4',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <button
      className={cn(
        variants[variant],
        sizes[size],
        'rounded-full',
        'text-white',
        'shadow-lg hover:shadow-xl',
        'transition-all duration-300',
        'hover:scale-110 active:scale-95',
        'disabled:opacity-50 disabled:cursor-not-allowed'
      )}
      {...props}
    >
      <Icon className={iconSizes[size]} />
    </button>
  );
}
