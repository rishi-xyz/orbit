"use client";

import Link from "next/link";
import { Button } from "../ui/button";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ArrowRight, Zap, Star, Rocket, TrendingUp, Sparkles } from "lucide-react";

export const CTASection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const sparkleListeners: Array<{
      el: Element;
      onEnter: () => void;
      onLeave: () => void;
    }> = [];

    const buttonListeners: Array<{
      el: Element;
      onEnter: () => void;
      onLeave: () => void;
      onDown: () => void;
      onUp: () => void;
    }> = [];

    const ctx = gsap.context(() => {
      // Parallax effect for background elements
      gsap.to('.cta-bg-1', {
        yPercent: -25,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 1.5
        }
      });

      gsap.to('.cta-bg-2', {
        yPercent: -15,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 2
        }
      });

      // Floating animation for decorative elements
      gsap.to('.cta-sparkle-1', {
        y: -20,
        rotation: 180,
        duration: 6,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut"
      });

      gsap.to('.cta-sparkle-2', {
        y: -15,
        rotation: -180,
        duration: 5,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut",
        delay: 1
      });

      gsap.to('.cta-sparkle-3', {
        y: -25,
        rotation: 360,
        duration: 7,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut",
        delay: 2
      });

      // Pulse effect for CTA button
      gsap.to('.cta-pulse', {
        scale: 1.05,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut"
      });

      // Glow effect animation
      gsap.to('.cta-glow', {
        opacity: "0.3, 0.6, 0.3",
        scale: "1, 1.1, 1",
        duration: 5,
        repeat: -1,
        ease: "power1.inOut"
      });

      // Animated background gradients
      const gradientBg = sectionRef.current?.querySelector('.animated-gradient');
      if (gradientBg) {
        gsap.to(gradientBg, {
          background: "radial-gradient(circle at 30% 70%, rgba(120, 119, 198, 0.04) 0%, transparent 50%), radial-gradient(circle at 70% 30%, rgba(255, 119, 198, 0.04) 0%, transparent 50%), radial-gradient(circle at 50% 50%, rgba(120, 219, 255, 0.04) 0%, transparent 50%), radial-gradient(circle at 30% 70%, rgba(120, 119, 198, 0.04) 0%, transparent 50%)",
          duration: 15,
          repeat: -1,
          ease: "linear"
        });
      }

      // Scroll-based animations
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top end",
          end: "bottom start",
          scrub: 1
        }
      });

      scrollTl
        .to('.cta-container', { y: 50, duration: 0.3 })
        .to('.cta-container', { y: 0, duration: 0.3 })
        .to('.cta-container', { scale: 0.95, duration: 0.2 })
        .to('.cta-container', { scale: 1.02, duration: 0.2 })
        .to('.cta-container', { scale: 1, duration: 0.1 })
        .to('.cta-container', { opacity: 0.9, duration: 0.1 })
        .to('.cta-container', { opacity: 1, duration: 0.1 });

      // Shimmer effects
      gsap.to('.shimmer-primary-cta', {
        x: "-100%, 200%",
        duration: 2,
        repeat: -1,
        ease: "linear"
      });

      gsap.to('.shimmer-secondary-cta', {
        x: "-100%, 200%",
        duration: 2.5,
        repeat: -1,
        ease: "linear"
      });

      // Gradient text animations
      gsap.to('.gradient-text-1', {
        backgroundPosition: "0% 50%, 100% 50%, 0% 50%",
        duration: 8,
        repeat: -1,
        ease: "linear"
      });

      gsap.to('.gradient-text-2', {
        backgroundPosition: "0% 50%, 100% 50%, 0% 50%",
        duration: 10,
        repeat: -1,
        ease: "linear"
      });

      // Arrow animation
      gsap.to('.cta-arrow', {
        x: 5,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "easeInOut"
      });

      // Hover effects for decorative elements
      const sparkles = sectionRef.current?.querySelectorAll('.cta-sparkle');
      sparkles?.forEach(sparkle => {
        const onEnter = () => {
          gsap.to(sparkle, { scale: 1.2, duration: 0.2 });
        };
        const onLeave = () => {
          gsap.to(sparkle, { scale: 1, duration: 0.2 });
        };

        sparkle.addEventListener('mouseenter', onEnter);
        sparkle.addEventListener('mouseleave', onLeave);
        sparkleListeners.push({ el: sparkle, onEnter, onLeave });
      });

      // Button hover effects
      const ctaButtons = sectionRef.current?.querySelectorAll('.cta-button-wrapper');
      ctaButtons?.forEach(button => {
        const onEnter = () => {
          gsap.to(button, { scale: 1.05, y: -2, duration: 0.2, ease: "power2.out" });
        };
        const onLeave = () => {
          gsap.to(button, { scale: 1, y: 0, duration: 0.2, ease: "power2.out" });
        };
        const onDown = () => {
          gsap.to(button, { scale: 0.98, duration: 0.1 });
        };
        const onUp = () => {
          gsap.to(button, { scale: 1.05, duration: 0.1 });
        };

        button.addEventListener('mouseenter', onEnter);
        button.addEventListener('mouseleave', onLeave);
        button.addEventListener('mousedown', onDown);
        button.addEventListener('mouseup', onUp);
        buttonListeners.push({ el: button, onEnter, onLeave, onDown, onUp });
      });

      // Initial animations
      const tl = gsap.timeline();
      tl.fromTo('.cta-heading', { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" })
        .fromTo('.cta-description', { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 0.8, delay: 0.2, ease: "power2.out" }, "-=0.6")
        .fromTo('.cta-buttons', { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 0.8, delay: 0.4, ease: "power2.out" }, "-=0.6");

    }, sectionRef);

    return () => {
      sparkleListeners.forEach(({ el, onEnter, onLeave }) => {
        el.removeEventListener('mouseenter', onEnter);
        el.removeEventListener('mouseleave', onLeave);
      });
      buttonListeners.forEach(({ el, onEnter, onLeave, onDown, onUp }) => {
        el.removeEventListener('mouseenter', onEnter);
        el.removeEventListener('mouseleave', onLeave);
        el.removeEventListener('mousedown', onDown);
        el.removeEventListener('mouseup', onUp);
      });
      ctx.revert();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative py-32 overflow-hidden border-t border-border/20 bg-linear-to-b from-background via-background/95 to-background/90"
    >
      {/* Animated background gradients */}
      <div className="absolute inset-0 -z-10">
        <div className="cta-bg-1 absolute inset-0 bg-[radial-gradient(40%_40%_at_50%_50%,oklch(0.65_0.15_210/0.08)_0%,transparent_70%)]" />
        <div className="cta-bg-2 absolute inset-0 bg-[radial-gradient(25%_25%_at_80%_20%,oklch(0.6_0.2_280/0.05)_0%,transparent_60%)]" />
        <div className="animated-gradient absolute inset-0" />
      </div>

      {/* Floating decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="cta-sparkle cta-sparkle-1 absolute top-20 left-10 text-primary/30 cursor-pointer"
        >
          <Sparkles className="w-8 h-8" />
        </div>
        <div
          className="cta-sparkle cta-sparkle-2 absolute top-40 right-20 text-primary/20 cursor-pointer"
        >
          <Star className="w-6 h-6" />
        </div>
        <div
          className="cta-sparkle cta-sparkle-3 absolute bottom-40 left-20 text-primary/25 cursor-pointer"
        >
          <Zap className="w-7 h-7" />
        </div>
      </div>

      <div ref={containerRef} className="cta-container mx-auto max-w-6xl px-6 lg:px-8">
        <div className="text-center">
          {/* Main heading with gradient text */}
          <h2 className="cta-heading text-3xl md:text-4xl lg:text-5xl font-bold bg-linear-to-b from-foreground to-foreground/60 bg-clip-text text-transparent mb-6 leading-tight">
            <span
              className="gradient-text-1 block bg-linear-to-r from-primary via-primary/60 to-primary bg-size-[200%_100%] bg-clip-text text-transparent"
              style={{ backgroundSize: "200% 100%" }}
            >
              Build, invest, and automate
            </span>
            <span
              className="gradient-text-2 block bg-linear-to-r from-foreground via-foreground/80 to-foreground bg-size-[200%_100%] bg-clip-text text-transparent"
              style={{ backgroundSize: "200% 100%" }}
            >
              faster than ever
            </span>
          </h2>

          {/* Description with enhanced styling */}
          <p className="cta-description mx-auto max-w-3xl text-muted-foreground/80 text-lg md:text-xl leading-relaxed mb-12">
            Join professional traders and funds using AutoTrade to power next‑gen trading strategies with enterprise‑grade infrastructure.
          </p>

          {/* CTA Buttons with enhanced effects */}
          <div className="cta-buttons flex flex-col sm:flex-row gap-6 justify-center items-center">
            {/* Glow effect behind primary button */}
            <div className="relative">
              <div className="cta-glow absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
              <div className="cta-button-wrapper">
                <Link href={process.env.NEXT_PUBLIC_PLATFORM_LINK || "#"}>
                  <Button
                    size="lg"
                    className="cta-pulse relative rounded-full px-8 sm:px-12 h-14 sm:h-16 text-base sm:text-lg font-semibold w-full sm:w-auto bg-linear-to-r from-primary via-primary/90 to-primary/80 hover:from-primary/90 hover:via-primary hover:to-primary/90 shadow-xl hover:shadow-2xl transition-all duration-300 border border-primary/20 overflow-hidden"
                  >
                    <div className="shimmer-primary-cta absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -skew-x-12" />
                    <span className="relative z-10 flex items-center gap-3">
                      <Rocket className="w-4 h-4 sm:w-5 sm:h-5" />
                      Get Started Now
                      <div className="cta-arrow">
                        <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                      </div>
                    </span>
                  </Button>
                </Link>
              </div>
            </div>

            {/* Secondary button */}
            <div className="cta-button-wrapper">
              <Link href={process.env.NEXT_PUBLIC_PLATFORM_LINK || "#"}>
                <Button
                  size="lg"
                  variant="outline"
                  className="relative rounded-full px-8 sm:px-12 h-14 sm:h-16 text-base sm:text-lg font-semibold w-full sm:w-auto bg-linear-to-r from-background via-background/50 to-background border-2 border-primary/30 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 shadow-lg hover:shadow-xl overflow-hidden"
                >
                  <div className="shimmer-secondary-cta absolute inset-0 bg-linear-to-r from-transparent via-primary/10 to-transparent -skew-x-12" />
                  <span className="relative z-10 flex items-center gap-3">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                    View Demo
                  </span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};