"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
// @ts-ignore
import LiquidBackground from "threejs-components/build/backgrounds/liquid1.min.js";
import { useResponsive } from "../../hooks/use-responsive";

interface HeroAnimationsProps {
  children: React.ReactNode;
}

export const HeroAnimations = ({ children }: HeroAnimationsProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { isLargeScreen, shouldReduceMotion, shouldDisableEffects } = useResponsive();

  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      // Skip GSAP animations on mobile for performance
      if (shouldReduceMotion) return;
      
      // Scroll-based parallax effects
      if (!shouldDisableEffects && containerRef.current) {
        const scrollTl = gsap.timeline({
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: 1
          }
        });

        scrollTl
          .to(containerRef.current, { y: -100, duration: 0.3 })
          .to(containerRef.current, { y: 0, duration: 0.3 })
          .to(containerRef.current, { scale: 0.8, duration: 0.2 })
          .to(containerRef.current, { scale: 1, duration: 0.2 })
          .to(containerRef.current, { opacity: 0, duration: 0.1 })
          .to(containerRef.current, { opacity: 1, duration: 0.1 });
      }

      // Initial staggered animations for children
      const children = containerRef.current?.querySelectorAll('.hero-child');
      if (children && children.length > 0) {
        const tl = gsap.timeline();
        children.forEach((child, index) => {
          tl.fromTo(child, 
            { opacity: 0, scale: 0.8 },
            { opacity: 1, scale: 1, duration: 0.8, ease: "back.out(1.7)" },
            index * 0.2
          );
        });
      }

    }, containerRef);

    return () => ctx.revert();
  }, [shouldReduceMotion, shouldDisableEffects]);

  /* ---------------- LIQUID BACKGROUND ---------------- */
  useEffect(() => {
    // Only initialize liquid background on large screens (desktop)
    if (!isLargeScreen || !canvasRef.current) return;

    const liquid = LiquidBackground(canvasRef.current);

    liquid.loadImage("/bg-white.png");
    liquid.liquidPlane.material.metalness = 0.75;
    liquid.liquidPlane.material.roughness = 0.25;
    liquid.liquidPlane.uniforms.displacementScale.value = 5;
    liquid.setRain(false);

    return () => {
      liquid?.dispose?.();
    };
  }, [isLargeScreen]);

  // Convert children to array and wrap with classes for GSAP targeting
  const childArray = Array.isArray(children) ? children : [children];

  return (
    <>
      {/* Three.js Canvas - Only on large screens (desktop) */}
      {isLargeScreen && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 -z-20 w-full h-full"
        />
      )}


      <div
        ref={containerRef}
        className="hero-child mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32 text-center w-full"
      >
        {/* Wrap each child with hero-child class for GSAP targeting */}
        {childArray.map((child, index) => (
          <div key={index} className="hero-child">
            {child}
          </div>
        ))}
      </div>
    </>
  );
};
