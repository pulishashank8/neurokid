"use client";

import { useEffect, useState } from "react";

// Left Side Visual - Parents Playing with Child (3D Animated Style)
export function ParentChildVisual({ className = "" }: { className?: string }) {
  const [bounce, setBounce] = useState(false);

  useEffect(() => {
    const bounceInterval = setInterval(() => {
      setBounce(true);
      setTimeout(() => setBounce(false), 600);
    }, 3000);
    return () => clearInterval(bounceInterval);
  }, []);

  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox="0 0 320 280"
        className="w-full h-full"
        style={{ filter: "drop-shadow(0 10px 30px rgba(16, 185, 129, 0.2))" }}
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="parentHair1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4a3728" />
            <stop offset="100%" stopColor="#2d2015" />
          </linearGradient>
          <linearGradient id="parentHair2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1a1a2e" />
            <stop offset="100%" stopColor="#0f0f1a" />
          </linearGradient>
          <linearGradient id="parentSkin" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f5d5c8" />
            <stop offset="100%" stopColor="#e8c4b0" />
          </linearGradient>
          <linearGradient id="childSkin" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffe8dd" />
            <stop offset="100%" stopColor="#ffd4c4" />
          </linearGradient>
          <linearGradient id="shirt1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#4f46e5" />
          </linearGradient>
          <linearGradient id="shirt2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#db2777" />
          </linearGradient>
          <linearGradient id="childShirt" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="ballGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
          <radialGradient id="glowLeft" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </radialGradient>
          <filter id="softShadow1" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.15"/>
          </filter>
        </defs>

        {/* Background glow */}
        <ellipse cx="160" cy="150" rx="150" ry="130" fill="url(#glowLeft)" />

        {/* Parent 1 (Dad) - Left side */}
        <g className="animate-gentle-sway" style={{ transformOrigin: "100px 180px" }}>
          {/* Body */}
          <path
            d="M 70 170 Q 100 165 130 170 L 140 260 Q 100 275 60 260 Z"
            fill="url(#shirt1)"
            filter="url(#softShadow1)"
          />

          {/* Neck */}
          <ellipse cx="100" cy="160" rx="18" ry="12" fill="url(#parentSkin)" />

          {/* Head */}
          <ellipse cx="100" cy="120" rx="38" ry="42" fill="url(#parentSkin)" filter="url(#softShadow1)" />

          {/* Hair */}
          <path
            d="M 65 100 Q 75 60 100 55 Q 125 60 135 100 Q 140 80 130 75 Q 100 50 70 75 Q 60 80 65 100 Z"
            fill="url(#parentHair1)"
          />

          {/* Eyes */}
          <ellipse cx="85" cy="118" rx="5" ry="6" fill="white" />
          <ellipse cx="115" cy="118" rx="5" ry="6" fill="white" />
          <circle cx="86" cy="119" r="3" fill="#3d2518" />
          <circle cx="116" cy="119" r="3" fill="#3d2518" />
          <circle cx="85" cy="117" r="1.5" fill="white" opacity="0.9" />
          <circle cx="115" cy="117" r="1.5" fill="white" opacity="0.9" />

          {/* Smile */}
          <path d="M 88 135 Q 100 145 112 135" stroke="#c97c6b" strokeWidth="2.5" fill="none" strokeLinecap="round" />

          {/* Arm reaching to child */}
          <path
            d="M 130 180 Q 155 170 175 160"
            stroke="url(#shirt1)"
            strokeWidth="20"
            strokeLinecap="round"
            fill="none"
          />
          <ellipse cx="178" cy="158" rx="12" ry="10" fill="url(#parentSkin)" />
        </g>

        {/* Parent 2 (Mom) - Right side */}
        <g className="animate-gentle-sway-reverse" style={{ transformOrigin: "220px 180px" }}>
          {/* Body */}
          <path
            d="M 190 175 Q 220 170 250 175 L 260 260 Q 220 275 180 260 Z"
            fill="url(#shirt2)"
            filter="url(#softShadow1)"
          />

          {/* Neck */}
          <ellipse cx="220" cy="163" rx="16" ry="10" fill="url(#parentSkin)" />

          {/* Head */}
          <ellipse cx="220" cy="125" rx="35" ry="40" fill="url(#parentSkin)" filter="url(#softShadow1)" />

          {/* Hair - Long */}
          <path
            d="M 188 105 Q 190 70 220 62 Q 250 70 252 105 L 255 160 Q 255 175 245 180 L 245 140 Q 252 100 220 95 Q 188 100 195 140 L 195 180 Q 185 175 185 160 Z"
            fill="url(#parentHair2)"
          />

          {/* Bangs */}
          <path
            d="M 192 95 Q 205 80 220 82 Q 235 80 248 95 Q 235 90 220 92 Q 205 90 192 95 Z"
            fill="url(#parentHair2)"
          />

          {/* Eyes */}
          <ellipse cx="207" cy="122" rx="5" ry="6" fill="white" />
          <ellipse cx="233" cy="122" rx="5" ry="6" fill="white" />
          <circle cx="208" cy="123" r="3" fill="#3d2518" />
          <circle cx="234" cy="123" r="3" fill="#3d2518" />
          <circle cx="206" cy="121" r="1.5" fill="white" opacity="0.9" />
          <circle cx="232" cy="121" r="1.5" fill="white" opacity="0.9" />

          {/* Eyelashes */}
          <path d="M 200 116 Q 203 113 207 116" stroke="#1a1a2e" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M 233 116 Q 237 113 240 116" stroke="#1a1a2e" strokeWidth="1.5" fill="none" strokeLinecap="round" />

          {/* Smile */}
          <path d="M 210 140 Q 220 150 230 140" stroke="#c97c6b" strokeWidth="2.5" fill="none" strokeLinecap="round" />

          {/* Cheeks */}
          <ellipse cx="198" cy="132" rx="6" ry="4" fill="#ffb7c5" opacity="0.5" />
          <ellipse cx="242" cy="132" rx="6" ry="4" fill="#ffb7c5" opacity="0.5" />

          {/* Arm reaching to child */}
          <path
            d="M 190 185 Q 165 175 145 165"
            stroke="url(#shirt2)"
            strokeWidth="18"
            strokeLinecap="round"
            fill="none"
          />
          <ellipse cx="142" cy="163" rx="11" ry="9" fill="url(#parentSkin)" />
        </g>

        {/* Child in middle - bouncing */}
        <g
          className={bounce ? "animate-child-bounce" : ""}
          style={{ transformOrigin: "160px 200px" }}
        >
          {/* Body */}
          <path
            d="M 140 175 Q 160 170 180 175 L 185 230 Q 160 240 135 230 Z"
            fill="url(#childShirt)"
            filter="url(#softShadow1)"
          />

          {/* Neck */}
          <ellipse cx="160" cy="168" rx="12" ry="8" fill="url(#childSkin)" />

          {/* Head */}
          <ellipse cx="160" cy="140" rx="28" ry="32" fill="url(#childSkin)" filter="url(#softShadow1)" />

          {/* Hair */}
          <path
            d="M 135 125 Q 140 100 160 95 Q 180 100 185 125 Q 190 110 175 105 Q 160 95 145 105 Q 130 110 135 125 Z"
            fill="#4a3020"
          />
          <ellipse cx="145" cy="118" rx="8" ry="12" fill="#4a3020" />
          <ellipse cx="175" cy="118" rx="8" ry="12" fill="#4a3020" />

          {/* Big happy eyes */}
          <ellipse cx="150" cy="138" rx="7" ry="8" fill="white" />
          <ellipse cx="170" cy="138" rx="7" ry="8" fill="white" />
          <ellipse cx="151" cy="140" rx="4" ry="5" fill="#3d2518" />
          <ellipse cx="171" cy="140" rx="4" ry="5" fill="#3d2518" />
          <circle cx="149" cy="136" r="2.5" fill="white" opacity="0.9" />
          <circle cx="169" cy="136" r="2.5" fill="white" opacity="0.9" />

          {/* Happy cheeks */}
          <ellipse cx="142" cy="148" rx="6" ry="4" fill="#ffb7c5" opacity="0.6" />
          <ellipse cx="178" cy="148" rx="6" ry="4" fill="#ffb7c5" opacity="0.6" />

          {/* Big smile */}
          <path d="M 148 155 Q 160 168 172 155" stroke="#e8867c" strokeWidth="2.5" fill="#ffd4c4" strokeLinecap="round" />

          {/* Arms up */}
          <ellipse cx="130" cy="185" rx="10" ry="18" fill="url(#childShirt)" />
          <ellipse cx="190" cy="185" rx="10" ry="18" fill="url(#childShirt)" />
          <ellipse cx="125" cy="170" rx="9" ry="8" fill="url(#childSkin)" />
          <ellipse cx="195" cy="170" rx="9" ry="8" fill="url(#childSkin)" />
        </g>

        {/* Colorful ball bouncing */}
        <g className="animate-ball-bounce" style={{ transformOrigin: "160px 85px" }}>
          <circle cx="160" cy="85" r="18" fill="url(#ballGrad)" filter="url(#softShadow1)" />
          <ellipse cx="155" cy="80" rx="6" ry="4" fill="white" opacity="0.4" />
          {/* Ball stripes */}
          <path d="M 145 78 Q 160 75 175 78" stroke="#f59e0b" strokeWidth="3" fill="none" opacity="0.5" />
          <path d="M 143 88 Q 160 92 177 88" stroke="#d97706" strokeWidth="3" fill="none" opacity="0.5" />
        </g>

        {/* Floating hearts */}
        <g className="animate-float-hearts">
          <path d="M 80 70 C 80 65 85 62 88 66 C 91 62 96 65 96 70 C 96 76 88 82 88 82 C 88 82 80 76 80 70" fill="#ff6b9d" opacity="0.7" />
          <path d="M 235 55 C 235 50 240 47 243 51 C 246 47 251 50 251 55 C 251 61 243 67 243 67 C 243 67 235 61 235 55" fill="#ff6b9d" opacity="0.7" />
        </g>

        {/* Sparkles */}
        <g>
          <circle cx="60" cy="100" r="3" fill="#fbbf24">
            <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="270" cy="90" r="4" fill="#10b981">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="120" cy="50" r="3" fill="#ec4899">
            <animate attributeName="opacity" values="1;0.3;1" dur="2.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="200" cy="45" r="3" fill="#6366f1">
            <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
          </circle>
        </g>
      </svg>
    </div>
  );
}

