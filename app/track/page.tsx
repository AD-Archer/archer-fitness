import { WorkoutTracker } from "@/app/track/components/workout-tracker"
import { Sidebar } from "@/components/sidebar"

export default function TrackPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 p-6 lg:p-8 pt-16 lg:pt-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-balance">Workout Tracker</h1>
            <p className="text-muted-foreground text-pretty mt-2">
              Track your exercises, sets, and reps in real-time during your workout
            </p>
          </div>

          <WorkoutTracker />
        </div>
      </main>
    </div>
  )
}
