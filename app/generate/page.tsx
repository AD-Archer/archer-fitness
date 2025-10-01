import { AIWorkoutGenerator } from "@/app/generate/components/workout/ai-workout-generator"
import { Sidebar } from "@/components/sidebar"

export default function GeneratePage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 p-4 md:p-6 lg:p-8 lg:ml-0">
        <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
          <div className="pt-12 lg:pt-0">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-balance">AI Generator Hub</h1>
            <p className="text-muted-foreground text-pretty mt-2">
              Create personalized workout plans tailored to your fitness goals and preferences
            </p>
          </div>

          <AIWorkoutGenerator />
        </div>
      </main>
    </div>
  )
}
