"use client"

import { Sidebar } from "@/components/sidebar"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardMainContent } from "@/components/dashboard/dashboard-main-content"
import { PWAInstallPrompt } from "@/components/pwa-install-prompt"

export function AuthenticatedDashboard() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 p-3 md:p-6 lg:p-8 lg:ml-0 overflow-x-hidden">
        <div className="max-w-4xl mx-auto space-y-4 md:space-y-6 lg:space-y-8">
          <DashboardHeader />
          <DashboardMainContent />
        </div>
      </main>

      <PWAInstallPrompt />
    </div>
  )
}
