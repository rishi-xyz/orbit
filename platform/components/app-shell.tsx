"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { CoinsIcon, HammerIcon, LayoutDashboardIcon, LayersIcon, TrendingUpIcon, PlayIcon } from "lucide-react"

import { ThemeToggle } from "@/components/theme-toggle"
import { WalletConnect } from "@/components/wallet-connect"
import { Separator } from "@/components/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const title =
    pathname === "/strategies"
      ? "Strategies"
      : pathname === "/builder"
        ? "Strategy Builder"
        : pathname === "/demo-strategies"
          ? "Demo Strategies"
          : "Stellar (XLM)"

  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon" variant="inset">
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-1">
            <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg shadow-sm">
              <CoinsIcon className="size-4" />
            </div>
            <div className="min-w-0 group-data-[collapsible=icon]:hidden">
              <div className="truncate text-sm font-semibold tracking-tight">
                Orbit
              </div>
              <div className="text-muted-foreground truncate text-xs">
                Market terminal
              </div>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Overview</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === "/"}
                    tooltip="Dashboard"
                  >
                    <Link href="/">
                      <LayoutDashboardIcon />
                      <span>Dashboard</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === "/"}
                    tooltip="Stellar (XLM)"
                  >
                    <Link href="/">
                      <TrendingUpIcon />
                      <span>Stellar</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === "/strategies"}
                    tooltip="Strategies"
                  >
                    <Link href="/strategies">
                      <LayersIcon />
                      <span>Strategies</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === "/builder"}
                    tooltip="Builder"
                  >
                    <Link href="/builder">
                      <HammerIcon />
                      <span>Builder</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === "/demo-strategies"}
                    tooltip="Demo Strategies"
                  >
                    <Link href="/demo-strategies">
                      <PlayIcon />
                      <span>Demo</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <div className="text-muted-foreground px-2 py-1 text-xs group-data-[collapsible=icon]:hidden">
            Premium UI • shadcn
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <div className="bg-background/60 supports-[backdrop-filter]:bg-background/40 sticky top-0 z-30 flex h-14 items-center gap-2 border-b px-4 backdrop-blur">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-5" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium tracking-tight">
              {title}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <WalletConnect />
            <ThemeToggle />
          </div>
        </div>

        <div className="flex-1 p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
