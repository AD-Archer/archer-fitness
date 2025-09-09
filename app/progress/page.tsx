import { ProgressAnalytics } from "@/app/progress/components/progress-analytics"
import { Sidebar } from "@/components/sidebar"

export default function ProgressPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-balance">Progress Analytics</h1>
            <p className="text-muted-foreground text-pretty mt-2">
              Comprehensive insights into your fitness journey and performance trends
            </p>
          </div>

          <ProgressAnalytics />
        </div>
      </main>
    </div>
  )
}
