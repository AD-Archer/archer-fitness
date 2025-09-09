"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Sidebar } from "@/components/sidebar"

export function LoadingDashboard() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-4 md:p-6 lg:p-8 lg:ml-0">
        <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between pt-12 lg:pt-0">
            <div>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-96" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-9 w-32" />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-16 mb-2" />
                  <Skeleton className="h-8 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
