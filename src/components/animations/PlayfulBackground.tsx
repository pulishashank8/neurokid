"use client";

import { motion } from "framer-motion";
import { useTheme } from "@/app/theme-provider";
import { useMemo } from "react";

// Animated Sun Component - Rays rotate, face stays stable
function AnimatedSun() {
  return (
    <motion.div
      className="absolute top-8 right-8 sm:top-12 sm:right-16 z-20"
      animate={{ 
        scale: [1, 1.08, 1],
        y: [0, -5, 0]
      }}
      transition={{ 
        scale: { duration: 4, repeat: Infinity, ease: "easeInOut" },
        y: { duration: 6, repeat: Infinity, ease: "easeInOut" }
      }}
    >
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className="w-20 h-20 sm:w-28 sm:h-28">
        {/* Sun rays - rotating independently */}
        <motion.g 
          animate={{ rotate: 360 }} 
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "60px 60px" }}
        >
          {[...Array(16)].map((_, i) => (
            <motion.line
              key={i}
              x1="60"
              y1="5"
              x2="60"
              y2="22"
              stroke="#F59E0B"
              strokeWidth="5"
              strokeLinecap="round"
              transform={`rotate(${i * 22.5} 60 60)`}
              animate={{ 
                strokeLength: [18, 22, 18],
                opacity: [0.8, 1, 0.8]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                ease: "easeInOut",
                delay: i * 0.1 
              }}
            />
          ))}
        </motion.g>
        
        {/* Sun face - stable, not rotating */}
        <g>
          {/* Main body with warm gradient effect */}
          <circle cx="60" cy="60" r="38" fill="#FCD34D" />
          <circle cx="60" cy="60" r="34" fill="#FBBF24" opacity="0.6" />
          
          {/* Eyes - stable and proportional */}
          <ellipse cx="50" cy="54" rx="4" ry="5" fill="#92400E" />
          <ellipse cx="70" cy="54" rx="4" ry="5" fill="#92400E" />
          
          {/* Eye shine */}
          <circle cx="51" cy="52" r="1.5" fill="white" opacity="0.8" />
          <circle cx="71" cy="52" r="1.5" fill="white" opacity="0.8" />
          
          {/* Smile - stable */}
          <path 
            d="M48 68 Q60 78 72 68" 
            stroke="#92400E" 
            strokeWidth="3" 
            strokeLinecap="round" 
            fill="none"
          />
          
          {/* Rosy cheeks */}
          <circle cx="42" cy="64" r="7" fill="#F87171" opacity="0.5" />
          <circle cx="78" cy="64" r="7" fill="#F87171" opacity="0.5" />
        </g>
      </svg>
    </motion.div>
  );
}

