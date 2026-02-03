"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ReactNode, useRef } from "react";
import Link from "next/link";

interface BentoCardProps {
  children: ReactNode;
  className?: string;
  size?: "small" | "medium" | "large" | "wide" | "tall";
  accent?: "coral" | "sky" | "mint" | "lavender" | "sunny" | "none";
  hover?: boolean;
  onClick?: () => void;
  href?: string;
}

const sizeClasses = {
  small: "",
  medium: "",
  large: "sm:col-span-2 sm:row-span-2",
  wide: "sm:col-span-2",
  tall: "sm:row-span-2",
};

const accentClasses = {
  coral: "border-l-4 border-l-[#F87171]",
  sky: "border-l-4 border-l-[#38BDF8]",
  mint: "border-l-4 border-l-[#34D399]",
  lavender: "border-l-4 border-l-[#A78BFA]",
  sunny: "border-l-4 border-l-[#FBBF24]",
  none: "",
};

export function BentoCard({
  children,
  className = "",
  size = "small",
  accent = "none",
  hover = true,
  onClick,
  href,
}: BentoCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });
  
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["5deg", "-5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-5deg", "5deg"]);
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    
    x.set(xPct);
    y.set(yPct);
  };
  
  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };
  
  const cardContent = (
    <motion.div
      ref={ref}
      onMouseMove={hover ? handleMouseMove : undefined}
      onMouseLeave={hover ? handleMouseLeave : undefined}
      style={{
        rotateX: hover ? rotateX : 0,
        rotateY: hover ? rotateY : 0,
        transformStyle: "preserve-3d",
      }}
      whileHover={hover ? { 
        scale: 1.02,
        transition: { duration: 0.3, ease: "easeOut" }
      } : undefined}
      whileTap={hover ? { scale: 0.98 } : undefined}
      className={`
        relative bg-white dark:bg-[#1C1917] 
        rounded-3xl p-6 sm:p-8
        shadow-[0_4px_20px_rgba(0,0,0,0.08)]
        dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]
        border border-[#E7E5E4] dark:border-[#44403C]
        transition-shadow duration-300
        hover:shadow-[0_20px_40px_rgba(0,0,0,0.12)]
        dark:hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]
        overflow-hidden
        ${sizeClasses[size]}
        ${accentClasses[accent]}
        ${className}
      `}
      onClick={onClick}
    >
      {/* Shine effect on hover */}
      <motion.div
        className="absolute inset-0 opacity-0 pointer-events-none"
        style={{
          background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.5) 50%, transparent 60%)",
          transform: "translateX(-100%)",
        }}
        whileHover={{
          opacity: 1,
          x: "200%",
          transition: { duration: 0.8, ease: "easeOut" },
        }}
      />
      
      {/* Top gradient line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#F26B3A] via-[#FBBF24] to-[#2DD4BF] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative z-10 h-full">
        {children}
      </div>
    </motion.div>
  );
  
  if (href) {
    return (
      <Link href={href} className="block h-full">
        {cardContent}
      </Link>
    );
  }
  
  return cardContent;
}

// Feature card with icon and description
interface FeatureBentoCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  href: string;
  accent?: "coral" | "sky" | "mint" | "lavender" | "sunny";
  size?: "small" | "medium" | "large" | "wide";
  className?: string;
}

const accentBgClasses = {
  coral: "bg-[#FEF2F2] text-[#F87171] dark:bg-[#450A0A]/30",
  sky: "bg-[#F0F9FF] text-[#38BDF8] dark:bg-[#082F49]/30",
  mint: "bg-[#F0FDF4] text-[#34D399] dark:bg-[#052E16]/30",
  lavender: "bg-[#FAF5FF] text-[#A78BFA] dark:bg-[#3B0764]/30",
  sunny: "bg-[#FFFBEB] text-[#FBBF24] dark:bg-[#451A03]/30",
};

export function FeatureBentoCard({
  icon,
  title,
  description,
  href,
  accent = "coral",
  size = "small",
  className = "",
}: FeatureBentoCardProps) {
  return (
    <BentoCard href={href} size={size} accent={accent} className={className}>
      <div className="flex flex-col h-full">
        <motion.div 
          className={`w-14 h-14 rounded-2xl ${accentBgClasses[accent]} flex items-center justify-center mb-4`}
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ duration: 0.2 }}
        >
          {icon}
        </motion.div>
        
        <h3 className="text-xl font-bold text-[#1C1917] dark:text-[#FAFAF9] mb-2">
          {title}
        </h3>
        
        <p className="text-[#78716C] dark:text-[#A8A29E] text-sm leading-relaxed flex-grow">
          {description}
        </p>
        
        <motion.div 
          className="mt-4 flex items-center gap-2 text-sm font-semibold"
          style={{ color: accent === "coral" ? "#F87171" : accent === "sky" ? "#38BDF8" : accent === "mint" ? "#34D399" : accent === "lavender" ? "#A78BFA" : "#FBBF24" }}
          initial={{ x: 0 }}
          whileHover={{ x: 5 }}
        >
          <span>Explore</span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.div>
      </div>
    </BentoCard>
  );
}

// Stats card
interface StatsBentoCardProps {
  value: string;
  label: string;
  trend?: string;
  trendUp?: boolean;
  size?: "small" | "medium" | "large";
  className?: string;
}

export function StatsBentoCard({
  value,
  label,
  trend,
  trendUp = true,
  size = "small",
  className = "",
}: StatsBentoCardProps) {
  return (
    <BentoCard size={size} className={className}>
      <div className="flex flex-col h-full justify-between">
        <div>
          <motion.div 
            className="text-4xl sm:text-5xl font-black text-[#1C1917] dark:text-[#FAFAF9] mb-2"
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.175, 0.885, 0.32, 1.275] }}
            viewport={{ once: true }}
          >
            {value}
          </motion.div>
          <p className="text-[#78716C] dark:text-[#A8A29E] font-medium">{label}</p>
        </div>
        
        {trend && (
          <div className={`mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${
            trendUp 
              ? "bg-[#F0FDF4] text-[#16A34A] dark:bg-[#052E16]/30" 
              : "bg-[#FEF2F2] text-[#DC2626] dark:bg-[#450A0A]/30"
          }`}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path 
                d={trendUp ? "M8 4L12 8H4L8 4Z" : "M8 12L4 8H12L8 12Z"} 
                fill="currentColor"
              />
            </svg>
            {trend}
          </div>
        )}
      </div>
    </BentoCard>
  );
}

// Image card
interface ImageBentoCardProps {
  image: string;
  title?: string;
  description?: string;
  href?: string;
  size?: "small" | "medium" | "large" | "wide" | "tall";
  className?: string;
}

export function ImageBentoCard({
  image,
  title,
  description,
  href,
  size = "small",
  className = "",
}: ImageBentoCardProps) {
  return (
    <BentoCard href={href} size={size} className={`p-0 overflow-hidden ${className}`}>
      <div className="relative h-full min-h-[200px]">
        <motion.img
          src={image}
          alt={title || ""}
          className="absolute inset-0 w-full h-full object-cover"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.4 }}
        />
        {(title || description) && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex flex-col justify-end p-6">
            {title && (
              <h3 className="text-xl font-bold text-white mb-1">{title}</h3>
            )}
            {description && (
              <p className="text-white/80 text-sm">{description}</p>
            )}
          </div>
        )}
      </div>
    </BentoCard>
  );
}

// Quote card
interface QuoteBentoCardProps {
  quote: string;
  author?: string;
  size?: "small" | "medium" | "large" | "wide";
  className?: string;
}

export function QuoteBentoCard({
  quote,
  author,
  size = "small",
  className = "",
}: QuoteBentoCardProps) {
  return (
    <BentoCard size={size} accent="sunny" className={`bg-gradient-to-br from-[#FFFBEB] to-[#FEF3C7] dark:from-[#451A03]/20 dark:to-[#78350F]/20 ${className}`}>
      <div className="flex flex-col h-full justify-between">
        <svg className="w-10 h-10 text-[#FBBF24] mb-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
        </svg>
        
        <p className="text-[#1C1917] dark:text-[#FAFAF9] text-lg font-medium leading-relaxed italic mb-4">
          &ldquo;{quote}&rdquo;
        </p>
        
        {author && (
          <p className="text-[#78716C] dark:text-[#A8A29E] text-sm font-semibold">
            — {author}
          </p>
        )}
      </div>
    </BentoCard>
  );
}

// Bento grid container
interface BentoGridProps {
  children: ReactNode;
  className?: string;
  columns?: 2 | 3 | 4;
}

export function BentoGrid({ children, className = "", columns = 3 }: BentoGridProps) {
  const columnClasses = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  };
  
  return (
    <div className={`grid ${columnClasses[columns]} gap-4 sm:gap-6 ${className}`}>
      {children}
    </div>
  );
}
