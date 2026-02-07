'use client';

import { useEffect, useRef, ReactNode } from 'react';
import Lenis from '@studio-freight/lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';

gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

export default function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const tickerFnRef = useRef<((time: number) => void) | null>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    const isSmallScreen = window.matchMedia('(max-width: 768px)').matches;

    // Keep native scrolling on small screens / reduced motion for responsiveness and performance.
    if (prefersReducedMotion || isSmallScreen) {
      return;
    }

    document.documentElement.dataset.smoothScroll = 'true';

    // Initialize Lenis
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    lenisRef.current = lenis;

    // Sync Lenis with GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    const tickerFn = (time: number) => {
      lenis.raf(time * 1000);
    };
    tickerFnRef.current = tickerFn;
    gsap.ticker.add(tickerFn);

    gsap.ticker.lagSmoothing(0);

    // Initialize ScrollSmoother with enhanced settings
    const smoother = ScrollSmoother.create({
      smooth: -0.4,
      effects: true,
      smoothTouch: 0.1,
      wrapper: "#smooth-wrapper",
      content: "#smooth-content",
      ignoreMobileResize: true,
    });

    smoother.effects("img",{speed : "auto"});

    // Ensure ScrollTrigger uses the smooth wrapper as the scroller by default.
    ScrollTrigger.defaults({ scroller: "#smooth-wrapper" });

    // Refresh ScrollTrigger on load
    ScrollTrigger.refresh();

    // Cleanup
    return () => {
      lenis.destroy();
      smoother.kill();

      // Detach Lenis <-> ScrollTrigger bridge and ticker.
      // (Lenis supports off() in current versions.)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (lenis as any).off?.('scroll', ScrollTrigger.update);

      if (tickerFnRef.current) {
        gsap.ticker.remove(tickerFnRef.current);
        tickerFnRef.current = null;
      }

      delete document.documentElement.dataset.smoothScroll;
    };
  }, []);

  return (
    <div id="smooth-wrapper">
        {children}
    </div>
  );
}