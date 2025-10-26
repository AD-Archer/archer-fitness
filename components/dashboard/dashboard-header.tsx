"use client"

import { Button } from "@/components/ui/button"
import { UserNav } from "@/components/user-nav"
import Link from "next/link"
import { Smartphone } from "lucide-react"
import { isPWA } from "@/lib/pwa-utils"

export function DashboardHeader() {
  const pwaMode = isPWA()

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between pt-12 lg:pt-0">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-balance">Fitness Dashboard</h1>
          {pwaMode && (
            <div className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-xs font-medium">
              <Smartphone className="h-3 w-3" />
              PWA
            </div>
          )}
        </div>
        <p className="text-muted-foreground text-pretty">AI-powered workout planning and progress tracking</p>
      </div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <UserNav />
        <Link href="/track">
          <Button className="bg-blue-700 hover:bg-blue-800 text-white w-full sm:w-auto">Begin Workout</Button>
        </Link>
      </div>
    </div>
  )
}
