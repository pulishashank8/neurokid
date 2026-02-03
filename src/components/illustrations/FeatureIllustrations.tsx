"use client";

import React from "react";

// Community illustration - Parents connecting
export function CommunityIllustration({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Background circle */}
      <circle cx="100" cy="100" r="90" fill="#FEF3C7" />
      
      {/* Three people in a circle */}
      {/* Person 1 */}
      <g transform="translate(100, 50)">
        <circle cx="0" cy="0" r="25" fill="#FDBA74" />
        <circle cx="0" cy="-5" r="22" fill="#F97316" />
        <circle cx="-7" cy="-2" r="3" fill="#2D2A26" />
        <circle cx="7" cy="-2" r="3" fill="#2D2A26" />
        <path d="M-8 8Q0 15 8 8" stroke="#2D2A26" strokeWidth="2" strokeLinecap="round" />
      </g>
      
      {/* Person 2 */}
      <g transform="translate(60, 110)">
        <circle cx="0" cy="0" r="25" fill="#FDBA74" />
        <circle cx="0" cy="-5" r="22" fill="#14B8A6" />
        <circle cx="-7" cy="-2" r="3" fill="#2D2A26" />
        <circle cx="7" cy="-2" r="3" fill="#2D2A26" />
        <path d="M-8 8Q0 15 8 8" stroke="#2D2A26" strokeWidth="2" strokeLinecap="round" />
      </g>
      
      {/* Person 3 */}
      <g transform="translate(140, 110)">
        <circle cx="0" cy="0" r="25" fill="#FDBA74" />
        <circle cx="0" cy="-5" r="22" fill="#A78BFA" />
        <circle cx="-7" cy="-2" r="3" fill="#2D2A26" />
        <circle cx="7" cy="-2" r="3" fill="#2D2A26" />
        <path d="M-8 8Q0 15 8 8" stroke="#2D2A26" strokeWidth="2" strokeLinecap="round" />
      </g>
      
      {/* Connection lines */}
      <path d="M100 75L60 110" stroke="#FBBF24" strokeWidth="3" strokeLinecap="round" strokeDasharray="5,5" />
      <path d="M100 75L140 110" stroke="#FBBF24" strokeWidth="3" strokeLinecap="round" strokeDasharray="5,5" />
      <path d="M60 110L140 110" stroke="#FBBF24" strokeWidth="3" strokeLinecap="round" strokeDasharray="5,5" />
      
      {/* Hearts */}
      <path d="M100 140C100 135 95 132 92 135C89 132 84 135 84 140C84 145 92 152 92 152C92 152 100 145 100 140Z" fill="#F87171" />
    </svg>
  );
}

// Providers illustration - Medical/therapy
export function ProvidersIllustration({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Background */}
      <circle cx="100" cy="100" r="90" fill="#E0F2FE" />
      
      {/* Doctor */}
      <g transform="translate(100, 85)">
        {/* Body */}
        <ellipse cx="0" cy="35" rx="35" ry="40" fill="#FFFFFF" />
        <path d="M-25 15L-20 75L20 75L25 15Z" fill="#FFFFFF" />
        
        {/* Head */}
        <circle cx="0" cy="0" r="28" fill="#FDBA74" />
        
        {/* Hair */}
        <path d="M-28 -5C-28 -20 -15 -30 0 -30C15 -30 28 -20 28 -5C28 -15 20 -20 0 -20C-20 -20 -28 -15 -28 -5Z" fill="#4A423A" />
        
        {/* Eyes */}
        <circle cx="-8" cy="-2" r="3" fill="#2D2A26" />
        <circle cx="8" cy="-2" r="3" fill="#2D2A26" />
        
        {/* Smile */}
        <path d="M-10 10Q0 18 10 10" stroke="#2D2A26" strokeWidth="2" strokeLinecap="round" />
        
        {/* Stethoscope */}
        <path d="M-15 25C-15 35 15 35 15 25" stroke="#14B8A6" strokeWidth="3" fill="none" />
        <circle cx="0" cy="35" r="5" fill="#14B8A6" />
      </g>
      
      {/* Medical cross */}
      <g transform="translate(145, 55)">
        <circle cx="0" cy="0" r="18" fill="#F87171" />
        <rect x="-4" y="-10" width="8" height="20" rx="2" fill="white" />
        <rect x="-10" y="-4" width="20" height="8" rx="2" fill="white" />
      </g>
      
      {/* Plus signs */}
      <g fill="#34D399">
        <rect x="40" y="60" width="12" height="4" rx="2" />
        <rect x="44" y="56" width="4" height="12" rx="2" />
      </g>
      <g fill="#FBBF24">
        <rect x="155" y="130" width="10" height="3" rx="1.5" />
        <rect x="158" y="127" width="3" height="10" rx="1.5" />
      </g>
    </svg>
  );
}

