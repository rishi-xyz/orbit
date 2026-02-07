"use client";

import { ReactNode, useEffect } from "react";
import { useResponsive } from "../hooks/use-responsive";

interface PerformanceOptimizedLayoutProps {
  children: ReactNode;
}

export const PerformanceOptimizedLayout = ({ children }: PerformanceOptimizedLayoutProps) => {
  const { isMobile, isTablet } = useResponsive();

  useEffect(() => {
    // Reduce motion preference for mobile users
    if (isMobile || isTablet) {
      // Add reduced motion class to document
      document.documentElement.classList.add('reduce-motion');
      
      // Disable heavy CSS animations on mobile
      const style = document.createElement('style');
      style.textContent = `
        .reduce-motion * {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
        
        @media (max-width: 768px) {
          .reduce-motion .motion-safe {
            transform: none !important;
            opacity: 1 !important;
          }
        }
      `;
      document.head.appendChild(style);
      
      return () => {
        document.documentElement.classList.remove('reduce-motion');
        document.head.removeChild(style);
      };
    }
  }, [isMobile, isTablet]);

  return <>{children}</>;
};
