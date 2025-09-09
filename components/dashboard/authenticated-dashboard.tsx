"use client"

import { Sidebar } from "@/components/sidebar"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardMainContent } from "@/components/dashboard/dashboard-main-content"
import { NutritionQuickActions } from "@/components/dashboard/nutrition-quick-actions"

export function AuthenticatedDashboard() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 p-4 md:p-6 lg:p-8 lg:ml-0">
        <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
          <DashboardHeader />
          <NutritionQuickActions />
          <DashboardMainContent />
        </div>
      </main>
    </div>
  )
}
