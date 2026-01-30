"use client";

import { InputHTMLAttributes, forwardRef, useState } from "react";

interface MonkeyPasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
}

export const MonkeyPasswordInput = forwardRef<HTMLInputElement, MonkeyPasswordInputProps>(
  ({ label, error, className = "", ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-semibold text-[var(--text)] mb-2">
            {label}
          </label>
        )}
        <div className="relative group">
          <input
            ref={ref}
            type={showPassword ? "text" : "password"}
            className={`
              bg-[var(--surface)]
              border-2 border-[var(--border)]
              text-[var(--text)]
              placeholder:text-[var(--muted)]
              rounded-[var(--radius-md)]
              px-4 py-3
              pr-14
              w-full
              min-h-[48px]
              text-base
              transition-all duration-300
              hover:border-[var(--primary)]
              focus:border-[var(--primary)]
              focus:outline-none
              focus:shadow-[0_0_0_3px_var(--focus-ring)]
              ${error ? "border-[var(--error)]" : ""}
              ${className}
            `}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            {...props}
          />

          {/* Animated Monkey Toggle Button */}
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className={`
              absolute right-2 top-1/2 -translate-y-1/2
              w-10 h-10 rounded-full
              flex items-center justify-center
              transition-all duration-300
              hover:scale-110
              focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2
            `}
            aria-label={showPassword ? "Hide password" : "Show password"}
            title={showPassword ? "Hide password" : "Show password"}
          >
            <div className={`
              relative w-8 h-8 transition-transform duration-300
              ${showPassword ? 'scale-110' : 'scale-100'}
            `}>
              {/* Monkey Face */}
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {/* Ears */}
                <circle
                  cx="15" cy="40" r="15"
                  fill="#8B6914"
                  className="transition-all duration-300"
                />
                <circle
                  cx="15" cy="40" r="10"
                  fill="#D4A574"
                  className="transition-all duration-300"
                />
                <circle
                  cx="85" cy="40" r="15"
                  fill="#8B6914"
                  className="transition-all duration-300"
                />
                <circle
                  cx="85" cy="40" r="10"
                  fill="#D4A574"
                  className="transition-all duration-300"
                />

                {/* Face */}
                <ellipse
                  cx="50" cy="50" rx="40" ry="38"
                  fill="#8B6914"
                  className="transition-all duration-300"
                />

                {/* Inner Face */}
                <ellipse
                  cx="50" cy="55" rx="30" ry="28"
                  fill="#D4A574"
                  className="transition-all duration-300"
                />

                {/* Eyes Area Background */}
                <ellipse
                  cx="50" cy="42" rx="28" ry="12"
                  fill="#F5DEB3"
                  className="transition-all duration-300"
                />

                {/* Eyes - animate based on showPassword */}
                <g className={`transition-all duration-500 ${showPassword ? 'opacity-100' : 'opacity-0'}`}>
                  {/* Left Eye Open */}
                  <ellipse cx="38" cy="42" rx="6" ry="7" fill="white" />
                  <circle cx="38" cy="42" r="4" fill="#2D1810" />
                  <circle cx="36" cy="40" r="1.5" fill="white" />

                  {/* Right Eye Open */}
                  <ellipse cx="62" cy="42" rx="6" ry="7" fill="white" />
                  <circle cx="62" cy="42" r="4" fill="#2D1810" />
                  <circle cx="60" cy="40" r="1.5" fill="white" />
                </g>

                {/* Closed Eyes / Hands covering - show when password is hidden */}
                <g className={`transition-all duration-500 ${showPassword ? 'opacity-0' : 'opacity-100'}`}>
                  {/* Left Hand */}
                  <ellipse
                    cx="35" cy="42" rx="12" ry="10"
                    fill="#8B6914"
                  />
                  <ellipse cx="28" cy="38" rx="4" ry="5" fill="#8B6914" />
                  <ellipse cx="32" cy="35" rx="3" ry="5" fill="#8B6914" />
                  <ellipse cx="37" cy="34" rx="3" ry="5" fill="#8B6914" />
                  <ellipse cx="42" cy="35" rx="3" ry="5" fill="#8B6914" />

                  {/* Right Hand */}
                  <ellipse
                    cx="65" cy="42" rx="12" ry="10"
                    fill="#8B6914"
                  />
                  <ellipse cx="72" cy="38" rx="4" ry="5" fill="#8B6914" />
                  <ellipse cx="68" cy="35" rx="3" ry="5" fill="#8B6914" />
                  <ellipse cx="63" cy="34" rx="3" ry="5" fill="#8B6914" />
                  <ellipse cx="58" cy="35" rx="3" ry="5" fill="#8B6914" />
                </g>

                {/* Nose */}
                <ellipse
                  cx="50" cy="58" rx="10" ry="8"
                  fill="#8B6914"
                  className="transition-all duration-300"
                />

                {/* Nostrils */}
                <circle cx="46" cy="58" r="2" fill="#5D4E37" />
                <circle cx="54" cy="58" r="2" fill="#5D4E37" />

                {/* Mouth - smile when showing, neutral when hiding */}
                <path
                  d={showPassword
                    ? "M 40 70 Q 50 78 60 70"
                    : "M 40 72 Q 50 72 60 72"
                  }
                  stroke="#5D4E37"
                  strokeWidth="2.5"
                  fill="none"
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              </svg>
            </div>
          </button>
        </div>
        {error && (
          <p className="mt-1 text-sm text-[var(--error)] animate-shake">{error}</p>
        )}
      </div>
    );
  }
);

MonkeyPasswordInput.displayName = "MonkeyPasswordInput";
