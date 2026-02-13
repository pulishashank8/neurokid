'use client';

import { motion, AnimatePresence, Variants } from 'framer-motion';
import { ReactNode } from 'react';

// Fade in with slight upward movement
export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

// Fade in with scale
export const fadeInScale: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

// Slide in from left
export const slideInLeft: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

// Slide in from right
export const slideInRight: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

// Stagger children animations
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

// Fast stagger for list items
export const fastStagger: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

// Pulse animation for attention
export const pulse: Variants = {
  initial: { scale: 1 },
  animate: {
    scale: [1, 1.02, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      repeatType: 'reverse',
    },
  },
};

// Shimmer/loading animation
export const shimmer: Variants = {
  initial: { opacity: 0.5 },
  animate: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
    },
  },
};

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  variant?: 'fadeUp' | 'fadeScale' | 'slideLeft' | 'slideRight';
}

export function AnimatedCard({
  children,
  className = '',
  delay = 0,
  variant = 'fadeUp',
}: AnimatedCardProps) {
  const variants = {
    fadeUp: fadeInUp,
    fadeScale: fadeInScale,
    slideLeft: slideInLeft,
    slideRight: slideInRight,
  };

  return (
    <motion.div
      variants={variants[variant]}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface AnimatedListProps {
  children: ReactNode;
  className?: string;
  fast?: boolean;
}

export function AnimatedList({ children, className = '', fast = false }: AnimatedListProps) {
  return (
    <motion.div
      variants={fast ? fastStagger : staggerContainer}
      initial="initial"
      animate="animate"
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface AnimatedItemProps {
  children: ReactNode;
  className?: string;
}

export function AnimatedItem({ children, className = '' }: AnimatedItemProps) {
  return (
    <motion.div
      variants={fadeInUp}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface AnimatedNumberProps {
  value: number;
  className?: string;
  duration?: number;
}

export function AnimatedNumber({ value, className = '', duration = 1 }: AnimatedNumberProps) {
  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={className}
    >
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {value.toLocaleString()}
      </motion.span>
    </motion.span>
  );
}

interface AnimatedPresenceWrapperProps {
  children: ReactNode;
  show: boolean;
}

export function AnimatedPresenceWrapper({ children, show }: AnimatedPresenceWrapperProps) {
  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Page transition wrapper
interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className = '' }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Hover scale effect
export function HoverScale({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Loading skeleton with shimmer
export function SkeletonLoader({ className = '' }: { className?: string }) {
  return (
    <motion.div
      variants={shimmer}
      initial="initial"
      animate="animate"
      className={`bg-slate-700/50 rounded ${className}`}
    />
  );
}
