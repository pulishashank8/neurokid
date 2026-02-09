/**
 * OptimizedImage Component
 * 
 * A wrapper around Next.js Image component with:
 * - Automatic WebP/AVIF format selection
 * - Lazy loading
 * - Proper sizing and aspect ratio
 * - Fallback for errors
 * - Blur placeholder support
 * 
 * Usage:
 *   <OptimizedImage
 *     src="/path/to/image.jpg"
 *     alt="Description"
 *     width={800}
 *     height={600}
 *   />
 */

"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  containerClassName?: string;
  priority?: boolean;
  sizes?: string;
  quality?: number;
  placeholder?: "blur" | "empty";
  blurDataURL?: string;
  aspectRatio?: string;
  objectFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
  onLoad?: () => void;
  onError?: () => void;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className,
  containerClassName,
  priority = false,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  quality = 80,
  placeholder = "empty",
  blurDataURL,
  aspectRatio,
  objectFit = "cover",
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

  // Error fallback
  if (hasError) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg",
          containerClassName
        )}
        style={{
          width: fill ? "100%" : width,
          height: fill ? "100%" : height,
          aspectRatio: aspectRatio,
        }}
      >
        <span className="text-gray-400 text-sm">Failed to load image</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden",
        isLoading && "animate-pulse bg-gray-200 dark:bg-gray-700",
        containerClassName
      )}
      style={{
        aspectRatio: aspectRatio,
      }}
    >
      <Image
        src={src}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        className={cn(
          "transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100",
          objectFit === "cover" && "object-cover",
          objectFit === "contain" && "object-contain",
          objectFit === "fill" && "object-fill",
          objectFit === "none" && "object-none",
          objectFit === "scale-down" && "object-scale-down",
          className
        )}
        priority={priority}
        sizes={sizes}
        quality={quality}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        onLoad={handleLoad}
        onError={handleError}
        // Enable modern formats
        unoptimized={false}
      />
    </div>
  );
}

/**
 * Avatar Image Component
 * Optimized for user avatars with fallback
 */
export function AvatarImage({
  src,
  alt,
  size = 40,
  className,
}: {
  src?: string | null;
  alt: string;
  size?: number;
  className?: string;
}) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        className={cn(
          "rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium",
          className
        )}
        style={{ width: size, height: size }}
      >
        {alt.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={cn("rounded-full object-cover", className)}
      onError={() => setHasError(true)}
      priority={size <= 64} // Priority load for small avatars
    />
  );
}

/**
 * Post Image Gallery Component
 * Optimized for post image galleries
 */
export function PostImageGallery({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  if (images.length === 0) return null;

  if (images.length === 1) {
    return (
      <OptimizedImage
        src={images[0]}
        alt={alt}
        width={800}
        height={600}
        className="rounded-lg"
        sizes="(max-width: 768px) 100vw, 800px"
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {images.slice(0, 4).map((image, index) => (
        <div
          key={index}
          className={cn(
            "relative",
            images.length === 3 && index === 0 && "col-span-2"
          )}
        >
          <OptimizedImage
            src={image}
            alt={`${alt} - ${index + 1}`}
            fill
            aspectRatio="1/1"
            className="rounded-lg"
            sizes="(max-width: 768px) 50vw, 400px"
          />
          {index === 3 && images.length > 4 && (
            <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center text-white text-xl font-bold">
              +{images.length - 4}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
