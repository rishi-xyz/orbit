"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Monitor, TrendingUp, BarChart3, Activity, Zap, ArrowRight } from "lucide-react";
import { Button } from "../ui/button";
import Link from "next/link";

gsap.registerPlugin(ScrollTrigger);

export const DashboardSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldRefreshRef = useRef(false);
  
  // Resize variables for super responsiveness
  let resizeTimeout: NodeJS.Timeout;
  let debouncedResize: () => void;

  useEffect(() => {
    if (!sectionRef.current) return;

    const scroller = document.documentElement.dataset.smoothScroll
      ? "#smooth-wrapper"
      : undefined;

    const ctx = gsap.context(() => {
      // Subtle parallax effect for background elements
      gsap.to('.dashboard-bg-1', {
        yPercent: -20,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          scroller,
          start: "top bottom",
          end: "bottom top",
          scrub: 3
        }
      });

      gsap.to('.dashboard-bg-2', {
        yPercent: -15,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          scroller,
          start: "top center", // Changed from "top bottom" to "top center"
          end: "bottom top",
          scrub: 3.5
        }
      });

      // Scroll-based animations for dashboard - smooth scaling when image reaches center
      const getTargetScale = () => {
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const targetWidth = screenWidth - 100; // Increased margin from 15px to 100px
        const targetHeight = screenHeight - 100; // Increased margin from 15px to 100px
        
        // Get current image dimensions (assuming it starts at 1200x800)
        const currentWidth = 1200;
        const currentHeight = 800;
        
        // Calculate scale needed
        const scaleX = targetWidth / currentWidth;
        const scaleY = targetHeight / currentHeight;
        
        // Use the smaller scale to ensure both dimensions fit
        return Math.min(scaleX, scaleY);
      };

      let targetScale = getTargetScale();

      // Create smooth gradual scaling animation - reach full scale when user reaches image
      const scaleTrigger = ScrollTrigger.create({
        trigger: sectionRef.current,
        scroller,
        start: "top bottom", // Start when section enters viewport
        end: "center center", // Reach full scale when image is centered
        scrub: 3, // Much slower scrub for smoother, more gradual animation
        onUpdate: (self) => {
          // More gradual easing function - slower start, smoother middle
          const progress = self.progress;
          
          // Use a gentler easing curve for more natural scaling
          const easedProgress = progress < 0.5 
            ? 2 * progress * progress // Quadratic ease-in for first half
            : 1 - Math.pow(-2 * progress + 2, 2) / 2; // Quadratic ease-out for second half
          
          // Apply gradual scaling to image (no badges since they were removed)
          gsap.to('.dashboard-image', {
            scale: 1 + (targetScale - 1) * easedProgress,
            y: -40 * easedProgress, // Slightly more Y movement for depth
            duration: 0.5, // Longer duration for smoother feel
            ease: "power1.out", // Gentler easing
            overwrite: "auto"
          });
        }
      });

      // Gentle floating animation for feature icons
      gsap.to('.feature-icon-1', {
        y: -8,
        rotation: 2,
        duration: 4,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut"
      });

      gsap.to('.feature-icon-2', {
        y: -6,
        rotation: -1,
        duration: 3.5,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut",
        delay: 0.7
      });

      gsap.to('.feature-icon-3', {
        y: -10,
        rotation: 3,
        duration: 4.5,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut",
        delay: 1.4
      });

      // Dashboard image entrance animation
      gsap.fromTo('.dashboard-image',
        {
          y: 120,
          scale: 0.85,
          opacity: 0,
        },
        {
          y: 0,
          scale: 1,
          opacity: 1,
          duration: 1.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: dashboardRef.current,
            scroller,
            start: "top 85%",
            end: "top 60%",
            scrub: 1,
          }
        }
      );

      // Subtle glow effect animation
      gsap.to('.dashboard-glow', {
        opacity: "0.2, 0.4, 0.2",
        scale: "1, 1.05, 1",
        duration: 6,
        repeat: -1,
        ease: "power1.inOut"
      });

      // Handle window resize for super responsiveness
      const handleResize = () => {
        targetScale = getTargetScale();
        scaleTrigger.refresh();
        ScrollTrigger.refresh();
      };

      // Add resize listener with debouncing
      resizeTimeout = {} as NodeJS.Timeout;
      debouncedResize = () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(handleResize, 100);
      };

      window.addEventListener('resize', debouncedResize);

      // Ensure correct initial measurements (especially with smooth scrolling + image decode)
      if (!shouldRefreshRef.current) {
        shouldRefreshRef.current = true;
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            ScrollTrigger.refresh();
          });
        });
      }

    }, containerRef);

    return () => {
      // Cleanup resize listener on unmount
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(resizeTimeout);

      ctx.revert();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative py-28 overflow-hidden bg-linear-to-b from-background via-background/95 to-background/90"
    >
      {/* Minimal animated background gradients */}
      <div className="absolute inset-0 -z-10">
        <div className="dashboard-bg-1 absolute inset-0 bg-[radial-gradient(40%_40%_at_50%_50%,oklch(0.65_0.12_210/0.06)_0%,transparent_70%)]" />
        <div className="dashboard-bg-2 absolute inset-0 bg-[radial-gradient(25%_25%_at_80%_20%,oklch(0.6_0.15_280/0.04)_0%,transparent_60%)]" />
        <div className="dashboard-bg-animated absolute inset-0" />
      </div>

      <div ref={containerRef} className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section header */}
        <div className="dashboard-header text-center mb-16">
          <h2 className="dashboard-heading text-3xl md:text-4xl lg:text-5xl font-bold bg-linear-to-b from-foreground to-foreground/60 bg-clip-text text-transparent mb-6">
            Powerful Dashboard Analytics
          </h2>
          <p className="dashboard-description mx-auto max-w-3xl text-muted-foreground/80 text-lg md:text-xl leading-relaxed">
            Monitor your trading performance with real-time insights, advanced charts, and comprehensive analytics designed for serious traders.
          </p>
        </div>

        {/* Dashboard image with refined scroll animation */}
        <div
          ref={dashboardRef}
          className="relative mb-12"
        >
          <div className="relative">
            {/* Refined glow effect behind dashboard */}
            <div className="dashboard-glow absolute inset-0 bg-primary/15 blur-2xl rounded-2xl" />

            {/* Dashboard image container */}
            <div className="dashboard-image relative bg-background/90 backdrop-blur-sm rounded-2xl border border-border/40 shadow-xl overflow-hidden">
              <Image
                src="/dashboard.png"
                alt="Trading Dashboard"
                width={1200}
                height={800}
                className="w-full h-auto rounded-2xl"
                sizes="(min-width: 1024px) 1200px, 100vw"
                onLoadingComplete={() => {
                  ScrollTrigger.refresh();
                }}
              />

              {/* Subtle overlay gradient */}
              <div className="absolute inset-0 bg-linear-to-t from-background/10 via-transparent to-transparent pointer-events-none" />
            </div>
          </div>

          {/* Refined feature grid - moved up to give more time for image scaling */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[
              {
                icon: TrendingUp,
                title: "Real-time Analytics",
                description: "Track performance metrics and market trends as they happen."
              },
              {
                icon: BarChart3,
                title: "Advanced Charts",
                description: "Professional-grade charts with customizable indicators."
              },
              {
                icon: Activity,
                title: "Live Monitoring",
                description: "Watch your trades execute with millisecond precision."
              }
            ].map((feature, index) => (
              <div key={index} className="relative bg-background/60 backdrop-blur-sm rounded-2xl p-6 border border-border/40 hover:border-primary/30 transition-all duration-300">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">{feature.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground/80 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Refined CTA Section */}
          <div className="text-center">
            <div>
              <Link href={process.env.NEXT_PUBLIC_PLATFORM_LINK || ""}>
                <Button
                  size="lg"
                  className="rounded-full px-8 h-14 bg-linear-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-primary/20 text-base font-medium transition-all duration-300 group"
                >
                  <span className="flex items-center gap-2">
                    Explore Dashboard
                    <div>
                      <ArrowRight className="h-4 w-4" />
                    </div>
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