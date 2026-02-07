"use client"

import type React from "react"
import FooterSection from "../components/footer-section"

// Reusable Badge Component
function Badge({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="px-[14px] py-[6px] bg-white shadow-[0px_0px_0px_4px_rgba(55,50,47,0.05)] overflow-hidden rounded-[90px] flex justify-start items-center gap-[8px] border border-[rgba(2,6,23,0.08)] shadow-xs">
      <div className="w-[14px] h-[14px] relative overflow-hidden flex items-center justify-center">{icon}</div>
      <div className="text-center flex justify-center flex-col text-[#37322F] text-xs font-medium leading-3 font-sans">
        {text}
      </div>
    </div>
  )
}

// Feature icon components
function BrainIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2a7 7 0 0 0-7 7c0 3.5 2.5 6.5 6 7v3h2v-3c3.5-.5 6-3.5 6-7a7 7 0 0 0-7-7Z" stroke="#37322F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 10h.01M15 10h.01M9.5 14a3.5 3.5 0 0 0 5 0" stroke="#37322F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function BlocksIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="7" height="7" rx="1" stroke="#37322F" strokeWidth="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1" stroke="#37322F" strokeWidth="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1" stroke="#37322F" strokeWidth="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1" stroke="#37322F" strokeWidth="1.5" />
    </svg>
  )
}

function GearIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="3" stroke="#37322F" strokeWidth="1.5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="#37322F" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function ChartBarIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 3v18h18" stroke="#37322F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 16V9M11 16V5M15 16v-4M19 16v-7" stroke="#37322F" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function PlayCircleIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="#37322F" strokeWidth="1.5" />
      <path d="M10 8l6 4-6 4V8Z" fill="#37322F" />
    </svg>
  )
}

// Decorative diagonal lines component
function DiagonalPattern({ count = 50 }: { count?: number }) {
  return (
    <div className="w-[120px] sm:w-[140px] md:w-[162px] left-[-40px] sm:left-[-50px] md:left-[-58px] top-[-120px] absolute flex flex-col justify-start items-start">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="self-stretch h-3 sm:h-4 rotate-[-45deg] origin-top-left outline outline-[0.5px] outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px]"
        />
      ))}
    </div>
  )
}

function SidePattern({ count = 50 }: { count?: number }) {
  return (
    <div className="w-4 sm:w-6 md:w-8 lg:w-12 self-stretch relative overflow-hidden">
      <DiagonalPattern count={count} />
    </div>
  )
}