// AI Support illustration
export function AISupportIllustration({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Background */}
      <circle cx="100" cy="100" r="90" fill="#F3E8FF" />
      
      {/* Robot head */}
      <g transform="translate(100, 90)">
        {/* Head shape */}
        <rect x="-35" y="-40" width="70" height="60" rx="15" fill="#A78BFA" />
        <rect x="-30" y="-35" width="60" height="50" rx="10" fill="#C4B5FD" />
        
        {/* Eyes */}
        <circle cx="-15" cy="-10" r="8" fill="#FFFFFF" />
        <circle cx="-15" cy="-10" r="4" fill="#2D2A26" />
        <circle cx="15" cy="-10" r="8" fill="#FFFFFF" />
        <circle cx="15" cy="-10" r="4" fill="#2D2A26" />
        
        {/* Smile */}
        <path d="M-12 8Q0 16 12 8" stroke="#2D2A26" strokeWidth="2.5" strokeLinecap="round" />
        
        {/* Antenna */}
        <line x1="0" y1="-40" x2="0" y2="-55" stroke="#A78BFA" strokeWidth="4" strokeLinecap="round" />
        <circle cx="0" cy="-58" r="6" fill="#FBBF24" className="animate-pulse-soft" />
        
        {/* Heart on chest */}
        <path d="M0 35C0 30 -5 27 -8 30C-11 27 -16 30 -16 35C-16 40 -8 48 -8 48C-8 48 0 40 0 35Z" fill="#F87171" transform="translate(8, -5)" />
      </g>
      
      {/* Sparkles */}
      <g fill="#FBBF24">
        <path d="M45 70L47 76L53 78L47 80L45 86L43 80L37 78L43 76L45 70Z" />
        <path d="M155 60L156 64L160 65L156 66L155 70L154 66L150 65L154 64L155 60Z" />
      </g>
    </svg>
  );
}

// Screening illustration
export function ScreeningIllustration({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Background */}
      <circle cx="100" cy="100" r="90" fill="#F0FDFA" />
      
      {/* Clipboard */}
      <g transform="translate(100, 100)">
        <rect x="-40" y="-50" width="80" height="100" rx="8" fill="#FFFFFF" stroke="#14B8A6" strokeWidth="3" />
        <rect x="-30" y="-40" width="60" height="6" rx="3" fill="#E5E7EB" />
        <rect x="-30" y="-28" width="40" height="4" rx="2" fill="#E5E7EB" />
        <rect x="-30" y="-20" width="50" height="4" rx="2" fill="#E5E7EB" />
        
        <rect x="-30" y="-5" width="60" height="6" rx="3" fill="#E5E7EB" />
        <rect x="-30" y="7" width="35" height="4" rx="2" fill="#E5E7EB" />
        <rect x="-30" y="15" width="45" height="4" rx="2" fill="#E5E7EB" />
        
        <rect x="-30" y="30" width="60" height="6" rx="3" fill="#E5E7EB" />
        <rect x="-30" y="42" width="50" height="4" rx="2" fill="#E5E7EB" />
        
        {/* Checkmarks */}
        <circle cx="22" cy="-37" r="8" fill="#34D399" />
        <path d="M18 -37L21 -34L27 -40" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        
        <circle cx="22" cy="-2" r="8" fill="#34D399" />
        <path d="M18 -2L21 1L27 -5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        
        <circle cx="22" cy="33" r="8" fill="#34D399" />
        <path d="M18 33L21 36L27 30" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        
        {/* Clip */}
        <rect x="-15" y="-62" width="30" height="15" rx="4" fill="#F97316" />
      </g>
      
      {/* Stars */}
      <path d="M45 60L48 70L58 73L48 76L45 86L42 76L32 73L42 70L45 60Z" fill="#FBBF24" />
      <path d="M155 130L157 137L164 139L157 141L155 148L153 141L146 139L153 137L155 130Z" fill="#FBBF24" />
    </svg>
  );
}

// AAC Voice illustration
export function AACVoiceIllustration({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Background */}
      <circle cx="100" cy="100" r="90" fill="#FFF7ED" />
      
      {/* Speech bubble */}
      <g transform="translate(100, 95)">
        <path 
          d="M-50 -40C-50 -52 -40 -60 -25 -60H25C40 -60 50 -52 50 -40V20C50 32 40 40 25 40H10L0 55L-10 40H-25C-40 40 -50 32 -50 20V-40Z" 
          fill="#FFFFFF" 
          stroke="#F97316" 
          strokeWidth="3"
        />
        
        {/* Sound waves */}
        <path d="M-20 -10C-20 -10 -10 -20 0 -10C10 0 20 -10 20 -10" stroke="#F97316" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M-15 0C-15 0 -5 10 5 0C15 -10 25 0 25 0" stroke="#FBBF24" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M-20 10C-20 10 -10 20 0 10C10 0 20 10 20 10" stroke="#14B8A6" strokeWidth="3" strokeLinecap="round" fill="none" />
      </g>
      
      {/* Decorative elements */}
      <g fill="#FBBF24">
        <circle cx="45" cy="70" r="6" />
        <circle cx="155" cy="130" r="5" />
      </g>
      <g fill="#34D399">
        <circle cx="160" cy="60" r="4" />
        <circle cx="40" cy="140" r="5" />
      </g>
    </svg>
  );
}

