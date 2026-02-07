"use client";

import Image, { ImageProps } from "next/image";
import { useState } from "react";
import { useResponsive } from "../hooks/use-responsive";

interface OptimizedImageProps extends Omit<ImageProps, 'loading'> {
  fallbackSrc?: string;
}

export const OptimizedImage = ({ 
  src, 
  alt, 
  fallbackSrc = "/placeholder.png", 
  priority = false,
  ...props 
}: OptimizedImageProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const { isMobile } = useResponsive();

  // Auto-disable priority on mobile for performance
  const shouldPriority = priority && !isMobile;

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  if (hasError && fallbackSrc) {
    return (
      <Image
        src={fallbackSrc}
        alt={alt}
        loading="lazy"
        {...props}
      />
    );
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-lg" />
      )}
      <Image
        src={src}
        alt={alt}
        loading={shouldPriority ? "eager" : "lazy"}
        priority={shouldPriority}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
    </div>
  );
};