export default function LandingPage() {
  return (
    <div className="w-full min-h-screen relative bg-[#F7F5F3] overflow-x-hidden flex flex-col justify-start items-center">
      <div className="relative flex flex-col justify-start items-center w-full">
        {/* Main container */}
        <div className="w-full max-w-none px-4 sm:px-6 md:px-8 lg:px-0 lg:max-w-[1060px] lg:w-[1060px] relative flex flex-col justify-start items-start min-h-screen">
          {/* Left vertical line */}
          <div className="w-[1px] h-full absolute left-4 sm:left-6 md:left-8 lg:left-0 top-0 bg-[rgba(55,50,47,0.12)] shadow-[1px_0px_0px_white] z-0" />
          {/* Right vertical line */}
          <div className="w-[1px] h-full absolute right-4 sm:right-6 md:right-8 lg:right-0 top-0 bg-[rgba(55,50,47,0.12)] shadow-[1px_0px_0px_white] z-0" />

          <div className="self-stretch pt-[9px] overflow-hidden border-b border-[rgba(55,50,47,0.06)] flex flex-col justify-center items-center gap-4 sm:gap-6 md:gap-8 lg:gap-[66px] relative z-10">
            {/* Navigation */}
            <div className="w-full h-12 sm:h-14 md:h-16 lg:h-[84px] absolute left-0 top-0 flex justify-center items-center z-20 px-6 sm:px-8 md:px-12 lg:px-0">
              <div className="w-full h-0 absolute left-0 top-6 sm:top-7 md:top-8 lg:top-[42px] border-t border-[rgba(55,50,47,0.12)] shadow-[0px_1px_0px_white]" />
              <div className="w-full max-w-[calc(100%-32px)] sm:max-w-[calc(100%-48px)] md:max-w-[calc(100%-64px)] lg:max-w-[700px] lg:w-[700px] h-10 sm:h-11 md:h-12 py-1.5 sm:py-2 px-3 sm:px-4 md:px-4 pr-2 sm:pr-3 bg-[#F7F5F3] backdrop-blur-sm shadow-[0px_0px_0px_2px_white] overflow-hidden rounded-[50px] flex justify-between items-center relative z-30">
                <div className="flex justify-center items-center">
                  <div className="flex justify-start items-center">
                    <div className="flex flex-col justify-center text-[#2F3037] text-sm sm:text-base md:text-lg lg:text-xl font-medium leading-5 font-sans tracking-wide">
                      ORBIT
                    </div>
                  </div>
                  <div className="pl-3 sm:pl-4 md:pl-5 lg:pl-5 hidden sm:flex flex-row gap-2 sm:gap-3 md:gap-4 lg:gap-4">
                    <div className="flex justify-start items-center">
                      <div className="flex flex-col justify-center text-[rgba(49,45,43,0.80)] text-xs md:text-[13px] font-medium leading-[14px] font-sans">
                        Platform
                      </div>
                    </div>
                    <div className="flex justify-start items-center">
                      <div className="flex flex-col justify-center text-[rgba(49,45,43,0.80)] text-xs md:text-[13px] font-medium leading-[14px] font-sans">
                        Strategies
                      </div>
                    </div>
                    <div className="flex justify-start items-center">
                      <div className="flex flex-col justify-center text-[rgba(49,45,43,0.80)] text-xs md:text-[13px] font-medium leading-[14px] font-sans">
                        Docs
                      </div>
                    </div>
                  </div>
                </div>
                <div className="h-6 sm:h-7 md:h-8 flex justify-start items-start gap-2 sm:gap-3">
                  <div className="px-2 sm:px-3 md:px-[14px] py-1 sm:py-[6px] bg-white shadow-[0px_1px_2px_rgba(55,50,47,0.12)] overflow-hidden rounded-full flex justify-center items-center">
                    <div className="flex flex-col justify-center text-[#37322F] text-xs md:text-[13px] font-medium leading-5 font-sans">
                      Log in
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Hero Section */}
            <div className="pt-16 sm:pt-20 md:pt-24 lg:pt-[216px] pb-8 sm:pb-12 md:pb-16 flex flex-col justify-start items-center px-2 sm:px-4 md:px-8 lg:px-0 w-full">
              <div className="w-full max-w-[937px] lg:w-[937px] flex flex-col justify-center items-center gap-3 sm:gap-4 md:gap-5 lg:gap-6">
                <div className="self-stretch rounded-[3px] flex flex-col justify-center items-center gap-4 sm:gap-5 md:gap-6 lg:gap-8">
                  <div className="w-full max-w-[748.71px] lg:w-[748.71px] text-center flex justify-center flex-col text-[#37322F] text-[24px] xs:text-[28px] sm:text-[36px] md:text-[52px] lg:text-[80px] font-normal leading-[1.1] sm:leading-[1.15] md:leading-[1.2] lg:leading-24 font-serif px-2 sm:px-4 md:px-0 text-balance">
                    Next-Generation Trading Infrastructure
                  </div>
                  <div className="w-full max-w-[580px] lg:w-[580px] text-center flex justify-center flex-col text-[rgba(55,50,47,0.80)] sm:text-lg md:text-xl leading-[1.4] sm:leading-[1.45] md:leading-[1.5] lg:leading-7 font-sans px-2 sm:px-4 md:px-0 lg:text-lg font-medium text-sm">
                    Invest in proven strategies, build your own with AI,
                    <br className="hidden sm:block" />
                    or automate custom workflows — all on one
                    <br className="hidden sm:block" />
                    institutional-grade trading platform.
                  </div>
                </div>
              </div>

              <div className="w-full max-w-[497px] lg:w-[497px] flex flex-col justify-center items-center gap-6 sm:gap-8 md:gap-10 lg:gap-12 relative z-10 mt-6 sm:mt-8 md:mt-10 lg:mt-12">
                <div className="backdrop-blur-[8.25px] flex justify-start items-center gap-4">
                  <div className="h-10 sm:h-11 md:h-12 px-6 sm:px-8 md:px-10 lg:px-12 py-2 sm:py-[6px] relative bg-[#37322F] shadow-[0px_0px_0px_2.5px_rgba(255,255,255,0.08)_inset] overflow-hidden rounded-full flex justify-center items-center cursor-pointer hover:bg-[#2A2520] transition-colors">
                    <div className="w-20 sm:w-24 md:w-28 lg:w-44 h-[41px] absolute left-0 top-[-0.5px] bg-gradient-to-b from-[rgba(255,255,255,0)] to-[rgba(0,0,0,0.10)] mix-blend-multiply" />
                    <div className="flex flex-col justify-center text-white text-sm sm:text-base md:text-[15px] font-medium leading-5 font-sans">
                      Explore Dashboard
                    </div>
                  </div>
                  <div className="h-10 sm:h-11 md:h-12 px-6 sm:px-8 md:px-10 lg:px-12 py-2 sm:py-[6px] bg-white shadow-[0px_1px_2px_rgba(55,50,47,0.12)] overflow-hidden rounded-full flex justify-center items-center cursor-pointer hover:bg-[#FBFAF9] transition-colors">
                    <div className="flex flex-col justify-center text-[#37322F] text-sm sm:text-base md:text-[15px] font-medium leading-5 font-sans">
                      Get Started
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute top-[232px] sm:top-[248px] md:top-[264px] lg:top-[320px] left-1/2 transform -translate-x-1/2 z-0 pointer-events-none">
                <img
                  src="/mask-group-pattern.svg"
                  alt=""
                  className="w-[936px] sm:w-[1404px] md:w-[2106px] lg:w-[2808px] h-auto opacity-30 sm:opacity-40 md:opacity-50 mix-blend-multiply"
                  style={{
                    filter: "hue-rotate(15deg) saturate(0.7) brightness(1.2)",
                  }}
                />
              </div>

              {/* Dashboard Preview */}
              <div className="w-full flex justify-center items-center relative z-5 mt-10 sm:mt-14 md:mt-16 lg:mt-20 mb-10 sm:mb-14 md:mb-16 lg:mb-20 px-4 sm:px-6 md:px-8 lg:px-0">
                <div className="w-full max-w-[1200px] lg:max-w-[1400px]">
                  <div className="w-full aspect-video bg-[#0d1117] shadow-[0px_4px_40px_rgba(0,0,0,0.12),0px_0px_0px_1px_rgba(0,0,0,0.06)] overflow-hidden rounded-xl sm:rounded-2xl lg:rounded-3xl">
                    <img
                      src="/orbit-trading-dashboard-wide.jpg"
                      alt="ORBIT Trading Dashboard - Candlestick charts, indicators, and real-time market data"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              </div>

              {/* Three Feature Segments */}
              <div className="self-stretch border-t border-[#E0DEDB] border-b border-[#E0DEDB] flex justify-center items-start">
                <SidePattern />
                <div className="flex-1 px-0 sm:px-2 md:px-0 flex flex-col md:flex-row justify-center items-stretch gap-0">
                  <FeatureSegment
                    title="Real-time Analytics"
                    description="Track performance metrics and market trends as they happen."
                  />
                  <FeatureSegment
                    title="Advanced Charts"
                    description="Professional-grade charts with customizable indicators."
                  />
                  <FeatureSegment
                    title="Live Monitoring"
                    description="Watch your trades execute with millisecond precision."
                  />
                </div>
                <SidePattern />
              </div>

              {/* Explore Dashboard CTA */}
              <div className="w-full py-8 sm:py-10 md:py-12 flex justify-center items-center border-b border-[rgba(55,50,47,0.12)]">
                <a
                  href="#"
                  className="text-[#49423D] text-sm sm:text-base font-medium leading-6 font-sans flex items-center gap-2 hover:text-[#37322F] transition-colors group"
                >
                  Explore the Dashboard
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="transition-transform group-hover:translate-x-0.5"
                  >
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              </div>

              {/* Core Platform Features Section */}
              <div className="w-full border-b border-[rgba(55,50,47,0.12)] flex flex-col justify-center items-center">
                {/* Header */}
                <div className="self-stretch px-4 sm:px-6 md:px-8 lg:px-0 lg:max-w-[1060px] lg:w-[1060px] py-8 sm:py-12 md:py-16 border-b border-[rgba(55,50,47,0.12)] flex justify-center items-center gap-6">
                  <div className="w-full max-w-[616px] lg:w-[616px] px-4 sm:px-6 py-4 sm:py-5 overflow-hidden rounded-lg flex flex-col justify-start items-center gap-3 sm:gap-4">
                    <Badge
                      icon={
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="1" y="1" width="4" height="4" stroke="#37322F" strokeWidth="1" fill="none" />
                          <rect x="7" y="1" width="4" height="4" stroke="#37322F" strokeWidth="1" fill="none" />
                          <rect x="1" y="7" width="4" height="4" stroke="#37322F" strokeWidth="1" fill="none" />
                          <rect x="7" y="7" width="4" height="4" stroke="#37322F" strokeWidth="1" fill="none" />
                        </svg>
                      }
                      text="Platform"
                    />
                    <div className="w-full max-w-[598.06px] lg:w-[598.06px] text-center flex justify-center flex-col text-[#49423D] text-xl sm:text-2xl md:text-3xl lg:text-5xl font-semibold leading-tight md:leading-[60px] font-sans tracking-tight text-balance">
                      Everything you need to trade with confidence
                    </div>
                    <div className="self-stretch text-center text-[#605A57] text-sm sm:text-base font-normal leading-6 sm:leading-7 font-sans">
                      Build, test, and deploy strategies with institutional-grade
                      <br className="hidden sm:block" />
                      tools designed for serious traders.
                    </div>
                  </div>
                </div>

                {/* Feature Cards Grid */}
                <div className="self-stretch flex justify-center items-start">
                  <SidePattern count={200} />

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-0 border-l border-r border-[rgba(55,50,47,0.12)]">
                    {/* AI Strategy Builder */}
                    <div className="border-b border-r-0 md:border-r border-[rgba(55,50,47,0.12)] p-4 sm:p-6 md:p-8 lg:p-12 flex flex-col justify-start items-start gap-4 sm:gap-6">
                      <div className="w-12 h-12 rounded-lg bg-white shadow-[0px_1px_3px_rgba(55,50,47,0.10)] flex items-center justify-center">
                        <BrainIcon />
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="text-[rgba(55,50,47,0.60)] text-xs font-medium uppercase tracking-widest font-sans">
                          AI Strategy Builder
                        </div>
                        <h3 className="text-[#37322F] text-lg sm:text-xl font-semibold leading-tight font-sans">
                          Build your own strategy
                        </h3>
                        <p className="text-[#605A57] text-sm md:text-base font-normal leading-relaxed font-sans">
                          Create strategies using AI-assisted logic, prompts, and automated signal generation. Leverage machine learning to identify profitable patterns and execute trades with precision.
                        </p>
                      </div>
                    </div>

                    {/* Visual Designer */}
                    <div className="border-b border-[rgba(55,50,47,0.12)] p-4 sm:p-6 md:p-8 lg:p-12 flex flex-col justify-start items-start gap-4 sm:gap-6">
                      <div className="w-12 h-12 rounded-lg bg-white shadow-[0px_1px_3px_rgba(55,50,47,0.10)] flex items-center justify-center">
                        <BlocksIcon />
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="text-[rgba(55,50,47,0.60)] text-xs font-medium uppercase tracking-widest font-sans">
                          Visual Designer
                        </div>
                        <h3 className="text-[#37322F] text-lg sm:text-xl font-semibold leading-tight font-sans">
                          Drag-and-Drop Strategy Designer
                        </h3>
                        <p className="text-[#605A57] text-sm md:text-base font-normal leading-relaxed font-sans">
                          Visually compose strategies with indicators, conditions, and execution blocks — no code required. Build complex trading logic with an intuitive visual interface.
                        </p>
                      </div>
                    </div>

                    {/* Automation Engine */}
                    <div className="border-b border-r-0 md:border-r border-[rgba(55,50,47,0.12)] p-4 sm:p-6 md:p-8 lg:p-12 flex flex-col justify-start items-start gap-4 sm:gap-6">
                      <div className="w-12 h-12 rounded-lg bg-white shadow-[0px_1px_3px_rgba(55,50,47,0.10)] flex items-center justify-center">
                        <GearIcon />
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="text-[rgba(55,50,47,0.60)] text-xs font-medium uppercase tracking-widest font-sans">
                          Automation Engine
                        </div>
                        <h3 className="text-[#37322F] text-lg sm:text-xl font-semibold leading-tight font-sans">
                          Full Automation Engine
                        </h3>
                        <p className="text-[#605A57] text-sm md:text-base font-normal leading-relaxed font-sans">
                          Deploy strategies with scheduling, risk rules, and exchange automation running 24/7. Set it and forget it with our robust automation infrastructure.
                        </p>
                      </div>
                    </div>

                    {/* BackTesting */}
                    <div className="border-b border-[rgba(55,50,47,0.12)] p-4 sm:p-6 md:p-8 lg:p-12 flex flex-col justify-start items-start gap-4 sm:gap-6">
                      <div className="w-12 h-12 rounded-lg bg-white shadow-[0px_1px_3px_rgba(55,50,47,0.10)] flex items-center justify-center">
                        <ChartBarIcon />
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="text-[rgba(55,50,47,0.60)] text-xs font-medium uppercase tracking-widest font-sans">
                          BackTesting
                        </div>
                        <h3 className="text-[#37322F] text-lg sm:text-xl font-semibold leading-tight font-sans">
                          {"Test & Validate your Trading Strategy"}
                        </h3>
                        <p className="text-[#605A57] text-sm md:text-base font-normal leading-relaxed font-sans">
                          Backtest your strategies with historical data and validate their performance before deploying them to live markets.
                        </p>
                      </div>
                    </div>

                    {/* Simulate - Full Width */}
                    <div className="md:col-span-2 p-4 sm:p-6 md:p-8 lg:p-12 flex flex-col justify-start items-start gap-4 sm:gap-6">
                      <div className="w-12 h-12 rounded-lg bg-white shadow-[0px_1px_3px_rgba(55,50,47,0.10)] flex items-center justify-center">
                        <PlayCircleIcon />
                      </div>
                      <div className="flex flex-col gap-2 max-w-[600px]">
                        <div className="text-[rgba(55,50,47,0.60)] text-xs font-medium uppercase tracking-widest font-sans">
                          Simulate
                        </div>
                        <h3 className="text-[#37322F] text-lg sm:text-xl font-semibold leading-tight font-sans">
                          {"Simulate and Analyze your Trading Strategy"}
                        </h3>
                        <p className="text-[#605A57] text-sm md:text-base font-normal leading-relaxed font-sans">
                          Simulate your strategies with real-time data and analyze their performance before deploying them to live markets.
                        </p>
                      </div>
                    </div>
                  </div>

                  <SidePattern count={200} />
                </div>
              </div>

              {/* CTA Section */}
              <div className="w-full relative overflow-hidden flex flex-col justify-center items-center gap-2">
                <div className="self-stretch px-6 md:px-24 py-12 md:py-12 border-t border-b border-[rgba(55,50,47,0.12)] flex justify-center items-center gap-6 relative z-10">
                  <div className="absolute inset-0 w-full h-full overflow-hidden">
                    <div className="w-full h-full relative">
                      {Array.from({ length: 300 }).map((_, i) => (
                        <div
                          key={i}
                          className="absolute h-4 w-full rotate-[-45deg] origin-top-left outline outline-[0.5px] outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px]"
                          style={{
                            top: `${i * 16 - 120}px`,
                            left: "-100%",
                            width: "300%",
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="w-full max-w-[586px] px-6 py-5 md:py-8 overflow-hidden rounded-lg flex flex-col justify-start items-center gap-6 relative z-20">
                    <div className="self-stretch flex flex-col justify-start items-start gap-3">
                      <div className="self-stretch text-center flex justify-center flex-col text-[#49423D] text-3xl md:text-5xl font-semibold leading-tight md:leading-[56px] font-sans tracking-tight text-balance">
                        Ready to elevate your trading?
                      </div>
                      <div className="self-stretch text-center text-[#605A57] text-base leading-7 font-sans font-medium">
                        Join traders who trust ORBIT for institutional-grade
                        <br className="hidden sm:block" />
                        strategies, automation, and real-time insights.
                      </div>
                    </div>
                    <div className="w-full max-w-[497px] flex flex-col justify-center items-center gap-12">
                      <div className="flex justify-start items-center gap-4">
                        <div className="h-10 px-12 py-[6px] relative bg-[#37322F] shadow-[0px_0px_0px_2.5px_rgba(255,255,255,0.08)_inset] overflow-hidden rounded-full flex justify-center items-center cursor-pointer hover:bg-[#2A2520] transition-colors">
                          <div className="w-44 h-[41px] absolute left-0 top-0 bg-gradient-to-b from-[rgba(255,255,255,0)] to-[rgba(0,0,0,0.10)] mix-blend-multiply" />
                          <div className="flex flex-col justify-center text-white text-[13px] font-medium leading-5 font-sans">
                            Get Started
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Section */}
              <FooterSection />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Feature segment for the 3-column row below dashboard
function FeatureSegment({ title, description }: { title: string; description: string }) {
  return (
    <div className="w-full md:flex-1 self-stretch px-6 py-5 overflow-hidden flex flex-col justify-start items-start gap-2 border-b md:border-b-0 last:border-b-0 border-l-0 border-r-0 md:border border-[#E0DEDB]/80">
      <div className="self-stretch flex justify-center flex-col text-[#49423D] text-sm md:text-sm font-semibold leading-6 md:leading-6 font-sans">
        {title}
      </div>
      <div className="self-stretch text-[#605A57] text-[13px] md:text-[13px] font-normal leading-[22px] md:leading-[22px] font-sans">
        {description}
      </div>
    </div>
  )
}
