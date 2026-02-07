"use client";

import { features } from "@/src/lib/features";
import Image from "next/image";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export const FeatureSection = () => {
  // const [activeFeature, setActiveFeature] = useState(0); // Removed activeFeature state

  const [isDesktopActive, setIsDesktopActive] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [fixedStyle, setFixedStyle] = useState<CSSProperties>({});
  const sectionRef = useRef<HTMLElement | null>(null);
  const rightColRef = useRef<HTMLDivElement | null>(null);



  useEffect(() => {
    setIsMounted(true);

    const scroller = document.documentElement.dataset.smoothScroll
      ? "#smooth-wrapper"
      : undefined;

    const triggers: ScrollTrigger[] = [];

    // Create scroll triggers for feature detection
    // Removed per-feature scroll triggers as we now use a single static image for all features


    if (sectionRef.current) {
      const sectionTrigger = ScrollTrigger.create({
        trigger: sectionRef.current,
        scroller,
        start: "top top",
        end: "bottom bottom",
        onEnter: () => setIsDesktopActive(true),
        onEnterBack: () => setIsDesktopActive(true),
        onLeave: () => setIsDesktopActive(false),
        onLeaveBack: () => setIsDesktopActive(false),
      });
      triggers.push(sectionTrigger);
    }

    const updateFixedStyle = () => {
      // Only relevant for md+ layout
      if (typeof window === "undefined") return;
      if (!rightColRef.current) return;

      const rect = rightColRef.current.getBoundingClientRect();
      const maxHeight = Math.min(640, Math.max(420, window.innerHeight - 180));
      const top = Math.max(96, Math.round((window.innerHeight - maxHeight) / 2));

      setFixedStyle({
        position: "fixed",
        left: Math.round(rect.left),
        width: Math.round(rect.width),
        top,
        height: maxHeight,
        zIndex: 50,
        pointerEvents: "none",
      });
    };

    updateFixedStyle();
    window.addEventListener("resize", updateFixedStyle);

    // Refresh after mount and after ScrollSmoother/Lenis do their first layout pass
    const refreshTimer = window.setTimeout(() => {
      updateFixedStyle();
      ScrollTrigger.refresh();
    }, 150);

    return () => {
      window.removeEventListener("resize", updateFixedStyle);
      window.clearTimeout(refreshTimer);
      triggers.forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="features-section"
      className="relative py-20 md:py-32 bg-linear-to-b from-background via-background/50 to-background"
    >
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(30%_30%_at_70%_30%,oklch(0.6_0.15_210/0.03)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(20%_20%_at_30%_70%,oklch(0.65_0.1_280/0.02)_0%,transparent_50%)]" />
        <div className="absolute inset-0 opacity-[0.25] [mask-image:radial-gradient(ellipse_at_center,black_55%,transparent_85%)] bg-[linear-gradient(to_right,oklch(0.75_0_0/0.12)_1px,transparent_1px),linear-gradient(to_bottom,oklch(0.75_0_0/0.12)_1px,transparent_1px)] bg-[size:56px_56px]" />
      </div>

      {/* Header */}
      <div className="text-center mb-20 md:mb-32 px-6">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
          <span className="bg-linear-to-br from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
            A Complete Trading Platform
          </span>
        </h2>
        <p className="mx-auto max-w-3xl text-muted-foreground/80 text-lg md:text-xl leading-relaxed">
          From idea to execution — everything you need to deploy profitable strategies at scale.
        </p>
      </div>

      {/* Desktop Layout */}
      <div className="features-desktop-layout hidden md:block max-w-7xl mx-auto px-6">
        <div className="flex gap-16 lg:gap-20">
          {/* LEFT — Scrollable Text */}
          <div className="w-5/12 flex flex-col gap-40">
            {features.map((feature, index) => (
              <div
                key={index}
                className="min-h-[70vh] flex flex-col justify-center space-y-6"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-linear-to-br from-primary/10 to-primary/5 flex items-center justify-center border border-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground/70 uppercase tracking-wider">
                    {feature.heading}
                  </span>
                </div>

                <h3 className="text-2xl font-semibold text-foreground leading-tight">
                  {feature.title}
                </h3>

                <p className="text-base text-muted-foreground/80 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>

          {/* RIGHT — Sticky Image (rendered via portal) */}
          <div ref={rightColRef} className="w-7/12">
            <div className="h-[640px]" />
          </div>
        </div>
      </div>

      {isMounted &&
        isDesktopActive &&
        createPortal(
          <div className="hidden md:block" style={fixedStyle}>
            <div className="relative w-full h-full rounded-3xl overflow-hidden bg-linear-to-br from-primary/10 via-background/20 to-background/0">
              <div className="absolute inset-0 bg-[radial-gradient(40%_35%_at_65%_35%,oklch(0.65_0.15_210/0.18)_0%,transparent_55%)]" />
              <div className="absolute inset-0 opacity-[0.35] [mask-image:radial-gradient(ellipse_at_center,black_45%,transparent_85%)] bg-[linear-gradient(to_right,oklch(0.75_0_0/0.10)_1px,transparent_1px),linear-gradient(to_bottom,oklch(0.75_0_0/0.10)_1px,transparent_1px)] bg-[size:48px_48px]" />
              <Image
                src="/features.png"
                alt="Feature"
                width={900}
                height={700}
                className="relative w-full h-full object-contain p-12"
                loading="lazy"
                sizes="(min-width: 1024px) 58vw, (min-width: 768px) 58vw, 100vw"
              />
            </div>
          </div>,
          document.body
        )}

      {/* Mobile Layout (unchanged) */}
      <div className="md:hidden">
        <div className="px-6 mb-12">
          <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden bg-linear-to-br from-primary/10 via-background/20 to-background/0 border border-primary/10">
            <div className="absolute inset-0 bg-[radial-gradient(40%_35%_at_65%_35%,oklch(0.65_0.15_210/0.18)_0%,transparent_55%)]" />
            <Image
              src="/dashboard.png"
              alt="Platform Dashboard"
              width={900}
              height={700}
              className="w-full h-full object-contain p-8"
              loading="lazy"
              sizes="100vw"
            />
          </div>
        </div>

        {features.map((feature, index) => (
          <div key={index} className="py-8 px-6 border-b border-border/5 last:border-0">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-linear-to-br from-primary/10 to-primary/5 flex items-center justify-center border border-primary/10">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <span className="text-sm font-medium text-muted-foreground/70 uppercase tracking-wider">
                  {feature.heading}
                </span>
              </div>

              <h3 className="text-xl font-semibold text-foreground">
                {feature.title}
              </h3>

              <p className="text-muted-foreground/80">
                {feature.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
