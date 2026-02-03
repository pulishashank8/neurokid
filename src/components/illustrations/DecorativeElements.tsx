"use client";

import React from "react";

// Floating blobs background
export function FloatingBlobs({ className = "" }: { className?: string }) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Coral blob */}
      <div 
        className="absolute -top-20 -left-20 w-96 h-96 rounded-full animate-float"
        style={{
          background: "radial-gradient(circle, rgba(248, 113, 113, 0.15) 0%, transparent 70%)",
          filter: "blur(40px)"
        }}
      />
      
      {/* Sky blob */}
      <div 
        className="absolute top-1/3 -right-32 w-80 h-80 rounded-full animate-float-delayed"
        style={{
          background: "radial-gradient(circle, rgba(56, 189, 248, 0.12) 0%, transparent 70%)",
          filter: "blur(40px)",
          animationDelay: "2s"
        }}
      />
      
      {/* Sunny blob */}
      <div 
        className="absolute bottom-20 left-1/4 w-72 h-72 rounded-full animate-float"
        style={{
          background: "radial-gradient(circle, rgba(251, 191, 36, 0.12) 0%, transparent 70%)",
          filter: "blur(40px)",
          animationDelay: "1s"
        }}
      />
      
      {/* Mint blob */}
      <div 
        className="absolute -bottom-32 right-1/4 w-96 h-96 rounded-full animate-float-delayed"
        style={{
          background: "radial-gradient(circle, rgba(52, 211, 153, 0.1) 0%, transparent 70%)",
          filter: "blur(40px)",
          animationDelay: "3s"
        }}
      />
      
      {/* Lavender blob */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full animate-float"
        style={{
          background: "radial-gradient(circle, rgba(167, 139, 250, 0.08) 0%, transparent 70%)",
          filter: "blur(60px)",
          animationDelay: "1.5s"
        }}
      />
    </div>
  );
}

// Dotted pattern background
export function DottedPattern({ className = "" }: { className?: string }) {
  return (
    <div 
      className={`absolute inset-0 opacity-[0.03] pointer-events-none ${className}`}
      style={{
        backgroundImage: `radial-gradient(circle, currentColor 1.5px, transparent 1.5px)`,
        backgroundSize: "32px 32px"
      }}
    />
  );
}

// Decorative stars scattered
export function DecorativeStars({ className = "" }: { className?: string }) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Star 1 */}
      <svg 
        className="absolute top-[10%] left-[15%] w-6 h-6 animate-pulse-soft text-amber-400"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 2L14.09 8.26L20.18 9.27L15.54 13.14L16.82 19.14L12 16.18L7.18 19.14L8.46 13.14L3.82 9.27L9.91 8.26L12 2Z" />
      </svg>
      
      {/* Star 2 */}
      <svg 
        className="absolute top-[20%] right-[20%] w-4 h-4 animate-pulse-soft text-coral"
        style={{ animationDelay: "0.5s" }}
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 2L14.09 8.26L20.18 9.27L15.54 13.14L16.82 19.14L12 16.18L7.18 19.14L8.46 13.14L3.82 9.27L9.91 8.26L12 2Z" />
      </svg>
      
      {/* Star 3 */}
      <svg 
        className="absolute bottom-[30%] left-[10%] w-5 h-5 animate-pulse-soft text-mint"
        style={{ animationDelay: "1s" }}
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 2L14.09 8.26L20.18 9.27L15.54 13.14L16.82 19.14L12 16.18L7.18 19.14L8.46 13.14L3.82 9.27L9.91 8.26L12 2Z" />
      </svg>
      
      {/* Star 4 */}
      <svg 
        className="absolute bottom-[15%] right-[15%] w-6 h-6 animate-pulse-soft text-sky"
        style={{ animationDelay: "1.5s" }}
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 2L14.09 8.26L20.18 9.27L15.54 13.14L16.82 19.14L12 16.18L7.18 19.14L8.46 13.14L3.82 9.27L9.91 8.26L12 2Z" />
      </svg>
      
      {/* Star 5 */}
      <svg 
        className="absolute top-[40%] right-[8%] w-3 h-3 animate-pulse-soft text-lavender"
        style={{ animationDelay: "0.8s" }}
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 2L14.09 8.26L20.18 9.27L15.54 13.14L16.82 19.14L12 16.18L7.18 19.14L8.46 13.14L3.82 9.27L9.91 8.26L12 2Z" />
      </svg>
      
      {/* Sparkle 1 */}
      <svg 
        className="absolute top-[60%] left-[20%] w-4 h-4 animate-pulse-soft text-amber-400"
        style={{ animationDelay: "0.3s" }}
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" />
      </svg>
      
      {/* Sparkle 2 */}
      <svg 
        className="absolute top-[25%] left-[40%] w-3 h-3 animate-pulse-soft text-coral"
        style={{ animationDelay: "1.2s" }}
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" />
      </svg>
    </div>
  );
}

// Hand-drawn style circle decoration
export function HandDrawnCircle({ 
  className = "", 
  color = "#F97316",
  size = 200 
}: { 
  className?: string;
  color?: string;
  size?: number;
}) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 200 200" 
      className={`${className}`}
    >
      <path
        d="M100 10C150 10 190 50 190 100C190 150 150 190 100 190C50 190 10 150 10 100C10 50 50 10 100 10Z"
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="8 4"
        opacity="0.4"
      />
    </svg>
  );
}

