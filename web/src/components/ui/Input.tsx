"use client";

import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-semibold text-[var(--text)] mb-2">
            {label}
          </label>
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
        {error && (
          <p className="mt-1 text-sm text-[var(--error)]">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
