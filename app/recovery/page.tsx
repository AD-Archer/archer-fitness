import { RecoveryMonitor } from "@/app/recovery/components/recovery-monitor"
import { Sidebar } from "@/components/sidebar"

export default function RecoveryPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-balance">Recovery Monitor</h1>
            <p className="text-muted-foreground text-pretty mt-2">
              Track your recovery metrics and get personalized recommendations for optimal performance
            </p>
          </div>

          <RecoveryMonitor />
        </div>
      </main>
    </div>
  )
}
