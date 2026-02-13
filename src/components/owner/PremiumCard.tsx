/**
 * Premium Card Component
 *
 * Reusable glassmorphism card with 3D effects and smooth animations
 * Use this across all Owner Dashboard pages for consistent premium look
 */

'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PremiumCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'gradient' | 'glass' | 'luxury';
  hover3d?: boolean;
  glow?: boolean;
  glowColor?: string;
  noPadding?: boolean;
}

export function PremiumCard({
  children,
  className,
  variant = 'default',
  hover3d = true,
  glow = false,
  glowColor = 'emerald',
  noPadding = false,
}: PremiumCardProps) {
  const variants = {
    // Classic glassmorphism with backdrop blur
    default: cn(
      'bg-white/80 dark:bg-gray-800/80',
      'backdrop-blur-xl',
      'border border-gray-200/50 dark:border-gray-700/50',
      'shadow-lg shadow-black/5 dark:shadow-black/20'
    ),

    // Premium gradient background
    gradient: cn(
      'bg-gradient-to-br from-white/90 via-blue-50/50 to-purple-50/50',
      'dark:from-gray-800/90 dark:via-blue-900/20 dark:to-purple-900/20',
      'backdrop-blur-xl',
      'border border-blue-200/50 dark:border-blue-700/30',
      'shadow-xl shadow-blue-500/10 dark:shadow-blue-500/20'
    ),

    // Ultra-premium glass with inner glow
    glass: cn(
      'bg-white/60 dark:bg-gray-900/60',
      'backdrop-blur-2xl backdrop-saturate-150',
      'border border-white/20 dark:border-white/10',
      'shadow-2xl shadow-black/10 dark:shadow-black/30',
      'ring-1 ring-white/20 dark:ring-white/10'
    ),

    // Luxury with subtle shimmer effect
    luxury: cn(
      'bg-gradient-to-br from-white/95 to-gray-50/95',
      'dark:from-gray-800/95 dark:to-gray-900/95',
      'backdrop-blur-xl',
      'border border-gray-300/50 dark:border-gray-600/50',
      'shadow-2xl shadow-gray-500/10 dark:shadow-black/40',
      'relative overflow-hidden',
      'before:absolute before:inset-0',
      'before:bg-gradient-to-br before:from-blue-500/5 before:via-transparent before:to-purple-500/5',
      'before:opacity-0 hover:before:opacity-100',
      'before:transition-opacity before:duration-700'
    ),
  };

  const glowColors = {
    emerald: 'shadow-emerald-500/20 hover:shadow-emerald-500/40',
    blue: 'shadow-blue-500/20 hover:shadow-blue-500/40',
    purple: 'shadow-purple-500/20 hover:shadow-purple-500/40',
    pink: 'shadow-pink-500/20 hover:shadow-pink-500/40',
    amber: 'shadow-amber-500/20 hover:shadow-amber-500/40',
    teal: 'shadow-teal-500/20 hover:shadow-teal-500/40',
  };

  return (
    <div
      className={cn(
        variants[variant],
        'rounded-2xl',
        'transition-all duration-300 ease-out',
        hover3d && 'hover:scale-[1.02] hover:-translate-y-1',
        glow && glowColors[glowColor as keyof typeof glowColors],
        !noPadding && 'p-6',
        className
      )}
      style={{
        transformStyle: 'preserve-3d',
      }}
    >
      {children}
    </div>
  );
}

/**
 * Premium Card with animated gradient border
 */
export function PremiumGradientCard({
  children,
  className,
  borderGradient = 'from-blue-500 via-purple-500 to-pink-500',
}: {
  children: ReactNode;
  className?: string;
  borderGradient?: string;
}) {
  return (
    <div
      className={cn(
        'relative rounded-2xl p-[1px]',
        'bg-gradient-to-r',
        borderGradient,
        'transition-all duration-300',
        'hover:shadow-xl hover:shadow-purple-500/20',
        className
      )}
    >
      <div className="relative rounded-2xl bg-white dark:bg-gray-900 p-6 h-full backdrop-blur-xl">
        {children}
      </div>
    </div>
  );
}

/**
 * Premium Stat Card with icon and trend
 */
export function PremiumStatCard({
  title,
  value,
  change,
  trend = 'up',
  icon: IconOrNode,
  gradient = 'from-blue-500 to-indigo-600',
  className,
}: {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: any;
  gradient?: string;
  className?: string;
}) {
  const trendColors = {
    up: 'text-emerald-600 dark:text-emerald-400',
    down: 'text-red-600 dark:text-red-400',
    neutral: 'text-gray-600 dark:text-gray-400',
  };

  // Support both component references (from client components) and JSX elements (from server components)
  const isComponent = typeof IconOrNode === 'function' || (typeof IconOrNode === 'object' && IconOrNode?.render);

  return (
    <PremiumCard variant="glass" hover3d glow glowColor="blue" className={className}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {value}
          </p>
          {change && (
            <p className={cn('text-sm font-semibold', trendColors[trend])}>
              {trend === 'up' && '↑ '}
              {trend === 'down' && '↓ '}
              {change}
            </p>
          )}
        </div>
        {IconOrNode && (
          <div
            className={cn(
              'p-3 rounded-xl',
              'bg-gradient-to-br',
              gradient,
              'shadow-lg shadow-blue-500/30',
              'transform hover:scale-110 transition-transform duration-300'
            )}
          >
            {isComponent ? <IconOrNode className="w-6 h-6 text-white" /> : <span className="w-6 h-6 text-white">{IconOrNode}</span>}
          </div>
        )}
      </div>
    </PremiumCard>
  );
}