// Animated Moon Component
function AnimatedMoon() {
  return (
    <motion.div
      className="absolute top-8 right-8 sm:top-12 sm:right-16 z-20"
      animate={{ 
        rotate: [0, 10, 0],
      }}
      transition={{ 
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <svg width="100" height="100" viewBox="0 0 100 100" fill="none" className="w-16 h-16 sm:w-24 sm:h-24">
        {/* Moon body */}
        <circle cx="50" cy="50" r="40" fill="#FEF3C7" />
        <circle cx="55" cy="45" r="35" fill="#0C0A09" />
        {/* Moon craters */}
        <circle cx="35" cy="40" r="6" fill="#FEF3C7" opacity="0.5" />
        <circle cx="45" cy="55" r="4" fill="#FEF3C7" opacity="0.5" />
        <circle cx="30" cy="55" r="3" fill="#FEF3C7" opacity="0.5" />
        {/* Stars around moon */}
        <motion.g animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}>
          <circle cx="20" cy="30" r="2" fill="#FEF3C7" />
          <circle cx="80" cy="25" r="2" fill="#FEF3C7" />
          <circle cx="85" cy="60" r="1.5" fill="#FEF3C7" />
          <circle cx="15" cy="65" r="1.5" fill="#FEF3C7" />
        </motion.g>
      </svg>
    </motion.div>
  );
}

// Realistic fluffy cloud
interface CloudProps {
  size: "sm" | "md" | "lg" | "xl";
  startY: string;
  duration: number;
  delay: number;
  opacity?: number;
}

function FloatingCloud({ size, startY, duration, delay, opacity = 0.8 }: CloudProps) {
  const sizeClasses = {
    sm: { width: 100, height: 50, scale: 0.6 },
    md: { width: 140, height: 70, scale: 0.8 },
    lg: { width: 180, height: 90, scale: 1 },
    xl: { width: 220, height: 110, scale: 1.2 },
  };

  const { width, height, scale } = sizeClasses[size];

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ 
        top: startY,
        opacity,
      }}
      initial={{ x: "-30vw" }}
      animate={{ x: "130vw" }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "linear",
        delay,
      }}
    >
      <motion.div
        animate={{ 
          y: [0, -8, 0, 6, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{ transform: `scale(${scale})` }}
      >
        <svg width={width} height={height} viewBox="0 0 200 100" fill="none" filter="url(#cloud-shadow)">
          <defs>
            <filter id="cloud-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
              <feOffset dx="2" dy="4" result="offsetblur" />
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.2" />
              </feComponentTransfer>
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="cloud-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="50%" stopColor="#F8FAFC" />
              <stop offset="100%" stopColor="#E2E8F0" />
            </linearGradient>
          </defs>
          
          {/* Realistic cloud made of overlapping circles */}
          <g>
            {/* Back puffs - darker/larger for depth */}
            <circle cx="50" cy="65" r="25" fill="#E2E8F0" />
            <circle cx="80" cy="60" r="30" fill="#E2E8F0" />
            <circle cx="120" cy="62" r="28" fill="#E2E8F0" />
            <circle cx="150" cy="68" r="22" fill="#E2E8F0" />
            
            {/* Middle layer */}
            <circle cx="40" cy="55" r="22" fill="#F1F5F9" />
            <circle cx="70" cy="48" r="28" fill="#F1F5F9" />
            <circle cx="105" cy="50" r="26" fill="#F1F5F9" />
            <circle cx="140" cy="55" r="24" fill="#F1F5F9" />
            <circle cx="165" cy="62" r="18" fill="#F1F5F9" />
            
            {/* Front/top puffs - brightest */}
            <circle cx="55" cy="42" r="20" fill="url(#cloud-gradient)" />
            <circle cx="85" cy="35" r="24" fill="url(#cloud-gradient)" />
            <circle cx="115" cy="38" r="22" fill="url(#cloud-gradient)" />
            <circle cx="140" cy="45" r="19" fill="url(#cloud-gradient)" />
            
            {/* Highlight spots */}
            <ellipse cx="75" cy="32" rx="8" ry="5" fill="white" opacity="0.6" />
            <ellipse cx="105" cy="35" rx="10" ry="6" fill="white" opacity="0.5" />
            <ellipse cx="130" cy="42" rx="6" ry="4" fill="white" opacity="0.4" />
          </g>
        </svg>
      </motion.div>
    </motion.div>
  );
}

// Animated Clouds System
function AnimatedClouds() {
  const clouds = useMemo(() => [
    { size: "lg" as const, startY: "5%", duration: 45, delay: 0, opacity: 0.9 },
    { size: "md" as const, startY: "12%", duration: 55, delay: 5, opacity: 0.7 },
    { size: "sm" as const, startY: "3%", duration: 65, delay: 12, opacity: 0.6 },
    { size: "xl" as const, startY: "18%", duration: 50, delay: 18, opacity: 0.85 },
    { size: "md" as const, startY: "8%", duration: 60, delay: 25, opacity: 0.75 },
    { size: "sm" as const, startY: "22%", duration: 70, delay: 32, opacity: 0.5 },
    { size: "lg" as const, startY: "6%", duration: 48, delay: 40, opacity: 0.8 },
    { size: "md" as const, startY: "15%", duration: 52, delay: 48, opacity: 0.65 },
    { size: "xl" as const, startY: "10%", duration: 58, delay: 15, opacity: 0.75 },
    { size: "sm" as const, startY: "25%", duration: 72, delay: 28, opacity: 0.55 },
    { size: "lg" as const, startY: "4%", duration: 46, delay: 35, opacity: 0.85 },
    { size: "md" as const, startY: "20%", duration: 62, delay: 42, opacity: 0.6 },
  ], []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {clouds.map((cloud, index) => (
        <FloatingCloud key={index} {...cloud} />
      ))}
    </div>
  );
}

// Bird Component
interface BirdProps {
  startY: string;
  duration: number;
  delay: number;
  size?: "sm" | "md" | "lg";
  color?: string;
}

