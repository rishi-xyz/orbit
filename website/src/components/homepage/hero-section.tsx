"use client";

import { Badge } from "../ui/badge";
import { ArrowRight, Play } from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";
import { HeroAnimations } from "./hero-animations";
import { useEffect, useRef } from "react";
import gsap from "gsap";

export const HeroSection = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const brandRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctaButtons = Array.from(document.querySelectorAll('.cta-button'));
    const listeners = ctaButtons.map((button) => {
      const onEnter = () => {
        gsap.to(button, { scale: 1.05, duration: 0.2, ease: "power2.out" });
      };
      const onLeave = () => {
        gsap.to(button, { scale: 1, duration: 0.2, ease: "power2.out" });
      };
      button.addEventListener('mouseenter', onEnter);
      button.addEventListener('mouseleave', onLeave);
      return { button, onEnter, onLeave };
    });

    const ctx = gsap.context(() => {
      // CTA button hover effects
    }, heroRef);

    return () => {
      listeners.forEach(({ button, onEnter, onLeave }) => {
        button.removeEventListener('mouseenter', onEnter);
        button.removeEventListener('mouseleave', onLeave);
      });
      ctx.revert();
    };
  }, []);
  return (
    <section ref={heroRef} className="relative overflow-hidden min-h-screen flex items-center">
      {/* Animated Gradients - Server rendered */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,oklch(0.65_0.15_210/0.3)_0%,transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(40%_40%_at_80%_100%,oklch(0.6_0.2_280/0.2)_0%,transparent_60%)]" />
      </div>

      {/* Client-side animations and interactive elements */}
      <HeroAnimations>

        {/* Badge */}
        <div 
          className="hero-badge inline-flex items-center gap-2 rounded-full bg-linear-to-r from-primary/10 via-primary/5 to-primary/10 border border-primary/20 px-6 py-3 text-sm font-medium text-primary backdrop-blur-sm shadow-lg"
        >
          <div className="badge-inner">
            <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5">
              New
            </Badge>
          </div>
          <span>V0.1 Beta is Live</span>
        </div>

        {/* Heading */}
        <h1 ref={headingRef} className="mx-auto max-w-5xl text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-8">
          <span className="block bg-linear-to-br from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
            Next-Generation
          </span>
          <span 
            className="heading-gradient block bg-linear-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent"
            style={{ backgroundSize: "200% 100%" }}
          >
            Trading Infrastructure
          </span>
        </h1>

        {/* Description */}
        <p ref={descriptionRef} className="hero-description mx-auto max-w-3xl text-muted-foreground text-lg md:text-xl mb-16 leading-relaxed">
          Invest in proven strategies, build your own with AI, or automate
          <br className="hidden sm:block" />
          custom workflows — all on one institutional-grade trading platform.
        </p>

        {/* CTA */}
        <div ref={ctaRef} className="cta-container flex flex-col sm:flex-row justify-center gap-4 sm:gap-6">
          <div className="cta-button">
            <Link href={process.env.NEXT_PUBLIC_PLATFORM_LINK || "#"}>
              <Button
                size="lg"
                className="cta-button relative rounded-full px-8 sm:px-12 h-14 sm:h-16 text-base sm:text-lg font-semibold w-full sm:w-auto bg-linear-to-r from-primary via-primary/90 to-primary/80 hover:from-primary/90 hover:via-primary hover:to-primary/90 shadow-xl hover:shadow-2xl transition-all duration-300 border border-primary/20"
              >
                <span>Get Started</span>
                <ArrowRight className="ml-3 h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </Link>
          </div>

          <div className="cta-button">
            <Link href={process.env.NEXT_PUBLIC_PLATFORM_LINK || "#"}>
              <Button
                size="lg"
                variant="outline"
                className="cta-button relative rounded-full px-8 sm:px-12 h-14 sm:h-16 text-base sm:text-lg font-semibold w-full sm:w-auto bg-linear-to-r from-background via-background/50 to-background border-2 border-primary/30 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <span className="flex items-center">
                  <Play className="mr-3 h-4 w-4 sm:h-5 sm:w-5" />
                  Watch Demo
                </span>
              </Button>
            </Link>
          </div>
        </div>
      </HeroAnimations>
    </section>
  );
};
