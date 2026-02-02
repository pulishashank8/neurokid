"use client";

import { ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  position?: "left" | "right" | "bottom";
}

export function Drawer({ 
  isOpen, 
  onClose, 
  children, 
  title,
  position = "left" 
}: DrawerProps) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const positionStyles = {
    left: "left-0 top-0 h-full w-80 max-w-[85vw]",
    right: "right-0 top-0 h-full w-80 max-w-[85vw]",
    bottom: "bottom-0 left-0 right-0 h-auto max-h-[85vh] rounded-t-[var(--radius-xl)]",
  };

  const slideAnimation = {
    left: isOpen ? "translate-x-0" : "-translate-x-full",
    right: isOpen ? "translate-x-0" : "translate-x-full",
    bottom: isOpen ? "translate-y-0" : "translate-y-full",
  };

  const content = (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-40 z-40 transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Drawer */}
      <div
        className={`
          fixed z-50
          bg-[var(--surface)]
          shadow-[var(--shadow-xl)]
          transition-transform duration-300 ease-in-out
          ${positionStyles[position]}
          ${slideAnimation[position]}
        `}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "drawer-title" : undefined}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
            <h2 
              id="drawer-title" 
              className="text-xl font-bold text-[var(--text)] m-0"
            >
              {title}
            </h2>
            <button
              onClick={onClose}
              className="
                p-2 
                rounded-[var(--radius-md)] 
                hover:bg-[var(--surface2)]
                transition-colors
                min-h-[44px]
                min-w-[44px]
                flex items-center justify-center
              "
              aria-label="Close drawer"
            >
              <svg 
                className="w-6 h-6 text-[var(--text)]" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M6 18L18 6M6 6l12 12" 
                />
              </svg>
            </button>
          </div>
        )}
        
        {/* Content */}
        <div className={`overflow-y-auto ${position === "bottom" ? "max-h-[calc(85vh-72px)]" : "h-full"} p-4`}>
          {children}
        </div>
      </div>
    </>
  );

  return createPortal(content, document.body);
}
