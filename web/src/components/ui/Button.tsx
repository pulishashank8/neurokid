"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}

export function Button({ 
  variant = "primary", 
  size = "md", 
  children, 
  className = "",
  ...props 
}: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variantStyles = {
    primary: "bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]",
    secondary: "bg-[var(--surface)] text-[var(--text)] border-2 border-[var(--border)] hover:bg-[var(--surface2)]",
    ghost: "bg-transparent text-[var(--primary)] hover:bg-[var(--surface2)]",
  };
  
  const sizeStyles = {
    sm: "px-4 py-2.5 text-sm rounded-[var(--radius-sm)] min-h-[44px]",
    md: "px-6 py-3 text-base rounded-[var(--radius-md)] min-h-[48px]",
    lg: "px-8 py-3.5 text-lg rounded-[var(--radius-lg)] min-h-[52px]",
  };
  
  return (
    <button 
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
