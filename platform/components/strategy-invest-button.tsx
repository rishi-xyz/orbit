"use client"

import * as React from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

export function StrategyInvestButton({ algoId }: { algoId: number }) {
  return (
    <Button
      size="sm"
      onClick={() => {
        toast.message("Invest flow coming next", {
          description: `Will deposit into the strategy vault. (algo #${algoId})`,
        })
      }}
    >
      Invest
    </Button>
  )
}
