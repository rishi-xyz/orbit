"use client"

import * as React from "react"
import { MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()

  const isDark = resolvedTheme === "dark"

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-8"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle theme"
    >
      {isDark ? <SunIcon className="size-4" /> : <MoonIcon className="size-4" />}
    </Button>
  )
}
