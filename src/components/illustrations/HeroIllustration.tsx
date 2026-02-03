"use client";

import React from "react";

interface HeroIllustrationProps {
  className?: string;
}

export function HeroIllustration({ className = "" }: HeroIllustrationProps) {
  return (
    <svg
      viewBox="0 0 600 500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background blob */}
      <ellipse cx="300" cy="280" rx="250" ry="180" fill="#FFF7ED" />
      
      {/* Decorative stars */}
      <g className="animate-pulse-soft">
        <path
          d="M80 100L85 115L100 120L85 125L80 140L75 125L60 120L75 115L80 100Z"
          fill="#FBBF24"
        />
        <path
          d="M520 80L524 92L536 96L524 100L520 112L516 100L504 96L516 92L520 80Z"
          fill="#F97316"
        />
        <path
          d="M480 150L483 159L492 162L483 165L480 174L477 165L468 162L477 159L480 150Z"
          fill="#34D399"
        />
      </g>
      
      {/* Clouds */}
      <g opacity="0.6">
        <ellipse cx="120" cy="180" rx="40" ry="25" fill="#E0F2FE" />
        <ellipse cx="150" cy="175" rx="35" ry="22" fill="#E0F2FE" />
        <ellipse cx="90" cy="175" rx="30" ry="20" fill="#E0F2FE" />
        
        <ellipse cx="480" cy="200" rx="45" ry="28" fill="#FCE7F3" />
        <ellipse cx="515" cy="195" rx="38" ry="24" fill="#FCE7F3" />
        <ellipse cx="445" cy="195" rx="32" ry="22" fill="#FCE7F3" />
      </g>
      
      {/* Parent figure */}
      <g transform="translate(180, 120)">
        {/* Body */}
        <ellipse cx="60" cy="180" rx="55" ry="70" fill="#F97316" />
        <ellipse cx="60" cy="180" rx="45" ry="60" fill="#FB923C" />
        
        {/* Head */}
        <circle cx="60" cy="80" r="45" fill="#FDBA74" />
        
        {/* Hair */}
        <path
          d="M25 65C25 45 40 25 60 25C80 25 95 45 95 65C95 55 90 35 60 35C30 35 25 55 25 65Z"
          fill="#4A423A"
        />
        
        {/* Eyes */}
        <ellipse cx="45" cy="75" rx="5" ry="7" fill="#2D2A26" />
        <ellipse cx="75" cy="75" rx="5" ry="7" fill="#2D2A26" />
        
        {/* Smile */}
        <path
          d="M45 95Q60 108 75 95"
          stroke="#2D2A26"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        
        {/* Arms holding child */}
        <path
          d="M15 140Q-5 170 20 190"
          stroke="#FDBA74"
          strokeWidth="18"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M105 140Q125 170 100 190"
          stroke="#FDBA74"
          strokeWidth="18"
          strokeLinecap="round"
          fill="none"
        />
      </g>
      
      {/* Child figure */}
      <g transform="translate(260, 180)">
        {/* Body */}
        <ellipse cx="40" cy="100" rx="35" ry="45" fill="#14B8A6" />
        <ellipse cx="40" cy="100" rx="28" ry="38" fill="#2DD4BF" />
        
        {/* Head */}
        <circle cx="40" cy="45" r="32" fill="#FDBA74" />
        
        {/* Hair */}
        <path
          d="M15 35C15 20 25 10 40 10C55 10 65 20 65 35C65 28 60 18 40 18C20 18 15 28 15 35Z"
          fill="#8B4513"
        />
        
        {/* Eyes - happy closed */}
        <path
          d="M28 42Q32 38 36 42"
          stroke="#2D2A26"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M44 42Q48 38 52 42"
          stroke="#2D2A26"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        
        {/* Big smile */}
        <path
          d="M30 55Q40 65 50 55"
          stroke="#2D2A26"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        
        {/* Rosy cheeks */}
        <ellipse cx="25" cy="50" rx="6" ry="4" fill="#FCA5A5" opacity="0.6" />
        <ellipse cx="55" cy="50" rx="6" ry="4" fill="#FCA5A5" opacity="0.6" />
      </g>
      
      {/* Decorative elements */}
      <g>
        {/* Hearts */}
        <path
          d="M140 320C140 310 130 305 125 310C120 305 110 310 110 320C110 330 125 345 125 345C125 345 140 330 140 320Z"
          fill="#F87171"
          className="animate-gentle-bounce"
        />
        <path
          d="M450 300C450 292 442 288 438 292C434 288 426 292 426 300C426 308 438 320 438 320C438 320 450 308 450 300Z"
          fill="#F472B6"
          className="animate-gentle-bounce"
          style={{ animationDelay: "0.5s" }}
        />
        
        {/* Butterflies */}
        <g transform="translate(350, 100)" className="animate-float">
          <ellipse cx="0" cy="0" rx="8" ry="12" fill="#A78BFA" transform="rotate(-20)" />
          <ellipse cx="0" cy="0" rx="8" ry="12" fill="#A78BFA" transform="rotate(20)" />
          <line x1="0" y1="-12" x2="0" y2="12" stroke="#7C3AED" strokeWidth="1.5" />
        </g>
        
        <g transform="translate(100, 250)" className="animate-float-delayed">
          <ellipse cx="0" cy="0" rx="6" ry="10" fill="#FBBF24" transform="rotate(-15)" />
          <ellipse cx="0" cy="0" rx="6" ry="10" fill="#FBBF24" transform="rotate(15)" />
          <line x1="0" y1="-10" x2="0" y2="10" stroke="#D97706" strokeWidth="1.5" />
        </g>
      </g>
      
      {/* Ground/Grass decoration */}
      <g transform="translate(0, 400)">
        <path
          d="M50 50Q60 20 70 50"
          stroke="#34D399"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M65 50Q75 15 85 50"
          stroke="#10B981"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M80 50Q90 25 100 50"
          stroke="#34D399"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
        
        <path
          d="M450 50Q460 20 470 50"
          stroke="#34D399"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M465 50Q475 15 485 50"
          stroke="#10B981"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M480 50Q490 25 500 50"
          stroke="#34D399"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
      </g>
      
      {/* Sparkles */}
      <g className="animate-pulse-soft">
        <path d="M200 350L202 356L208 358L202 360L200 366L198 360L192 358L198 356L200 350Z" fill="#FCD34D" />
        <path d="M400 120L402 126L408 128L402 130L400 136L398 130L392 128L398 126L400 120Z" fill="#60A5FA" />
        <path d="M300 380L301 384L305 385L301 386L300 390L299 386L295 385L299 384L300 380Z" fill="#F472B6" />
      </g>
    </svg>
  );
}
