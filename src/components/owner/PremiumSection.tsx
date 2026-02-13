/**
 * Premium Section Components
 *
 * Beautiful section headers and containers with smooth animations
 */

'use client';

import { ReactNode } from 'react';

// Re-export card components for convenience (many pages import from PremiumSection)
export { PremiumCard, PremiumStatCard, PremiumGradientCard } from './PremiumCard';
import { cn } from '@/lib/utils';

interface PremiumSectionProps {
  title: string;
  subtitle?: string;
  icon?: any;
  action?: ReactNode;
  children: ReactNode;
  gradient?: string;
  className?: string;
}

export function PremiumSection({
  title,
  subtitle,
  icon: IconOrNode,
  action,
  children,
  gradient = 'from-blue-600 to-indigo-600',
  className,
}: PremiumSectionProps) {
  // Support both component references (from client components) and JSX elements (from server components)
  const isComponent = typeof IconOrNode === 'function' || (typeof IconOrNode === 'object' && IconOrNode?.render);
  const IconComponent = isComponent ? IconOrNode : null;

  return (
    <section className={cn('space-y-4', className)}>
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {IconOrNode && (
            <div
              className={cn(
                'p-2.5 rounded-xl',
                'bg-gradient-to-br',
                gradient,
                'shadow-lg shadow-blue-500/30',
                'transform hover:scale-110 transition-transform duration-300'
              )}
            >
              {IconComponent ? <IconComponent className="w-5 h-5 text-white" /> : <span className="w-5 h-5 text-white">{IconOrNode}</span>}
            </div>
          )}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {title}
            </h2>
            {subtitle && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {action && <div>{action}</div>}
      </div>

      {/* Section Content */}
      <div className="animate-fadeIn">{children}</div>
    </section>
  );
}

/**
 * Premium Page Header with breadcrumbs and actions
 */
export function PremiumPageHeader({
  title,
  subtitle,
  breadcrumbs,
  actions,
  gradient = 'from-blue-600 via-purple-600 to-pink-600',
}: {
  title: string;
  subtitle?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  actions?: ReactNode;
  gradient?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/80 to-gray-50/80 dark:from-gray-800/80 dark:to-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 shadow-2xl mb-8">
      {/* Animated Background Gradient */}
      <div
        className={cn(
          'absolute inset-0 opacity-10',
          'bg-gradient-to-br',
          gradient,
          'animate-gradient-shift'
        )}
      />

      <div className="relative p-8">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-2 text-sm mb-4">
            {breadcrumbs.map((crumb, index) => (
              <div key={index} className="flex items-center gap-2">
                {index > 0 && <span className="text-gray-400">/</span>}
                {crumb.href ? (
                  <a
                    href={crumb.href}
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {crumb.label}
                  </a>
                ) : (
                  <span className="text-gray-600 dark:text-gray-400">{crumb.label}</span>
                )}
              </div>
            ))}
          </nav>
        )}

        {/* Header Content */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              {title}
            </h1>
            {subtitle && (
              <p className="text-lg text-gray-600 dark:text-gray-400">
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div className="flex items-center gap-3">{actions}</div>}
        </div>
      </div>
    </div>
  );
}

/**
 * Premium Grid Layout for cards
 */
export function PremiumGrid({
  children,
  cols = 3,
  className,
}: {
  children: ReactNode;
  cols?: 1 | 2 | 3 | 4;
  className?: string;
}) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 lg:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={cn('grid gap-6', gridCols[cols], className)}>
      {children}
    </div>
  );
}
