"use client";

import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className = "", hover = true }: CardProps) {
  const hoverStyles = hover ? "hover:shadow-[var(--shadow-lg)] hover:-translate-y-1" : "";
  
  return (
    <div 
      className={`
        bg-[var(--surface)] 
        border border-[var(--border)] 
        rounded-[var(--radius-lg)] 
        p-6
        shadow-[var(--shadow-md)]
        transition-all duration-[var(--transition-base)]
        ${hoverStyles}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
