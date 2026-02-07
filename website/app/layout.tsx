import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AnimationProvider from "@/src/components/provider";
import { Navbar } from "@/src/components/navbar";
import { PerformanceOptimizedLayout } from "@/src/components/performance-optimized-layout";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HyperTrade",
  description: "Where crypto strategies meet capital.",
  icons: {
    icon: "/logo.png"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#f4f9fd]`}
      >
        <PerformanceOptimizedLayout>
          <AnimationProvider>
            <Navbar />
            {children}
            <Analytics />
            <SpeedInsights />
          </AnimationProvider>
        </PerformanceOptimizedLayout>
      </body>
    </html>
  );
}
