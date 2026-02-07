"use client";

import { TrendingUp, Menu, X } from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useResponsive } from "../hooks/use-responsive";

gsap.registerPlugin(ScrollTrigger);

export const Navbar = () => {
    const navbarRef = useRef<HTMLElement>(null);
    const { shouldReduceMotion, shouldDisableEffects, isMobile } = useResponsive();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        // Skip GSAP animations on mobile for performance
        if (shouldReduceMotion) return;

        let scrollTrigger: ScrollTrigger | undefined;
        
        const ctx = gsap.context(() => {
            // Subtle parallax effect for logo icon
            gsap.to('.navbar-logo-icon', {
                y: -2,
                rotation: 5,
                duration: 3,
                repeat: -1,
                yoyo: true,
                ease: "power1.inOut"
            });

            // Glow effect for logo
            gsap.to('.navbar-logo-glow', {
                opacity: "0.3, 0.6, 0.3",
                scale: "1, 1.05, 1",
                duration: 4,
                repeat: -1,
                ease: "power1.inOut"
            });

            // Scroll-based navbar background changes
            if (!shouldDisableEffects) {
                scrollTrigger = ScrollTrigger.create({
                    start: "top top",
                    end: "+=100",
                    onUpdate: (self) => {
                        const progress = self.progress;
                        gsap.to('.navbar-header', {
                            backgroundColor: `rgba(255, 255, 255, ${0.8 + progress * 0.15})`,
                            backdropFilter: `blur(${12 + progress * 8}px)`,
                            boxShadow: `0 ${1 + progress * 3}px ${3 + progress * 17}px rgba(0, 0, 0, ${0.1 + progress * 0.05})`,
                            borderColor: `rgba(0, 0, 0, ${0.05 + progress * 0.05})`,
                            duration: 0.1
                        });
                    }
                });
            }

            // Initial animations
            const tl = gsap.timeline();
            tl.fromTo('.navbar-logo-glow', { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.6, ease: "power2.out" })
              .fromTo('.navbar-brand-text', { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.6, ease: "power2.out" }, "-=0.4")
              .fromTo('.platform-button', { opacity: 0, x: 20 }, { opacity: 1, x: 0, duration: 0.6, delay: 0.1, ease: "power2.out" }, "-=0.3");

        }, navbarRef);

        return () => {
            scrollTrigger?.kill();
            ctx.revert();
        };
    }, [shouldReduceMotion, shouldDisableEffects]);

    return (
        <header 
            ref={navbarRef}
            className={`navbar-header sticky top-0 z-50 w-full border-b transition-all duration-300 backdrop-blur-sm ${
                shouldDisableEffects ? 'bg-white/95' : ''
            }`}
        >
            <div className="mx-auto max-w-7xl flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-3">
                    <div 
                        className="navbar-logo-glow relative h-8 w-8 sm:h-9 sm:w-9 rounded-2xl bg-linear-to-br from-primary via-primary/80 to-primary/60 flex items-center justify-center shadow-xl border border-primary/20"
                    >
                        <div 
                            className="navbar-logo-icon"
                        >
                            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
                        </div>
                    </div>
                    <span 
                        className="navbar-brand-text text-base sm:text-lg font-bold tracking-tight bg-linear-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent"
                        style={{ backgroundSize: "200% 100%" }}
                    >
                        Orbit
                    </span>
                </div>
                
                {/* Desktop Navigation */}
                {!isMobile && (
                    <div className="platform-button">
                        <Link href={process.env.NEXT_PUBLIC_PLATFORM_LINK || ""}>
                            <Button 
                                size="lg" 
                                className="relative rounded-full px-6 shadow-xl bg-linear-to-r from-primary via-primary/90 to-primary/80 border border-primary/20 transition-all duration-300"
                            >
                                <span className="font-medium">Platform</span>
                            </Button>
                        </Link>
                    </div>
                )}
                
                {/* Mobile Menu Button */}
                {isMobile && (
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="p-2 rounded-lg transition-colors duration-200"
                    >
                        {isMenuOpen ? (
                            <X className="h-5 w-5 text-foreground" />
                        ) : (
                            <Menu className="h-5 w-5 text-foreground" />
                        )}
                    </button>
                )}
            </div>
            
            {/* Mobile Menu */}
            {isMobile && (
                <div
                    className={`overflow-hidden border-t border-border/20 transition-all duration-300 ${
                        isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                >
                    <div className="px-4 py-4 space-y-3">
                        <Link href={process.env.NEXT_PUBLIC_PLATFORM_LINK || ""}>
                            <Button 
                                size="lg" 
                                className="w-full rounded-full px-6 shadow-xl overflow-hidden group bg-linear-to-r from-primary via-primary/90 to-primary/80 border border-primary/20 transition-all duration-300"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                <span className="relative z-10 font-medium">Platform</span>
                            </Button>
                        </Link>
                    </div>
                </div>
            )}
        </header>
    );
};