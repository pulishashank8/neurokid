"use client";

import { motion } from "framer-motion";

export function PlayfulIllustration() {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <svg viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
        {/* Definitions */}
        <defs>
          <linearGradient id="grassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: "#7DD3C0" }}/>
            <stop offset="100%" style={{ stopColor: "#34D399" }}/>
          </linearGradient>
          <linearGradient id="hairGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#5a3d2b" />
            <stop offset="50%" stopColor="#4a3020" />
            <stop offset="100%" stopColor="#3d261a" />
          </linearGradient>
          <linearGradient id="skinGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffe4d4" />
            <stop offset="100%" stopColor="#ffd4c0" />
          </linearGradient>
          <linearGradient id="cheekGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffb7c5" />
            <stop offset="100%" stopColor="#ffa0b4" />
          </linearGradient>
          <linearGradient id="bowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ff6b9d" />
            <stop offset="100%" stopColor="#ff4081" />
          </linearGradient>
          <linearGradient id="dressGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>

        {/* Background Clouds */}
        <motion.g 
          opacity={0.6}
          animate={{ x: [0, 30, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        >
          <path d="M100 80 Q120 60 150 70 Q170 50 200 65 Q230 55 250 80 Q270 70 280 90 L280 100 L100 100 Z" 
                fill="white" stroke="#E5E7EB" strokeWidth="2"/>
        </motion.g>
        
        <motion.g 
          opacity={0.5}
          animate={{ x: [0, -25, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        >
          <path d="M600 60 Q620 40 650 50 Q670 30 700 45 Q730 35 750 60 Q770 50 780 70 L780 80 L600 80 Z" 
                fill="white" stroke="#E5E7EB" strokeWidth="2"/>
        </motion.g>

        {/* Main Floating Group */}
        <motion.g
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          
          {/* Grass Hill */}
          <path d="M0 400 Q200 360 400 380 Q600 400 800 370 L800 500 L0 500 Z" 
                fill="url(#grassGrad)" stroke="#10B981" strokeWidth="3"/>
          
          {/* Flowers */}
          <g transform="translate(80, 400)">
            <line x1="0" y1="0" x2="0" y2="25" stroke="#16A34A" strokeWidth="3"/>
            <circle cx="0" cy="0" r="8" fill="#F472B6" stroke="#EC4899" strokeWidth="2"/>
            <circle cx="0" cy="0" r="4" fill="#FCD34D"/>
          </g>
          <g transform="translate(720, 410)">
            <line x1="0" y1="0" x2="0" y2="20" stroke="#16A34A" strokeWidth="3"/>
            <circle cx="0" cy="0" r="8" fill="#A78BFA" stroke="#8B5CF6" strokeWidth="2"/>
            <circle cx="0" cy="0" r="4" fill="#FCD34D"/>
          </g>

          {/* SPOTTED DOG (Left) */}
          <g transform="translate(140, 280)">
            <ellipse cx="60" cy="80" rx="55" ry="45" fill="#FEF3C7" stroke="#92400E" strokeWidth="3"/>
            <circle cx="40" cy="70" r="8" fill="#92400E"/>
            <circle cx="80" cy="85" r="6" fill="#92400E"/>
            <circle cx="55" cy="95" r="5" fill="#92400E"/>
            <circle cx="60" cy="35" r="35" fill="#FEF3C7" stroke="#92400E" strokeWidth="3"/>
            <ellipse cx="25" cy="30" rx="12" ry="20" fill="#92400E" stroke="#78350F" strokeWidth="2"/>
            <ellipse cx="95" cy="30" rx="12" ry="20" fill="#92400E" stroke="#78350F" strokeWidth="2"/>
            <circle cx="48" cy="30" r="4" fill="#1F2937"/>
            <circle cx="72" cy="30" r="4" fill="#1F2937"/>
            <ellipse cx="60" cy="42" rx="6" ry="4" fill="#1F2937"/>
            <ellipse cx="60" cy="38" rx="8" ry="6" fill="#1F2937"/>
            <path d="M52 48 Q60 55 68 48" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round"/>
            <path d="M35 65 Q60 75 85 65" stroke="#EF4444" strokeWidth="6" fill="none" strokeLinecap="round"/>
            <circle cx="60" cy="72" r="5" fill="#FCD34D" stroke="#D97706" strokeWidth="2"/>
            
            {/* Wagging Tail */}
            <motion.path 
              d="M10 70 Q-10 50 -5 30" 
              stroke="#FEF3C7" 
              strokeWidth="12" 
              fill="none" 
              strokeLinecap="round"
              animate={{ rotate: [-15, 15, -15] }}
              transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut" }}
              style={{ transformOrigin: "10px 70px" }}
            />
            <motion.path 
              d="M10 70 Q-10 50 -5 30" 
              stroke="#92400E" 
              strokeWidth="3" 
              fill="none" 
              strokeLinecap="round"
              animate={{ rotate: [-15, 15, -15] }}
              transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut" }}
              style={{ transformOrigin: "10px 70px" }}
            />
            <ellipse cx="35" cy="120" rx="12" ry="8" fill="#FEF3C7" stroke="#92400E" strokeWidth="2"/>
            <ellipse cx="85" cy="120" rx="12" ry="8" fill="#FEF3C7" stroke="#92400E" strokeWidth="2"/>
          </g>

          {/* GIRL SITTING - Using EXACT face from AnimatedMascot */}
          <g transform="translate(360, 260)">
            
            {/* LEGS (sitting with pink shoes visible) */}
            <ellipse cx="15" cy="125" rx="30" ry="12" fill="#FFCCBC" stroke="#FFAB91" strokeWidth="2"/>
            <ellipse cx="-5" cy="130" rx="15" ry="10" fill="#F472B6" stroke="#EC4899" strokeWidth="2"/>
            <ellipse cx="65" cy="125" rx="30" ry="12" fill="#FFCCBC" stroke="#FFAB91" strokeWidth="2"/>
            <ellipse cx="85" cy="130" rx="15" ry="10" fill="#F472B6" stroke="#EC4899" strokeWidth="2"/>
            
            {/* BODY - Green dress */}
            <path d="M20 140 Q40 145 60 140 L 65 170 Q 40 175 15 170 Z" fill="url(#dressGradient)" stroke="#10b981" strokeWidth="2"/>
            <ellipse cx="40" cy="138" rx="15" ry="5" fill="#10b981" />
            
            {/* ARMS */}
            <motion.g
              animate={{ rotate: [-3, 3, -3] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              style={{ transformOrigin: "15px 75px" }}
            >
              <ellipse cx="5" cy="85" rx="10" ry="25" fill="#34d399" stroke="#10b981" strokeWidth="2" transform="rotate(-20 5 85)"/>
              <circle cx="-10" cy="105" r="10" fill="#FFCCBC" stroke="#FFAB91" strokeWidth="2"/>
            </motion.g>
            <motion.g
              animate={{ rotate: [3, -3, 3] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              style={{ transformOrigin: "65px 75px" }}
            >
              <ellipse cx="75" cy="85" rx="10" ry="25" fill="#34d399" stroke="#10b981" strokeWidth="2" transform="rotate(20 75 85)"/>
              <circle cx="90" cy="105" r="10" fill="#FFCCBC" stroke="#FFAB91" strokeWidth="2"/>
            </motion.g>
            
            {/* HAIR - Back part (exact from AnimatedMascot) */}
            <ellipse cx="40" cy="25" rx="58" ry="55" fill="url(#hairGradient)" />
            
            {/* Hair sides (pigtails) */}
            <ellipse cx="-15" cy="40" rx="15" ry="35" fill="url(#hairGradient)" />
            <ellipse cx="95" cy="40" rx="15" ry="35" fill="url(#hairGradient)" />
            
            {/* FACE - EXACT from AnimatedMascot */}
            <ellipse cx="40" cy="35" rx="48" ry="45" fill="url(#skinGradient)" />
            
            {/* Bangs - exact from AnimatedMascot */}
            <path d="M -5 10 Q 5 -5 25 0 Q 40 -8 55 0 Q 75 -5 85 10 Q 80 5 40 8 Q 0 5 -5 10" fill="url(#hairGradient)" />
            
            {/* Side bangs */}
            <ellipse cx="-2" cy="18" rx="12" ry="18" fill="url(#hairGradient)" />
            <ellipse cx="82" cy="18" rx="12" ry="18" fill="url(#hairGradient)" />
            
            {/* Cute bow on head - exact from AnimatedMascot */}
            <g>
              <ellipse cx="30" cy="-8" rx="12" ry="8" fill="url(#bowGradient)" />
              <ellipse cx="50" cy="-8" rx="12" ry="8" fill="url(#bowGradient)" />
              <circle cx="40" cy="-8" r="6" fill="#ff4081" />
              <ellipse cx="40" cy="2" rx="4" ry="8" fill="url(#bowGradient)" />
            </g>
            
            {/* Cheeks - exact from AnimatedMascot */}
            <ellipse cx="2" cy="45" rx="10" ry="6" fill="url(#cheekGradient)" opacity="0.6" />
            <ellipse cx="78" cy="45" rx="10" ry="6" fill="url(#cheekGradient)" opacity="0.6" />
            
            {/* EYES - EXACT from AnimatedMascot */}
            {/* Left Eye */}
            <g>
              <ellipse cx="18" cy="30" rx="12" ry="14" fill="white" stroke="#e8e0dc" strokeWidth="1" />
              <ellipse cx="20" cy="32" rx="8" ry="10" fill="#4a2c1a" />
              <ellipse cx="20" cy="32" rx="5" ry="7" fill="#2d1810" />
              <circle cx="16" cy="27" r="3.5" fill="white" opacity="0.95" />
              <circle cx="23" cy="34" r="2" fill="white" opacity="0.7" />
              <path d="M 6 22 Q 10 18 14 22" stroke="#3d261a" strokeWidth="2" fill="none" strokeLinecap="round" />
              <path d="M 22 22 Q 26 18 30 22" stroke="#3d261a" strokeWidth="2" fill="none" strokeLinecap="round" />
            </g>
            
            {/* Right Eye */}
            <g>
              <ellipse cx="62" cy="30" rx="12" ry="14" fill="white" stroke="#e8e0dc" strokeWidth="1" />
              <ellipse cx="64" cy="32" rx="8" ry="10" fill="#4a2c1a" />
              <ellipse cx="64" cy="32" rx="5" ry="7" fill="#2d1810" />
              <circle cx="60" cy="27" r="3.5" fill="white" opacity="0.95" />
              <circle cx="67" cy="34" r="2" fill="white" opacity="0.7" />
              <path d="M 50 22 Q 54 18 58 22" stroke="#3d261a" strokeWidth="2" fill="none" strokeLinecap="round" />
              <path d="M 66 22 Q 70 18 74 22" stroke="#3d261a" strokeWidth="2" fill="none" strokeLinecap="round" />
            </g>
            
            {/* Eyebrows */}
            <path d="M 8 16 Q 18 12 28 16" stroke="#5a3d2b" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.6" />
            <path d="M 52 16 Q 62 12 72 16" stroke="#5a3d2b" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.6" />
            
            {/* Small cute nose */}
            <ellipse cx="40" cy="48" rx="3" ry="2" fill="#ffb8a0" opacity="0.7" />
            
            {/* Mouth */}
            <path d="M 34 58 Q 40 62 46 58" stroke="#e8867c" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </g>

          {/* WHITE DOG WITH PINK EARS (Right) */}
          <g transform="translate(520, 270)">
            <ellipse cx="60" cy="80" rx="50" ry="45" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="3"/>
            <circle cx="60" cy="35" r="32" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="3"/>
            <ellipse cx="28" cy="30" rx="14" ry="22" fill="#F9A8D4" stroke="#F472B6" strokeWidth="2"/>
            <ellipse cx="92" cy="30" rx="14" ry="22" fill="#F9A8D4" stroke="#F472B6" strokeWidth="2"/>
            <circle cx="50" cy="32" r="3.5" fill="#1F2937"/>
            <circle cx="70" cy="32" r="3.5" fill="#1F2937"/>
            <ellipse cx="60" cy="42" rx="10" ry="8" fill="#F3F4F6"/>
            <ellipse cx="60" cy="38" rx="6" ry="4" fill="#1F2937"/>
            <ellipse cx="60" cy="52" rx="5" ry="8" fill="#F472B6" stroke="#EC4899" strokeWidth="1"/>
            <path d="M50 48 Q60 58 70 48" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round"/>
            <path d="M38 62 Q60 70 82 62" stroke="#FCD34D" strokeWidth="5" fill="none" strokeLinecap="round"/>
            <circle cx="60" cy="68" r="4" fill="#F59E0B" stroke="#D97706" strokeWidth="1"/>
            <circle cx="35" cy="75" r="6" fill="#F9A8D4" opacity="0.6"/>
            <circle cx="85" cy="85" r="5" fill="#F9A8D4" opacity="0.6"/>
            
            {/* Wagging Tail */}
            <motion.path 
              d="M105 70 Q125 55 130 35" 
              stroke="#FFFFFF" 
              strokeWidth="10" 
              fill="none" 
              strokeLinecap="round"
              animate={{ rotate: [-15, 15, -15] }}
              transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
              style={{ transformOrigin: "105px 70px" }}
            />
            <motion.path 
              d="M105 70 Q125 55 130 35" 
              stroke="#E5E7EB" 
              strokeWidth="2" 
              fill="none" 
              strokeLinecap="round"
              animate={{ rotate: [-15, 15, -15] }}
              transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
              style={{ transformOrigin: "105px 70px" }}
            />
            
            <ellipse cx="35" cy="118" rx="10" ry="7" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="2"/>
            <ellipse cx="85" cy="118" rx="10" ry="7" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="2"/>
          </g>

          {/* YELLOW DOG (Bottom Right, lying down) */}
          <g transform="translate(580, 380)">
            <ellipse cx="60" cy="30" rx="55" ry="25" fill="#FCD34D" stroke="#D97706" strokeWidth="3"/>
            <circle cx="25" cy="25" r="28" fill="#FCD34D" stroke="#D97706" strokeWidth="3"/>
            <ellipse cx="5" cy="20" rx="10" ry="18" fill="#D97706"/>
            <ellipse cx="45" cy="20" rx="10" ry="18" fill="#D97706"/>
            <circle cx="18" cy="22" r="3" fill="#1F2937"/>
            <circle cx="32" cy="22" r="3" fill="#1F2937"/>
            <ellipse cx="25" cy="30" rx="5" ry="4" fill="#1F2937"/>
            <path d="M20 36 Q25 40 30 36" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round"/>
            <path d="M8 45 Q25 52 42 45" stroke="#3B82F6" strokeWidth="4" fill="none" strokeLinecap="round"/>
            <path d="M110 25 Q125 15 120 5" stroke="#FCD34D" strokeWidth="8" fill="none" strokeLinecap="round"/>
            <ellipse cx="50" cy="50" rx="12" ry="8" fill="#FCD34D" stroke="#D97706" strokeWidth="2"/>
            <ellipse cx="80" cy="50" rx="12" ry="8" fill="#FCD34D" stroke="#D97706" strokeWidth="2"/>
          </g>

        </motion.g>

        {/* BUTTERFLIES */}
        <motion.g
          animate={{ x: [0, 30, 10, -20, 0], y: [0, -20, -40, -15, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        >
          <g transform="translate(150, 100)">
            <motion.g animate={{ scaleX: [1, 0.6, 1] }} transition={{ duration: 0.3, repeat: Infinity }}>
              <ellipse cx="-8" cy="0" rx="10" ry="14" fill="#FCD34D" stroke="#D97706" strokeWidth="2"/>
              <ellipse cx="-6" cy="-8" rx="6" ry="10" fill="#FCD34D" stroke="#D97706" strokeWidth="2"/>
            </motion.g>
            <motion.g animate={{ scaleX: [1, 0.6, 1] }} transition={{ duration: 0.3, repeat: Infinity }}>
              <ellipse cx="8" cy="0" rx="10" ry="14" fill="#FCD34D" stroke="#D97706" strokeWidth="2"/>
              <ellipse cx="6" cy="-8" rx="6" ry="10" fill="#FCD34D" stroke="#D97706" strokeWidth="2"/>
            </motion.g>
            <line x1="0" y1="-12" x2="0" y2="12" stroke="#5D4037" strokeWidth="2"/>
          </g>
        </motion.g>

        <motion.g
          animate={{ x: [0, -25, 15, -15, 0], y: [0, -30, -20, -25, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        >
          <g transform="translate(650, 120)">
            <motion.g animate={{ scaleX: [1, 0.6, 1] }} transition={{ duration: 0.3, repeat: Infinity }}>
              <ellipse cx="-8" cy="0" rx="10" ry="14" fill="#F9A8D4" stroke="#F472B6" strokeWidth="2"/>
              <ellipse cx="-6" cy="-8" rx="6" ry="10" fill="#F9A8D4" stroke="#F472B6" strokeWidth="2"/>
            </motion.g>
            <motion.g animate={{ scaleX: [1, 0.6, 1] }} transition={{ duration: 0.3, repeat: Infinity }}>
              <ellipse cx="8" cy="0" rx="10" ry="14" fill="#F9A8D4" stroke="#F472B6" strokeWidth="2"/>
              <ellipse cx="6" cy="-8" rx="6" ry="10" fill="#F9A8D4" stroke="#F472B6" strokeWidth="2"/>
            </motion.g>
            <line x1="0" y1="-12" x2="0" y2="12" stroke="#5D4037" strokeWidth="2"/>
          </g>
        </motion.g>

        <motion.g
          animate={{ x: [0, 20, 40, 10, -15, 0], y: [0, -15, -35, -45, -25, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        >
          <g transform="translate(700, 200)">
            <motion.g animate={{ scaleX: [1, 0.6, 1] }} transition={{ duration: 0.3, repeat: Infinity }}>
              <ellipse cx="-8" cy="0" rx="10" ry="14" fill="#93C5FD" stroke="#3B82F6" strokeWidth="2"/>
              <ellipse cx="-6" cy="-8" rx="6" ry="10" fill="#93C5FD" stroke="#3B82F6" strokeWidth="2"/>
            </motion.g>
            <motion.g animate={{ scaleX: [1, 0.6, 1] }} transition={{ duration: 0.3, repeat: Infinity }}>
              <ellipse cx="8" cy="0" rx="10" ry="14" fill="#93C5FD" stroke="#3B82F6" strokeWidth="2"/>
              <ellipse cx="6" cy="-8" rx="6" ry="10" fill="#93C5FD" stroke="#3B82F6" strokeWidth="2"/>
            </motion.g>
            <line x1="0" y1="-12" x2="0" y2="12" stroke="#5D4037" strokeWidth="2"/>
          </g>
        </motion.g>

        <motion.g
          animate={{ x: [0, 30, 10, -20, 0], y: [0, -20, -40, -15, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: -2 }}
        >
          <g transform="translate(100, 180)">
            <motion.g animate={{ scaleX: [1, 0.6, 1] }} transition={{ duration: 0.3, repeat: Infinity }}>
              <ellipse cx="-8" cy="0" rx="10" ry="14" fill="#86EFAC" stroke="#22C55E" strokeWidth="2"/>
              <ellipse cx="-6" cy="-8" rx="6" ry="10" fill="#86EFAC" stroke="#22C55E" strokeWidth="2"/>
            </motion.g>
            <motion.g animate={{ scaleX: [1, 0.6, 1] }} transition={{ duration: 0.3, repeat: Infinity }}>
              <ellipse cx="8" cy="0" rx="10" ry="14" fill="#86EFAC" stroke="#22C55E" strokeWidth="2"/>
              <ellipse cx="6" cy="-8" rx="6" ry="10" fill="#86EFAC" stroke="#22C55E" strokeWidth="2"/>
            </motion.g>
            <line x1="0" y1="-12" x2="0" y2="12" stroke="#5D4037" strokeWidth="2"/>
          </g>
        </motion.g>

        {/* SPARKLES */}
        <motion.g transform="translate(200, 80)" animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.3, 0.8] }} transition={{ duration: 2, repeat: Infinity }}>
          <path d="M0 -8 L2 -2 L8 0 L2 2 L0 8 L-2 2 L-8 0 L-2 -2 Z" fill="#FCD34D"/>
        </motion.g>
        <motion.g transform="translate(550, 60)" animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.3, 0.8] }} transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}>
          <path d="M0 -6 L1.5 -1.5 L6 0 L1.5 1.5 L0 6 L-1.5 1.5 L-6 0 L-1.5 -1.5 Z" fill="#60A5FA"/>
        </motion.g>
        <motion.g transform="translate(450, 120)" animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.3, 0.8] }} transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}>
          <path d="M0 -10 L2.5 -2.5 L10 0 L2.5 2.5 L0 10 L-2.5 2.5 L-10 0 L-2.5 -2.5 Z" fill="#F9A8D4"/>
        </motion.g>
        <motion.g transform="translate(300, 60)" animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.3, 0.8] }} transition={{ duration: 2, repeat: Infinity, delay: 0.9 }}>
          <path d="M0 -5 L1.5 -1.5 L5 0 L1.5 1.5 L0 5 L-1.5 1.5 L-5 0 L-1.5 -1.5 Z" fill="#34D399"/>
        </motion.g>
        <motion.g transform="translate(750, 150)" animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.3, 0.8] }} transition={{ duration: 2, repeat: Infinity, delay: 1.2 }}>
          <path d="M0 -7 L2 -2 L7 0 L2 2 L0 7 L-2 2 L-7 0 L-2 -2 Z" fill="#A78BFA"/>
        </motion.g>

      </svg>
    </div>
  );
}