function FlyingBird({ startY, duration, delay, size = "md", color = "#4B5563" }: BirdProps) {
  const sizeMap = { sm: 24, md: 32, lg: 40 };
  const birdSize = sizeMap[size];

  return (
    <motion.div
      className="absolute pointer-events-none z-10"
      style={{ top: startY }}
      initial={{ x: "-10vw" }}
      animate={{ 
        x: "110vw",
        y: [0, -15, 5, -10, 0],
      }}
      transition={{
        x: { duration, repeat: Infinity, ease: "linear", delay },
        y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
      }}
    >
      <motion.svg
        width={birdSize}
        height={birdSize}
        viewBox="0 0 40 40"
        fill="none"
      >
        <ellipse cx="20" cy="22" rx="8" ry="5" fill={color} />
        <circle cx="26" cy="18" r="4" fill={color} />
        <path d="M29 17 L33 18 L29 19 Z" fill="#F59E0B" />
        <motion.path
          d="M12 20 Q5 12 8 8 Q12 14 16 18"
          fill={color}
          animate={{ 
            d: [
              "M12 20 Q5 12 8 8 Q12 14 16 18",
              "M12 20 Q3 18 2 22 Q8 20 16 18",
              "M12 20 Q5 12 8 8 Q12 14 16 18",
            ]
          }}
          transition={{ duration: 0.4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.path
          d="M28 20 Q35 12 32 8 Q28 14 24 18"
          fill={color}
          animate={{ 
            d: [
              "M28 20 Q35 12 32 8 Q28 14 24 18",
              "M28 20 Q37 18 38 22 Q32 20 24 18",
              "M28 20 Q35 12 32 8 Q28 14 24 18",
            ]
          }}
          transition={{ duration: 0.4, repeat: Infinity, ease: "easeInOut" }}
        />
        <path d="M12 22 L6 20 L6 24 Z" fill={color} />
      </motion.svg>
    </motion.div>
  );
}

// Birds Flock System
function FlyingBirds() {
  const birds = useMemo(() => [
    { startY: "18%", duration: 22, delay: 0, size: "md" as const, color: "#6B7280" },
    { startY: "21%", duration: 23, delay: 0.3, size: "sm" as const, color: "#6B7280" },
    { startY: "15%", duration: 21, delay: 0.6, size: "sm" as const, color: "#6B7280" },
    { startY: "24%", duration: 24, delay: 0.9, size: "md" as const, color: "#6B7280" },
    { startY: "30%", duration: 28, delay: 8, size: "lg" as const, color: "#4B5563" },
    { startY: "33%", duration: 29, delay: 8.4, size: "md" as const, color: "#4B5563" },
    { startY: "27%", duration: 27, delay: 8.8, size: "sm" as const, color: "#4B5563" },
    { startY: "12%", duration: 25, delay: 15, size: "sm" as const, color: "#9CA3AF" },
    { startY: "14%", duration: 26, delay: 15.5, size: "sm" as const, color: "#9CA3AF" },
    { startY: "10%", duration: 24, delay: 16, size: "md" as const, color: "#9CA3AF" },
    { startY: "16%", duration: 27, delay: 16.5, size: "sm" as const, color: "#9CA3AF" },
    { startY: "35%", duration: 32, delay: 22, size: "md" as const, color: "#6B7280" },
    { startY: "38%", duration: 33, delay: 22.5, size: "sm" as const, color: "#6B7280" },
    { startY: "32%", duration: 31, delay: 23, size: "lg" as const, color: "#6B7280" },
    { startY: "20%", duration: 35, delay: 30, size: "sm" as const, color: "#9CA3AF" },
    { startY: "25%", duration: 36, delay: 32, size: "md" as const, color: "#6B7280" },
    { startY: "28%", duration: 34, delay: 35, size: "sm" as const, color: "#4B5563" },
  ], []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {birds.map((bird, index) => (
        <FlyingBird key={index} {...bird} />
      ))}
    </div>
  );
}

// Butterfly Component
interface ButterflyProps {
  color?: string;
  delay?: number;
  startY: string;
  duration: number;
  size?: "sm" | "md" | "lg";
}

function FlutteringButterfly({ 
  color = "#FBBF24", 
  delay = 0, 
  startY, 
  duration,
  size = "md"
}: ButterflyProps) {
  const sizeMap = { sm: 28, md: 36, lg: 44 };
  const butterflySize = sizeMap[size];

  return (
    <motion.div
      className="absolute pointer-events-none z-10"
      style={{ top: startY }}
      initial={{ x: "-5vw" }}
      animate={{ 
        x: "105vw",
        y: [0, -30, 10, -20, 5, -25, 0],
      }}
      transition={{
        x: { duration, repeat: Infinity, ease: "linear", delay },
        y: { duration: 6, repeat: Infinity, ease: "easeInOut" },
      }}
    >
      <motion.div
        animate={{ 
          rotate: [0, 10, -5, 15, -10, 5, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <motion.svg
          width={butterflySize}
          height={butterflySize}
          viewBox="0 0 40 40"
          fill="none"
          animate={{ scaleX: [1, 0.3, 1, 0.4, 1] }}
          transition={{ duration: 0.25, repeat: Infinity, ease: "easeInOut" }}
        >
          <ellipse cx="12" cy="16" rx="9" ry="11" fill={color} opacity="0.9" />
          <ellipse cx="28" cy="16" rx="9" ry="11" fill={color} opacity="0.9" />
          <ellipse cx="12" cy="28" rx="6" ry="8" fill={color} opacity="0.7" />
          <ellipse cx="28" cy="28" rx="6" ry="8" fill={color} opacity="0.7" />
          <circle cx="10" cy="14" r="3" fill="white" opacity="0.6" />
          <circle cx="30" cy="14" r="3" fill="white" opacity="0.6" />
          <ellipse cx="20" cy="20" rx="2" ry="10" fill="#374151" />
          <circle cx="20" cy="10" r="3" fill="#374151" />
        </motion.svg>
      </motion.div>
    </motion.div>
  );
}

// Butterflies System
function FlyingButterflies() {
  const butterflies = useMemo(() => [
    { color: "#FBBF24", delay: 0, startY: "60%", duration: 20, size: "md" as const },
    { color: "#F472B6", delay: 3, startY: "70%", duration: 22, size: "sm" as const },
    { color: "#60A5FA", delay: 6, startY: "55%", duration: 24, size: "lg" as const },
    { color: "#34D399", delay: 9, startY: "75%", duration: 21, size: "md" as const },
    { color: "#A78BFA", delay: 12, startY: "65%", duration: 23, size: "sm" as const },
    { color: "#F87171", delay: 15, startY: "80%", duration: 25, size: "md" as const },
    { color: "#FBBF24", delay: 18, startY: "58%", duration: 19, size: "sm" as const },
    { color: "#EC4899", delay: 5, startY: "72%", duration: 26, size: "lg" as const },
  ], []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {butterflies.map((butterfly, index) => (
        <FlutteringButterfly key={index} {...butterfly} />
      ))}
    </div>
  );
}

// Moving Star Component (night)
interface MovingStarProps {
  startY: string;
  duration: number;
  delay: number;
  size?: "sm" | "md" | "lg";
}

function MovingStar({ startY, duration, delay, size = "md" }: MovingStarProps) {
  const sizeMap = { sm: 2, md: 3, lg: 4 };
  const starSize = sizeMap[size];

  return (
    <motion.div
      className="absolute pointer-events-none z-10"
      style={{ top: startY }}
      initial={{ x: "-5vw" }}
      animate={{ 
        x: "110vw",
        y: [0, -10, 5, -5, 0],
      }}
      transition={{
        x: { duration, repeat: Infinity, ease: "linear", delay },
        y: { duration: 5, repeat: Infinity, ease: "easeInOut" },
      }}
    >
      <motion.div
        animate={{ 
          opacity: [0.4, 0.9, 0.4],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <svg width={starSize * 4} height={starSize * 4} viewBox="0 0 16 16" fill="none">
          <path
            d="M8 0 L9.5 6.5 L16 8 L9.5 9.5 L8 16 L6.5 9.5 L0 8 L6.5 6.5 Z"
            fill="white"
          />
        </svg>
      </motion.div>
    </motion.div>
  );
}

// Shooting Star / Rocket Component
interface ShootingStarProps {
  startY: string;
  duration: number;
  delay: number;
}

function ShootingStar({ startY, duration, delay }: ShootingStarProps) {
  return (
    <motion.div
      className="absolute pointer-events-none z-10"
      style={{ top: startY }}
      initial={{ x: "-10vw", opacity: 0 }}
      animate={{ 
        x: "120vw",
        opacity: [0, 1, 1, 0],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "linear",
        delay,
      }}
    >
      <div className="relative">
        {/* Star head */}
        <motion.div
          className="w-2 h-2 bg-white rounded-full shadow-lg"
          animate={{ 
            boxShadow: [
              "0 0 10px 2px rgba(255,255,255,0.8)",
              "0 0 20px 5px rgba(255,255,255,0.6)",
              "0 0 10px 2px rgba(255,255,255,0.8)",
            ]
          }}
          transition={{ duration: 0.5, repeat: Infinity }}
        />
        {/* Tail */}
        <div 
          className="absolute top-1/2 right-0 -translate-y-1/2 h-0.5 bg-gradient-to-l from-transparent via-white/80 to-white"
          style={{ width: "60px" }}
        />
      </div>
    </motion.div>
  );
}

// Night Sky Stars System (balanced moving stars)
function NightSkyStars() {
  const stars = useMemo(() => [
    { startY: "15%", duration: 28, delay: 0, size: "md" as const },
    { startY: "22%", duration: 35, delay: 3, size: "sm" as const },
    { startY: "10%", duration: 32, delay: 6, size: "lg" as const },
    { startY: "25%", duration: 38, delay: 9, size: "sm" as const },
    { startY: "18%", duration: 30, delay: 12, size: "md" as const },
    { startY: "12%", duration: 40, delay: 15, size: "sm" as const },
    { startY: "28%", duration: 36, delay: 18, size: "lg" as const },
    { startY: "8%", duration: 42, delay: 21, size: "md" as const },
    { startY: "20%", duration: 34, delay: 24, size: "sm" as const },
    { startY: "14%", duration: 44, delay: 27, size: "md" as const },
  ], []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map((star, index) => (
        <MovingStar key={index} {...star} />
      ))}
    </div>
  );
}

// Shooting Stars System - fewer shooting stars
function ShootingStars() {
  const shootingStars = useMemo(() => [
    { startY: "8%", duration: 4, delay: 0 },
    { startY: "15%", duration: 5, delay: 15 },
    { startY: "6%", duration: 4.5, delay: 35 },
  ], []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {shootingStars.map((star, index) => (
        <ShootingStar key={index} {...star} />
      ))}
    </div>
  );
}

// Static twinkling stars background
function TwinklingStarsBackground() {
  const stars = useMemo(() => {
    return [...Array(150)].map((_, i) => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 80}%`,
      size: Math.random() * 2.5 + 0.5,
      duration: 1.5 + Math.random() * 4,
      delay: Math.random() * 3,
      opacity: 0.3 + Math.random() * 0.7,
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map((star, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
          }}
          animate={{ 
            opacity: [star.opacity * 0.3, star.opacity, star.opacity * 0.3],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            delay: star.delay,
          }}
        />
      ))}
    </div>
  );
}

// Mountains
function Mountains() {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-48 sm:h-64 pointer-events-none">
      <svg className="absolute bottom-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 1440 200">
        <path
          d="M0 200 L0 120 Q200 60 400 100 Q600 140 800 80 Q1000 20 1200 90 Q1400 160 1440 100 L1440 200 Z"
          fill="#A78BFA"
          opacity="0.3"
        />
      </svg>
      <svg className="absolute bottom-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 1440 200">
        <path
          d="M0 200 L0 150 Q150 100 300 140 Q450 180 600 120 Q750 60 900 110 Q1050 160 1200 100 Q1350 40 1440 130 L1440 200 Z"
          fill="#8B5CF6"
          opacity="0.5"
        />
      </svg>
    </div>
  );
}

// Main Background Component
export function PlayfulBackground({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className={`relative min-h-screen overflow-hidden ${isDark ? 'bg-black' : 'bg-gradient-to-b from-[#87CEEB] via-[#E8F4F8] to-[#FFF8E7]'}`}>
      {/* Background */}
      <div className={`absolute inset-0 transition-colors duration-700 ${
        isDark 
          ? 'bg-black' 
          : 'bg-gradient-to-b from-[#87CEEB] via-[#E8F4F8] to-[#FFF8E7]'
      }`} />
      
      {/* Sun or Moon */}
      {isDark ? <AnimatedMoon /> : <AnimatedSun />}
      
      {/* Day mode elements */}
      {!isDark && (
        <>
          <AnimatedClouds />
          <FlyingBirds />
          <FlyingButterflies />
        </>
      )}
      
      {/* Night mode elements */}
      {isDark && (
        <>
          <TwinklingStarsBackground />
          <NightSkyStars />
          <ShootingStars />
        </>
      )}
      
      {/* Mountains */}
      <div className={isDark ? 'opacity-30' : ''}>
        <Mountains />
      </div>
      
      {/* Main content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

export { AnimatedSun, AnimatedMoon };
