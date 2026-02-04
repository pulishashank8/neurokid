"use client";

import { ReactNode } from "react";
import { BackButton } from "./BackButton";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  fallbackPath?: string;
  showBackButton?: boolean;
  actions?: ReactNode;
  className?: string;
}

/**
 * Consistent page header component with back button, title, and optional actions.
 * Ensures uniform layout across all pages.
 */
export function PageHeader({
  title,
  description,
  icon,
  fallbackPath = "/",
  showBackButton = true,
  actions,
  className = "",
}: PageHeaderProps) {
  return (
    <div className={`mb-6 ${className}`}>
      {/* Back button row */}
      {showBackButton && (
        <div className="mb-4">
          <BackButton fallbackPath={fallbackPath} />
        </div>
      )}

      {/* Title row with optional actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary)]/70 flex items-center justify-center text-white shadow-lg">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text)]">
              {title}
            </h1>
            {description && (
              <p className="text-sm text-[var(--muted)] mt-1">{description}</p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex items-center gap-3 flex-shrink-0">{actions}</div>
        )}
      </div>
    </div>
  );
}
