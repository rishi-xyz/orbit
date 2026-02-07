import type React from "react"
import type { Metadata } from "next"
import { Inter, Instrument_Serif } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
})

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-instrument-serif",
  weight: ["400"],
  display: "swap",
  preload: true,
})

export const metadata: Metadata = {
  title: "ORBIT - Institutional-Grade Crypto Trading Platform",
  description:
    "Advanced crypto trading infrastructure with AI-powered strategies, real-time analytics, and institutional-grade security. Trade smarter with ORBIT.",
  generator: 'v0.app',
  keywords: ['crypto trading', 'bitcoin', 'ethereum', 'defi', 'trading bot', 'ai trading', 'institutional trading'],
  authors: [{ name: 'ORBIT' }],
  openGraph: {
    title: 'ORBIT - Institutional-Grade Crypto Trading Platform',
    description: 'Advanced crypto trading infrastructure with AI-powered strategies',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${instrumentSerif.variable} antialiased scroll-smooth`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
        />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Serif:wght@400&display=swap" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="font-sans antialiased bg-gradient-to-br from-[#F8F9FA] via-[#FFFFFF] to-[#F5F5F7]">{children}</body>
    </html>
  )
}
