"use client";

import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
  linkToHome?: boolean;
}

const sizeClasses = {
  sm: { img: 28, text: "text-base" },
  md: { img: 36, text: "text-lg" },
  lg: { img: 48, text: "text-xl" },
  xl: { img: 64, text: "text-2xl" },
};

export default function Logo({ 
  size = "md", 
  showText = true, 
  className = "",
  linkToHome = true 
}: LogoProps) {
  const { img, text } = sizeClasses[size];
  
  const content = (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="relative flex-shrink-0 rounded-xl overflow-hidden shadow-lg shadow-emerald-500/20">
        <Image
          src="/logo-icon.png"
          alt="NeuroKid Logo"
          width={img}
          height={img}
          className="object-contain"
          priority
        />
      </div>
      {showText && (
        <span className={`font-bold ${text} bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent`}>
          NeuroKid
        </span>
      )}
    </div>
  );

  if (linkToHome) {
    return (
      <Link href="/" className="hover:opacity-90 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}
