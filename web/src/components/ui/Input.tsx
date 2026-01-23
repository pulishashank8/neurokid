"use client";

import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = "", ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-semibold text-[var(--text)] mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`
              bg-[var(--surface)]
              border-2 border-[var(--border)]
              text-[var(--text)]
              placeholder:text-[var(--muted)]
              rounded-[var(--radius-md)]
              px-4 py-3
              ${icon ? "pl-10" : ""}
              w-full
              min-h-[48px]
              text-base
              transition-all duration-[var(--transition-fast)]
              hover:border-[var(--primary)]
              focus:border-[var(--primary)]
              focus:outline-none
              focus:shadow-[0_0_0_3px_var(--focus-ring)]
              ${error ? "border-[var(--error)]" : ""}
              ${className}
            `}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1 text-sm text-[var(--error)]">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