// Games illustration
export function GamesIllustration({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Background */}
      <circle cx="100" cy="100" r="90" fill="#FCE7F3" />
      
      {/* Game controller */}
      <g transform="translate(100, 100)">
        {/* Controller body */}
        <rect x="-50" y="-25" width="100" height="50" rx="20" fill="#F472B6" />
        <rect x="-45" y="-20" width="90" height="40" rx="15" fill="#F9A8D4" />
        
        {/* D-pad */}
        <g transform="translate(-25, 0)">
          <rect x="-12" y="-4" width="24" height="8" rx="2" fill="#FFFFFF" />
          <rect x="-4" y="-12" width="8" height="24" rx="2" fill="#FFFFFF" />
        </g>
        
        {/* Action buttons */}
        <circle cx="25" cy="-5" r="5" fill="#FBBF24" />
        <circle cx="35" cy="5" r="5" fill="#34D399" />
        <circle cx="15" cy="5" r="5" fill="#60A5FA" />
        <circle cx="25" cy="15" r="5" fill="#F87171" />
        
        {/* Start/Select */}
        <rect x="-5" y="12" width="8" height="3" rx="1.5" fill="#FFFFFF" opacity="0.6" />
        <rect x="8" y="12" width="8" height="3" rx="1.5" fill="#FFFFFF" opacity="0.6" />
      </g>
      
      {/* Stars */}
      <path d="M45 55L48 65L58 68L48 71L45 81L42 71L32 68L42 65L45 55Z" fill="#FBBF24" />
      <path d="M155 145L157 152L164 154L157 156L155 163L153 156L146 154L153 152L155 145Z" fill="#FBBF24" />
      
      {/* Sparkles */}
      <g fill="#34D399">
        <circle cx="35" cy="120" r="4" />
        <circle cx="165" cy="70" r="4" />
      </g>
    </svg>
  );
}

// Daily Wins illustration
export function DailyWinsIllustration({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Background */}
      <circle cx="100" cy="100" r="90" fill="#FEF3C7" />
      
      {/* Trophy */}
      <g transform="translate(100, 95)">
        {/* Cup */}
        <path 
          d="M-30 -35C-30 -45 -20 -50 0 -50C20 -50 30 -45 30 -35V-10C30 10 15 25 0 25C-15 25 -30 10 -30 -10V-35Z" 
          fill="#FBBF24" 
          stroke="#D97706" 
          strokeWidth="2"
        />
        <path 
          d="M-25 -35C-25 -42 -17 -46 0 -46C17 -46 25 -42 25 -35V-10C25 8 12 21 0 21C-12 21 -25 8 -25 -10V-35Z" 
          fill="#FCD34D" 
        />
        
        {/* Handles */}
        <path d="M-30 -25C-45 -25 -45 -5 -32 -5" stroke="#FBBF24" strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d="M30 -25C45 -25 45 -5 32 -5" stroke="#FBBF24" strokeWidth="5" strokeLinecap="round" fill="none" />
        
        {/* Base */}
        <rect x="-15" y="25" width="30" height="8" rx="2" fill="#D97706" />
        <rect x="-20" y="33" width="40" height="6" rx="2" fill="#FBBF24" />
        
        {/* Star on trophy */}
        <path d="M0 -25L3 -15L13 -15L5 -9L8 1L0 -5L-8 1L-5 -9L-13 -15L-3 -15L0 -25Z" fill="#FFFFFF" />
      </g>
      
      {/* Confetti */}
      <g>
        <rect x="40" y="50" width="8" height="4" rx="2" fill="#F472B6" transform="rotate(30 44 52)" />
        <rect x="150" y="60" width="8" height="4" rx="2" fill="#60A5FA" transform="rotate(-20 154 62)" />
        <rect x="45" y="140" width="8" height="4" rx="2" fill="#34D399" transform="rotate(45 49 142)" />
        <rect x="155" y="130" width="8" height="4" rx="2" fill="#FBBF24" transform="rotate(-30 159 132)" />
        
        <circle cx="35" cy="80" r="4" fill="#F472B6" />
        <circle cx="165" cy="90" r="4" fill="#34D399" />
        <circle cx="40" cy="160" r="4" fill="#60A5FA" />
        <circle cx="160" cy="150" r="4" fill="#FBBF24" />
      </g>
    </svg>
  );
}


