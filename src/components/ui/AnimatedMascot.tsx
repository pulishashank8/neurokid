"use client";

import { useEffect, useState } from "react";

export type MascotState = "idle" | "watching" | "hiding" | "happy" | "thinking";

interface AnimatedMascotProps {
  state: MascotState;
  emailLength?: number;
  className?: string;
}

export function AnimatedMascot({
  state = "idle",
  emailLength = 0,
  className = ""
}: AnimatedMascotProps) {
  const [eyePosition, setEyePosition] = useState({ x: 0, y: 0 });
  const [blink, setBlink] = useState(false);

  // Animate eyes following email input length - more responsive tracking
  useEffect(() => {
    if (state === "watching") {
      // More pronounced eye movement following the email typing
      const maxOffset = 15;
      const position = Math.min(emailLength * 1.2, maxOffset);
      setEyePosition({ x: position, y: 4 + Math.min(emailLength * 0.3, 3) });
    } else {
      setEyePosition({ x: 0, y: 0 });
    }
  }, [state, emailLength]);

  // Random blinking effect
  useEffect(() => {
    if (state === "hiding") return;

    const blinkInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        setBlink(true);
        setTimeout(() => setBlink(false), 150);
      }
    }, 2000);

    return () => clearInterval(blinkInterval);
  }, [state]);

  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full drop-shadow-lg"
        style={{ maxWidth: "180px" }}
      >
        <defs>
          {/* Gradients */}
          <radialGradient id="mascotGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="hairGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#5a3d2b" />
            <stop offset="50%" stopColor="#4a3020" />
            <stop offset="100%" stopColor="#3d261a" />
          </linearGradient>
          <linearGradient id="skinGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffe4d4" />
            <stop offset="100%" stopColor="#ffd4c0" />
          </linearGradient>
          <linearGradient id="handGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffd4c0" />
            <stop offset="100%" stopColor="#ffcbb0" />
          </linearGradient>
          <linearGradient id="dressGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
          <linearGradient id="cheekGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffb7c5" />
            <stop offset="100%" stopColor="#ffa0b4" />
          </linearGradient>
          <linearGradient id="bowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ff6b9d" />
            <stop offset="100%" stopColor="#ff4081" />
          </linearGradient>
          <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" floodOpacity="0.12"/>
          </filter>
          <filter id="handShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.2"/>
          </filter>
        </defs>

        {/* Glow background */}
        <circle cx="100" cy="100" r="90" fill="url(#mascotGlow)" />

        {/* Hair - Back part */}
        <ellipse
          cx="100"
          cy="85"
          rx="58"
          ry="55"
          fill="url(#hairGradient)"
          filter="url(#softShadow)"
        />

        {/* Hair sides (pigtails) */}
        <ellipse cx="45" cy="100" rx="15" ry="35" fill="url(#hairGradient)" />
        <ellipse cx="155" cy="100" rx="15" ry="35" fill="url(#hairGradient)" />

        {/* Face */}
        <ellipse
          cx="100"
          cy="95"
          rx="48"
          ry="45"
          fill="url(#skinGradient)"
          filter="url(#softShadow)"
        />

        {/* Bangs */}
        <path
          d="M 55 70 Q 65 55 85 60 Q 100 52 115 60 Q 135 55 145 70 Q 140 65 100 68 Q 60 65 55 70"
          fill="url(#hairGradient)"
        />

        {/* Side bangs */}
        <ellipse cx="58" cy="78" rx="12" ry="18" fill="url(#hairGradient)" />
        <ellipse cx="142" cy="78" rx="12" ry="18" fill="url(#hairGradient)" />

        {/* Cute bow on head */}
        <g className="transition-transform duration-500" style={{
          transform: state === "happy" ? "rotate(-5deg)" : "rotate(0deg)",
          transformOrigin: "75px 50px"
        }}>
          <ellipse cx="65" cy="52" rx="12" ry="8" fill="url(#bowGradient)" />
          <ellipse cx="85" cy="52" rx="12" ry="8" fill="url(#bowGradient)" />
          <circle cx="75" cy="52" r="6" fill="#ff4081" />
          <ellipse cx="75" cy="62" rx="4" ry="8" fill="url(#bowGradient)" />
        </g>

        {/* Cheeks - always visible */}
        <ellipse
          cx="62"
          cy="105"
          rx="10"
          ry="6"
          fill="url(#cheekGradient)"
          opacity={state === "happy" ? "0.9" : "0.6"}
          className="transition-opacity duration-300"
        />
        <ellipse
          cx="138"
          cy="105"
          rx="10"
          ry="6"
          fill="url(#cheekGradient)"
          opacity={state === "happy" ? "0.9" : "0.6"}
          className="transition-opacity duration-300"
        />

        {/* Eyes Section */}
        <g className="transition-all duration-500 ease-out">
          {state === "hiding" ? (
            /* Closed eyes with hands covering - much more visible */
            <>
              {/* Closed eyes (curved lines) */}
              <path
                d="M 66 90 Q 78 82 90 90"
                stroke="#3d261a"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M 110 90 Q 122 82 134 90"
                stroke="#3d261a"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
              />

              {/* Left Hand - clearly covering left eye area */}
              <g filter="url(#handShadow)">
                {/* Main hand palm */}
                <ellipse cx="78" cy="88" rx="26" ry="20" fill="url(#handGradient)" />
                {/* Fingers spread out */}
                <ellipse cx="55" cy="78" rx="8" ry="14" fill="url(#handGradient)" />
                <ellipse cx="65" cy="72" rx="7" ry="14" fill="url(#handGradient)" />
                <ellipse cx="76" cy="68" rx="7" ry="14" fill="url(#handGradient)" />
                <ellipse cx="87" cy="72" rx="7" ry="14" fill="url(#handGradient)" />
                <ellipse cx="96" cy="78" rx="6" ry="12" fill="url(#handGradient)" />
                {/* Arm hint */}
                <ellipse cx="55" cy="110" rx="12" ry="18" fill="url(#handGradient)" />
              </g>

              {/* Right Hand - clearly covering right eye area */}
              <g filter="url(#handShadow)">
                {/* Main hand palm */}
                <ellipse cx="122" cy="88" rx="26" ry="20" fill="url(#handGradient)" />
                {/* Fingers spread out */}
                <ellipse cx="145" cy="78" rx="8" ry="14" fill="url(#handGradient)" />
                <ellipse cx="135" cy="72" rx="7" ry="14" fill="url(#handGradient)" />
                <ellipse cx="124" cy="68" rx="7" ry="14" fill="url(#handGradient)" />
                <ellipse cx="113" cy="72" rx="7" ry="14" fill="url(#handGradient)" />
                <ellipse cx="104" cy="78" rx="6" ry="12" fill="url(#handGradient)" />
                {/* Arm hint */}
                <ellipse cx="145" cy="110" rx="12" ry="18" fill="url(#handGradient)" />
              </g>
            </>
          ) : (
            /* Normal Eyes - Big cute anime style with better tracking */
            <>
              {/* Left Eye */}
              <g
                className="transition-all duration-150 ease-out"
                style={{
                  transform: `translate(${eyePosition.x}px, ${eyePosition.y}px)`
                }}
              >
                {/* Eye white */}
                <ellipse
                  cx="78"
                  cy="90"
                  rx={blink ? 12 : 12}
                  ry={blink ? 2 : 14}
                  fill="white"
                  stroke="#e8e0dc"
                  strokeWidth="1"
                  className="transition-all duration-100"
                />
                {/* Iris and pupil */}
                {!blink && (
                  <>
                    <ellipse cx="80" cy="92" rx="8" ry="10" fill="#4a2c1a" />
                    <ellipse cx="80" cy="92" rx="5" ry="7" fill="#2d1810" />
                    {/* Eye shine - big cute sparkle */}
                    <circle cx="76" cy="87" r="3.5" fill="white" opacity="0.95" />
                    <circle cx="83" cy="94" r="2" fill="white" opacity="0.7" />
                  </>
                )}
                {/* Eyelashes */}
                <path
                  d="M 66 82 Q 70 78 74 82"
                  stroke="#3d261a"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d="M 82 82 Q 86 78 90 82"
                  stroke="#3d261a"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                />
              </g>

              {/* Right Eye */}
              <g
                className="transition-all duration-150 ease-out"
                style={{
                  transform: `translate(${eyePosition.x}px, ${eyePosition.y}px)`
                }}
              >
                {/* Eye white */}
                <ellipse
                  cx="122"
                  cy="90"
                  rx={blink ? 12 : 12}
                  ry={blink ? 2 : 14}
                  fill="white"
                  stroke="#e8e0dc"
                  strokeWidth="1"
                  className="transition-all duration-100"
                />
                {/* Iris and pupil */}
                {!blink && (
                  <>
                    <ellipse cx="124" cy="92" rx="8" ry="10" fill="#4a2c1a" />
                    <ellipse cx="124" cy="92" rx="5" ry="7" fill="#2d1810" />
                    {/* Eye shine */}
                    <circle cx="120" cy="87" r="3.5" fill="white" opacity="0.95" />
                    <circle cx="127" cy="94" r="2" fill="white" opacity="0.7" />
                  </>
                )}
                {/* Eyelashes */}
                <path
                  d="M 110 82 Q 114 78 118 82"
                  stroke="#3d261a"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d="M 126 82 Q 130 78 134 82"
                  stroke="#3d261a"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                />
              </g>

              {/* Eyebrows - raised when watching */}
              <path
                d="M 68 76 Q 78 72 88 76"
                stroke="#5a3d2b"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
                className="transition-all duration-300"
                style={{
                  transform: state === "watching" ? "translateY(-4px)" : "translateY(0)",
                  opacity: 0.6
                }}
              />
              <path
                d="M 112 76 Q 122 72 132 76"
                stroke="#5a3d2b"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
                className="transition-all duration-300"
                style={{
                  transform: state === "watching" ? "translateY(-4px)" : "translateY(0)",
                  opacity: 0.6
                }}
              />
            </>
          )}
        </g>

        {/* Small cute nose */}
        <ellipse
          cx="100"
          cy="108"
          rx="3"
          ry="2"
          fill="#ffb8a0"
          opacity="0.7"
        />

        {/* Mouth */}
        <path
          d={
            state === "happy"
              ? "M 88 118 Q 100 132 112 118"
              : state === "hiding"
              ? "M 92 120 Q 100 125 108 120"
              : state === "watching"
              ? "M 93 120 Q 100 126 107 120"
              : "M 94 120 Q 100 124 106 120"
          }
          stroke="#e8867c"
          strokeWidth="2.5"
          fill={state === "happy" ? "#ffb8a0" : "none"}
          strokeLinecap="round"
          className="transition-all duration-500"
        />

        {/* Little dress/body hint at bottom */}
        <path
          d="M 70 140 Q 100 145 130 140 L 135 170 Q 100 175 65 170 Z"
          fill="url(#dressGradient)"
          filter="url(#softShadow)"
        />

        {/* Dress collar */}
        <ellipse cx="100" cy="138" rx="15" ry="5" fill="#10b981" />

        {/* Sparkles when happy */}
        {state === "happy" && (
          <>
            <g className="animate-sparkle">
              <path d="M 40 55 L 42 61 L 48 59 L 42 63 L 44 69 L 40 63 L 34 67 L 38 61 L 32 59 L 38 57 Z" fill="#fbbf24" />
            </g>
            <g className="animate-sparkle" style={{ animationDelay: "0.2s" }}>
              <path d="M 160 50 L 162 56 L 168 54 L 162 58 L 164 64 L 160 58 L 154 62 L 158 56 L 152 54 L 158 52 Z" fill="#fbbf24" />
            </g>
            <g className="animate-sparkle" style={{ animationDelay: "0.4s" }}>
              <path d="M 100 35 L 101 39 L 105 38 L 101 40 L 102 44 L 100 40 L 96 43 L 99 39 L 95 38 L 99 37 Z" fill="#fbbf24" />
            </g>
            {/* Hearts */}
            <g className="animate-sparkle" style={{ animationDelay: "0.3s" }}>
              <path d="M 45 95 C 45 92 48 90 50 92 C 52 90 55 92 55 95 C 55 98 50 102 50 102 C 50 102 45 98 45 95" fill="#ff6b9d" />
            </g>
            <g className="animate-sparkle" style={{ animationDelay: "0.5s" }}>
              <path d="M 145 90 C 145 87 148 85 150 87 C 152 85 155 87 155 90 C 155 93 150 97 150 97 C 150 97 145 93 145 90" fill="#ff6b9d" />
            </g>
          </>
        )}

        {/* Thinking dots */}
        {state === "thinking" && (
          <g className="animate-thinking-dots">
            <circle cx="150" cy="55" r="5" fill="#10b981" opacity="0.6" />
            <circle cx="162" cy="45" r="6" fill="#10b981" opacity="0.7" />
            <circle cx="175" cy="33" r="7" fill="#10b981" opacity="0.8" />
          </g>
        )}
      </svg>
    </div>
  );
}