// Wavy line decoration
export function WavyLine({ 
  className = "", 
  color = "#F97316" 
}: { 
  className?: string;
  color?: string;
}) {
  return (
    <svg 
      viewBox="0 0 200 20" 
      className={`w-full h-5 ${className}`}
      preserveAspectRatio="none"
    >
      <path
        d="M0 10C20 0 40 20 60 10C80 0 100 20 120 10C140 0 160 20 180 10C190 5 195 10 200 10"
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Decorative divider with shapes
export function JoyfulDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-4 py-8 ${className}`}>
      <div className="h-1 w-16 rounded-full bg-gradient-to-r from-transparent to-orange-400" />
      <div className="flex gap-2">
        <div className="w-3 h-3 rounded-full bg-coral" />
        <div className="w-3 h-3 rounded-full bg-sunny" />
        <div className="w-3 h-3 rounded-full bg-mint" />
      </div>
      <div className="h-1 w-16 rounded-full bg-gradient-to-l from-transparent to-orange-400" />
    </div>
  );
}

// Curved arrow decoration
export function CurvedArrow({ 
  className = "", 
  direction = "right",
  color = "#F97316" 
}: { 
  className?: string;
  direction?: "right" | "left" | "up" | "down";
  color?: string;
}) {
  const rotations = {
    right: 0,
    down: 90,
    left: 180,
    up: 270
  };
  
  return (
    <svg 
      width="60" 
      height="40" 
      viewBox="0 0 60 40" 
      className={`${className}`}
      style={{ transform: `rotate(${rotations[direction]}deg)` }}
    >
      <path
        d="M5 30C5 15 20 5 40 10"
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M35 5L45 10L38 18"
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Scribble underline decoration
export function ScribbleUnderline({ 
  className = "",
  color = "#FBBF24"
}: { 
  className?: string;
  color?: string;
}) {
  return (
    <svg 
      viewBox="0 0 200 12" 
      className={`w-full h-3 ${className}`}
      preserveAspectRatio="none"
    >
      <path
        d="M2 6C20 2 40 10 60 6C80 2 100 10 120 6C140 2 160 10 180 6C190 4 195 6 198 6"
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Blob shape for backgrounds
export function BlobShape({ 
  className = "",
  color = "#FEF3C7",
  variant = 1
}: { 
  className?: string;
  color?: string;
  variant?: 1 | 2 | 3 | 4;
}) {
  const paths = {
    1: "M47.5,-57.2C59.9,-46.7,67.3,-30.1,69.4,-13.1C71.5,3.9,68.3,21.3,59.1,34.6C49.9,47.9,34.7,57.1,18.3,62.3C1.9,67.5,-15.7,68.7,-31.2,62.8C-46.7,56.9,-60.1,43.9,-66.8,28.1C-73.5,12.3,-73.5,-6.3,-66.7,-21.8C-59.9,-37.3,-46.3,-49.7,-32.1,-59.6C-17.9,-69.5,-3.1,-76.9,9.6,-75.8C22.3,-74.7,35.1,-67.7,47.5,-57.2Z",
    2: "M44.7,-76.4C58.9,-69.2,71.8,-59.1,79.6,-46.3C87.4,-33.5,90.1,-18,89.1,-2.9C88.1,12.2,83.4,27,75.2,39.6C67,52.2,55.3,62.6,42.2,69.6C29.1,76.6,14.6,80.2,-0.7,81.4C-16,82.6,-32,81.4,-45.6,74.8C-59.2,68.2,-70.4,56.2,-77.6,42.3C-84.8,28.4,-88,12.6,-86.9,-2.8C-85.8,-18.2,-80.4,-33.2,-71.2,-45.3C-62,-57.4,-49,-66.6,-35.5,-74.3C-22,-82,-11,-88.2,2.3,-92.2C15.6,-96.2,30.5,-83.6,44.7,-76.4Z",
    3: "M41.2,-70.6C53.9,-62.9,65,-52.7,72.6,-40.6C80.2,-28.5,84.3,-14.3,83.7,-0.3C83.1,13.6,77.8,27.2,69.6,39.1C61.4,51,50.3,61.2,37.6,68.3C24.9,75.4,10.6,79.4,-3.2,84.8C-17,90.2,-30.3,97,-42.3,91.8C-54.3,86.6,-65,69.4,-72.3,52.3C-79.6,35.2,-83.5,18.2,-82.8,1.7C-82.1,-14.8,-76.8,-30.8,-67.4,-43.8C-58,-56.8,-44.5,-66.8,-30.7,-73.8C-16.9,-80.8,-2.8,-84.8,8.6,-83.6C20,-82.4,28.5,-78.3,41.2,-70.6Z",
    4: "M38.1,-63.6C49.3,-56.3,58.6,-46.1,65.8,-34.4C73,-22.7,78.1,-9.5,77.3,3.2C76.5,15.9,69.8,28.1,61.1,38.6C52.4,49.1,41.7,57.9,29.6,63.8C17.5,69.7,4,72.7,-9.1,72.1C-22.2,71.5,-34.9,67.3,-46.2,60.1C-57.5,52.9,-67.4,42.7,-73.1,30.5C-78.8,18.3,-80.3,4.1,-77.6,-9.1C-74.9,-22.3,-68,-34.5,-58.4,-43.2C-48.8,-51.9,-36.5,-57.1,-24.3,-63.8C-12.1,-70.5,0.9,-78.7,13.8,-78.2C26.7,-77.7,26.9,-70.9,38.1,-63.6Z"
  };
  
  return (
    <svg 
      viewBox="0 0 200 200" 
      className={`${className}`}
    >
      <path fill={color} d={paths[variant]} transform="translate(100 100)" />
    </svg>
  );
}
