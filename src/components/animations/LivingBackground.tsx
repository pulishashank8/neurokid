"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

// Animated floating shapes for background
export function FloatingShapes() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Large soft blobs */}
      <motion.div
        className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(251, 191, 36, 0.12) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
        animate={{
          x: [0, 30, 0],
          y: [0, 50, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      <motion.div
        className="absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(56, 189, 248, 0.1) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
        animate={{
          x: [0, -40, 0],
          y: [0, 30, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      />
      
      <motion.div
        className="absolute -bottom-40 left-1/4 w-[550px] h-[550px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(52, 211, 153, 0.1) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
        animate={{
          x: [0, 50, 0],
          y: [0, -40, 0],
          scale: [1, 1.08, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 4,
        }}
      />
      
      <motion.div
        className="absolute top-1/2 right-1/4 w-[450px] h-[450px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(167, 139, 250, 0.08) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
        animate={{
          x: [0, -30, 0],
          y: [0, -50, 0],
          scale: [1, 1.12, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />
      
      {/* Coral accent blob */}
      <motion.div
        className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(248, 113, 113, 0.08) 0%, transparent 70%)",
          filter: "blur(50px)",
        }}
        animate={{
          x: [0, 40, 0],
          y: [0, 30, 0],
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 19,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 3,
        }}
      />
    </div>
  );
}

// Animated playful characters/illustrations
export function PlayfulCharacters() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Floating stars */}
      <motion.svg
        className="absolute top-[15%] left-[10%] w-8 h-8 text-amber-400"
        viewBox="0 0 24 24"
        fill="currentColor"
        animate={{
          y: [0, -15, 0],
          rotate: [0, 10, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <path d="M12 2L14.09 8.26L20.18 9.27L15.54 13.14L16.82 19.14L12 16.18L7.18 19.14L8.46 13.14L3.82 9.27L9.91 8.26L12 2Z" />
      </motion.svg>
      
      <motion.svg
        className="absolute top-[25%] right-[15%] w-6 h-6 text-coral"
        viewBox="0 0 24 24"
        fill="currentColor"
        animate={{
          y: [0, -12, 0],
          rotate: [0, -15, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
      >
        <path d="M12 2L14.09 8.26L20.18 9.27L15.54 13.14L16.82 19.14L12 16.18L7.18 19.14L8.46 13.14L3.82 9.27L9.91 8.26L12 2Z" />
      </motion.svg>
      
      <motion.svg
        className="absolute bottom-[30%] left-[8%] w-7 h-7 text-mint"
        viewBox="0 0 24 24"
        fill="currentColor"
        animate={{
          y: [0, -18, 0],
          rotate: [0, 12, 0],
          scale: [1, 1.08, 1],
        }}
        transition={{
          duration: 4.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      >
        <path d="M12 2L14.09 8.26L20.18 9.27L15.54 13.14L16.82 19.14L12 16.18L7.18 19.14L8.46 13.14L3.82 9.27L9.91 8.26L12 2Z" />
      </motion.svg>
      
      <motion.svg
        className="absolute bottom-[20%] right-[12%] w-8 h-8 text-sky"
        viewBox="0 0 24 24"
        fill="currentColor"
        animate={{
          y: [0, -14, 0],
          rotate: [0, -8, 0],
          scale: [1, 1.12, 1],
        }}
        transition={{
          duration: 5.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1.5,
        }}
      >
        <path d="M12 2L14.09 8.26L20.18 9.27L15.54 13.14L16.82 19.14L12 16.18L7.18 19.14L8.46 13.14L3.82 9.27L9.91 8.26L12 2Z" />
      </motion.svg>
      
      {/* Sparkles */}
      <motion.svg
        className="absolute top-[40%] left-[20%] w-5 h-5 text-lavender"
        viewBox="0 0 24 24"
        fill="currentColor"
        animate={{
          y: [0, -10, 0],
          opacity: [0.6, 1, 0.6],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.3,
        }}
      >
        <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" />
      </motion.svg>
      
      <motion.svg
        className="absolute top-[60%] right-[25%] w-4 h-4 text-sunny"
        viewBox="0 0 24 24"
        fill="currentColor"
        animate={{
          y: [0, -8, 0],
          opacity: [0.7, 1, 0.7],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 3.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.8,
        }}
      >
        <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" />
      </motion.svg>
      
      {/* Floating hearts */}
      <motion.div
        className="absolute top-[70%] left-[15%]"
        animate={{
          y: [0, -20, 0],
          x: [0, 5, 0],
          opacity: [0.4, 0.8, 0.4],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="#F87171">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
      </motion.div>
      
      <motion.div
        className="absolute top-[35%] right-[8%]"
        animate={{
          y: [0, -15, 0],
          x: [0, -5, 0],
          opacity: [0.3, 0.7, 0.3],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#F472B6">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
      </motion.div>
      
      {/* Butterflies */}
      <motion.div
        className="absolute top-[45%] left-[25%]"
        animate={{
          y: [0, -30, 0],
          x: [0, 20, 0],
          rotate: [0, 10, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <motion.ellipse 
            cx="8" cy="16" rx="6" ry="10" 
            fill="#A78BFA"
            animate={{ rotate: [-20, -10, -20] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            style={{ transformOrigin: "16px 16px" }}
          />
          <motion.ellipse 
            cx="24" cy="16" rx="6" ry="10" 
            fill="#A78BFA"
            animate={{ rotate: [20, 10, 20] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            style={{ transformOrigin: "16px 16px" }}
          />
          <line x1="16" y1="6" x2="16" y2="26" stroke="#7C3AED" strokeWidth="2" />
        </svg>
      </motion.div>
      
      {/* Cloud shapes */}
      <motion.div
        className="absolute top-[10%] right-[30%] opacity-30"
        animate={{
          x: [0, 30, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <svg width="80" height="50" viewBox="0 0 80 50" fill="#E0F2FE">
          <ellipse cx="25" cy="30" rx="20" ry="15" />
          <ellipse cx="45" cy="25" rx="25" ry="18" />
          <ellipse cx="60" cy="32" rx="18" ry="12" />
        </svg>
      </motion.div>
      
      <motion.div
        className="absolute bottom-[15%] left-[30%] opacity-25"
        animate={{
          x: [0, -20, 0],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 3,
        }}
      >
        <svg width="100" height="60" viewBox="0 0 100 60" fill="#FCE7F3">
          <ellipse cx="30" cy="35" rx="25" ry="18" />
          <ellipse cx="55" cy="28" rx="30" ry="22" />
          <ellipse cx="75" cy="38" rx="22" ry="15" />
        </svg>
      </motion.div>
    </div>
  );
}

// Dotted pattern overlay
export function DottedPattern({ className = "" }: { className?: string }) {
  return (
    <div 
      className={`absolute inset-0 opacity-[0.02] pointer-events-none ${className}`}
      style={{
        backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
        backgroundSize: "24px 24px"
      }}
    />
  );
}

// Gradient mesh background
export function GradientMesh() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(at 0% 0%, rgba(251, 191, 36, 0.15) 0px, transparent 50%),
            radial-gradient(at 100% 0%, rgba(56, 189, 248, 0.12) 0px, transparent 50%),
            radial-gradient(at 100% 100%, rgba(52, 211, 153, 0.1) 0px, transparent 50%),
            radial-gradient(at 0% 100%, rgba(167, 139, 250, 0.1) 0px, transparent 50%),
            radial-gradient(at 50% 50%, rgba(248, 113, 113, 0.05) 0px, transparent 50%)
          `,
        }}
      />
    </div>
  );
}

// Main background component
interface LivingBackgroundProps {
  children: ReactNode;
  className?: string;
  showCharacters?: boolean;
  showMesh?: boolean;
}

export function LivingBackground({ 
  children, 
  className = "",
  showCharacters = true,
  showMesh = true,
}: LivingBackgroundProps) {
  return (
    <div className={`relative min-h-screen ${className}`}>
      {showMesh && <GradientMesh />}
      <FloatingShapes />
      {showCharacters && <PlayfulCharacters />}
      <DottedPattern />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
