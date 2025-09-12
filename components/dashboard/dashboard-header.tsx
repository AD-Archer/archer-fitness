"use client"

import { Button } from "@/components/ui/button"
import { UserNav } from "@/components/user-nav"
import Link from "next/link"

export function DashboardHeader() {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between pt-12 lg:pt-0">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-balance">Fitness Dashboard</h1>
        <p className="text-muted-foreground text-pretty">AI-powered workout planning and progress tracking</p>
      </div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <UserNav />
        <Link href="/generate">
          <Button className="bg-blue-700 hover:bg-blue-800 text-white w-full sm:w-auto">Generate Workout</Button>
        </Link>
      </div>
    </div>
  )
}
