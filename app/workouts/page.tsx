import { WorkoutHistory } from "@/components/workout-history"
import { Sidebar } from "@/components/sidebar"

export default function WorkoutsPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-balance">My Workouts</h1>
            <p className="text-muted-foreground text-pretty mt-2">
              View your workout history, track progress, and repeat favorite sessions
            </p>
          </div>

          <WorkoutHistory />
        </div>
      </main>
    </div>
  )
}
