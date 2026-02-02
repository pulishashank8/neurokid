import React from "react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-12 sm:py-16 px-4 text-center ${className}`}
    >
      {icon && (
        <div className="mb-4 text-4xl sm:text-5xl text-[var(--text-muted)]">
          {icon}
        </div>
      )}

      <h3 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] mb-2">
        {title}
      </h3>

      {description && (
        <p className="text-[var(--text-secondary)] text-sm sm:text-base mb-6 max-w-md">
          {description}
        </p>
      )}

      {action && (
        <a
          href={action.href}
          onClick={action.onClick}
          className="min-h-[48px] px-6 rounded-[var(--radius-md)] bg-[var(--primary)] text-white hover:opacity-90 font-medium transition-all inline-flex items-center justify-center"
        >
          {action.label}
        </a>
      )}
    </div>
  );
}
