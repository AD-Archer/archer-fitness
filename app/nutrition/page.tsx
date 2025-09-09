import { CalorieTracker } from "@/app/nutrition/components/calorie-tracker"
import { Sidebar } from "@/components/sidebar"

export default function NutritionPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-balance">Nutrition Tracker</h1>
              <p className="text-muted-foreground text-pretty">Track your daily calorie intake and macronutrients</p>
            </div>
          </div>

          <CalorieTracker />
        </div>
      </main>
    </div>
  )
}