// Right Side Visual - Kid Playing with Toys (3D Animated Style)
export function KidMascot({ className = "" }: { className?: string }) {
  const [blink, setBlink] = useState(false);

  // Blinking animation
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      if (Math.random() > 0.6) {
        setBlink(true);
        setTimeout(() => setBlink(false), 150);
      }
    }, 2500);
    return () => clearInterval(blinkInterval);
  }, []);

  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox="0 0 340 450"
        className="w-full h-full mascot-premium-glow"
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="hairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4a3728" />
            <stop offset="100%" stopColor="#2d2015" />
          </linearGradient>
          <linearGradient id="skinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffe4d4" />
            <stop offset="100%" stopColor="#ffd4c0" />
          </linearGradient>
          <linearGradient id="sweaterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="hatGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#dc2626" />
          </linearGradient>
          <linearGradient id="eyeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#5c3d2e" />
            <stop offset="100%" stopColor="#3d2518" />
          </linearGradient>
          <linearGradient id="toyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
          <linearGradient id="blockGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f472b6" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
          <linearGradient id="blockGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
          <linearGradient id="blockGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
          <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </radialGradient>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.15"/>
          </filter>
        </defs>

        {/* Background glow */}
        <ellipse cx="170" cy="230" rx="160" ry="200" fill="url(#bgGlow)" />

        {/* Main floating group */}
        <g className="animate-float-gentle">
          {/* Body/Sweater */}
          <path
            d="M 110 250 Q 170 265 230 250 L 245 380 Q 170 400 95 380 Z"
            fill="url(#sweaterGrad)"
            filter="url(#shadow)"
          />

          {/* Neck */}
          <ellipse cx="170" cy="240" rx="28" ry="16" fill="url(#skinGrad)" />

          {/* Head - Friendly open face */}
          <ellipse cx="170" cy="175" rx="58" ry="62" fill="url(#skinGrad)" filter="url(#shadow)" />

          {/* Hair back */}
          <ellipse cx="170" cy="140" rx="62" ry="52" fill="url(#hairGrad)" />

          {/* Hair sides - cute style */}
          <path d="M 112 135 Q 100 165 105 200 Q 118 208 125 195 Q 122 165 118 140 Z" fill="url(#hairGrad)" />
          <path d="M 228 135 Q 240 165 235 200 Q 222 208 215 195 Q 218 165 222 140 Z" fill="url(#hairGrad)" />

          {/* Bangs - fluffy cute */}
          <path
            d="M 115 130 Q 135 105 170 108 Q 205 105 225 130 Q 205 138 170 142 Q 135 138 115 130 Z"
            fill="url(#hairGrad)"
          />

          {/* Santa Hat */}
          <g filter="url(#shadow)">
            {/* Hat fur band */}
            <ellipse cx="170" cy="115" rx="65" ry="15" fill="white" />
            {/* Hat body */}
            <path
              d="M 112 115 Q 130 68 170 55 Q 220 50 250 90 Q 255 112 222 115 Z"
              fill="url(#hatGrad)"
            />
            {/* Pompom */}
            <circle cx="252" cy="92" r="15" fill="white" />
          </g>

          {/* Cheeks */}
          <ellipse cx="128" cy="195" rx="13" ry="8" fill="#ffb7c5" opacity="0.5" />
          <ellipse cx="212" cy="195" rx="13" ry="8" fill="#ffb7c5" opacity="0.5" />

          {/* Eyes - Big friendly */}
          <g>
            {/* Left eye */}
            <ellipse cx="145" cy="175" rx="14" ry={blink ? 2 : 17} fill="white" />
            {!blink && (
              <>
                <ellipse cx="147" cy="177" rx="9" ry="12" fill="url(#eyeGrad)" />
                <ellipse cx="147" cy="177" rx="5" ry="7" fill="#1a0f0a" />
                <circle cx="143" cy="172" r="4" fill="white" opacity="0.9" />
                <circle cx="150" cy="180" r="2" fill="white" opacity="0.6" />
              </>
            )}
            {/* Right eye */}
            <ellipse cx="195" cy="175" rx="14" ry={blink ? 2 : 17} fill="white" />
            {!blink && (
              <>
                <ellipse cx="197" cy="177" rx="9" ry="12" fill="url(#eyeGrad)" />
                <ellipse cx="197" cy="177" rx="5" ry="7" fill="#1a0f0a" />
                <circle cx="193" cy="172" r="4" fill="white" opacity="0.9" />
                <circle cx="200" cy="180" r="2" fill="white" opacity="0.6" />
              </>
            )}
            {/* Eyebrows - happy */}
            <path d="M 128 158 Q 145 150 162 155" stroke="#4a3728" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M 178 155 Q 195 150 212 158" stroke="#4a3728" strokeWidth="3" fill="none" strokeLinecap="round" />
          </g>

          {/* Nose */}
          <ellipse cx="170" cy="192" rx="5" ry="4" fill="#e8c4b0" opacity="0.6" />

          {/* Big happy smile */}
          <path d="M 148 210 Q 170 230 192 210" stroke="#e8867c" strokeWidth="3.5" fill="#ffd4c4" strokeLinecap="round" />

          {/* Left Arm - holding up */}
          <ellipse cx="88" cy="300" rx="18" ry="35" fill="url(#sweaterGrad)" filter="url(#shadow)" />
          <ellipse cx="75" cy="270" rx="14" ry="12" fill="url(#skinGrad)" />

          {/* Right Arm - waving/playing */}
          <ellipse cx="252" cy="300" rx="18" ry="35" fill="url(#sweaterGrad)" filter="url(#shadow)" />

          {/* Right hand playing with block */}
          <g className="animate-wave" style={{ transformOrigin: "260px 275px" }}>
            <ellipse cx="265" cy="265" rx="14" ry="12" fill="url(#skinGrad)" />
            {/* Block in hand */}
            <rect x="275" y="245" width="28" height="28" rx="5" fill="url(#blockGrad1)" filter="url(#shadow)" />
            <text x="284" y="265" fontSize="14" fill="white" fontWeight="bold">A</text>
          </g>

          {/* Additional hand higher up - waving */}
          <g className="animate-wave-slow" style={{ transformOrigin: "70px 180px" }}>
            <path
              d="M 95 260 Q 65 220 55 170"
              stroke="url(#sweaterGrad)"
              strokeWidth="22"
              strokeLinecap="round"
              fill="none"
              filter="url(#shadow)"
            />
            <ellipse cx="52" cy="165" rx="15" ry="13" fill="url(#skinGrad)" />
            {/* Fingers waving */}
            <ellipse cx="42" cy="155" rx="5" ry="8" fill="url(#skinGrad)" />
            <ellipse cx="50" cy="150" rx="5" ry="9" fill="url(#skinGrad)" />
            <ellipse cx="58" cy="152" rx="5" ry="8" fill="url(#skinGrad)" />
            <ellipse cx="65" cy="157" rx="4" ry="7" fill="url(#skinGrad)" />
          </g>

          {/* Puzzle piece on sweater */}
          <g transform="translate(150, 300)">
            <path
              d="M 0 0 L 0 12 Q -6 12 -6 18 Q -6 24 0 24 L 0 36 L 40 36 L 40 24 Q 46 24 46 18 Q 46 12 40 12 L 40 0 Z"
              fill="#fbbf24"
              stroke="white"
              strokeWidth="1.5"
              opacity="0.85"
            />
          </g>
        </g>

        {/* Floating toy blocks around */}
        <g className="animate-float-blocks">
          {/* Block 1 - top left */}
          <g transform="translate(25, 80)">
            <rect width="32" height="32" rx="6" fill="url(#blockGrad2)" filter="url(#shadow)" />
            <text x="10" y="23" fontSize="16" fill="white" fontWeight="bold">B</text>
          </g>

          {/* Block 2 - top right */}
          <g transform="translate(280, 55)" className="animate-rotate-slow">
            <rect width="30" height="30" rx="5" fill="url(#blockGrad3)" filter="url(#shadow)" />
            <text x="8" y="22" fontSize="14" fill="white" fontWeight="bold">C</text>
          </g>
        </g>

        {/* Sparkles */}
        <g>
          <circle cx="45" cy="130" r="5" fill="#fbbf24">
            <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
            <animate attributeName="r" values="5;7;5" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="295" cy="100" r="6" fill="#fbbf24">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite" />
            <animate attributeName="r" values="6;8;6" dur="1.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="320" cy="180" r="4" fill="#10b981">
            <animate attributeName="opacity" values="1;0.3;1" dur="2.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="15" cy="220" r="5" fill="#ec4899">
            <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="30" cy="50" r="4" fill="#6366f1">
            <animate attributeName="opacity" values="1;0.5;1" dur="1.8s" repeatCount="indefinite" />
          </circle>
        </g>

        {/* Magic particles */}
        <g>
          <circle cx="70" cy="145" r="3" fill="#fde047">
            <animate attributeName="cy" values="145;125;145" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="1;0;1" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="55" cy="140" r="2" fill="#fbbf24">
            <animate attributeName="cy" values="140;120;140" dur="1.5s" repeatCount="indefinite" begin="0.3s" />
            <animate attributeName="opacity" values="1;0;1" dur="1.5s" repeatCount="indefinite" begin="0.3s" />
          </circle>
          <circle cx="42" cy="150" r="2.5" fill="#f59e0b">
            <animate attributeName="cy" values="150;130;150" dur="1.8s" repeatCount="indefinite" begin="0.6s" />
            <animate attributeName="opacity" values="1;0;1" dur="1.8s" repeatCount="indefinite" begin="0.6s" />
          </circle>
        </g>

        {/* Floating stars */}
        <g className="animate-twinkle">
          <path d="M 310 140 L 313 148 L 322 148 L 315 154 L 318 162 L 310 157 L 302 162 L 305 154 L 298 148 L 307 148 Z" fill="#fbbf24">
            <animate attributeName="fill" values="#fbbf24;#fde047;#fbbf24" dur="1.5s" repeatCount="indefinite" />
          </path>
        </g>
      </svg>
    </div>
  );
}

// Desktop Mascot - Fixed position on the right side
export function DesktopMascot() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div
      className="fixed right-4 xl:right-8 2xl:right-16 top-1/2 -translate-y-1/2 z-30 pointer-events-none mascot-enter-right"
      style={{
        width: 'clamp(180px, 18vw, 320px)',
      }}
    >
      <KidMascot className="w-full h-auto" />
    </div>
  );
}

// Desktop Left Visual - Fixed position on the left side (positioned higher)
export function DesktopLeftVisual() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div
      className="fixed left-4 xl:left-8 2xl:left-16 top-[15%] z-30 pointer-events-none mascot-enter-left"
      style={{
        width: 'clamp(160px, 15vw, 280px)',
      }}
    >
      <ParentChildVisual className="w-full h-auto" />
    </div>
  );
}

// Mobile/Tablet Mascot - Inline display
export function MobileMascot({ className = "" }: { className?: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className={`mascot-enter-right ${className}`}>
      <KidMascot className="w-full h-auto" />
    </div>
  );
}

// Combined Dashboard Mascots
export function DashboardMascots() {
  return (
    <div className="hidden lg:block">
      <DesktopLeftVisual />
      <DesktopMascot />
    </div>
  );
}

export default DashboardMascots;
