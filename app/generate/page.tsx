import { AIWorkoutGenerator } from "@/components/ai-workout-generator"
import { AIMealGenerator } from "@/components/ai-meal-generator"
import { Sidebar } from "@/components/sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dumbbell, ChefHat } from "lucide-react"

export default function GeneratePage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 p-4 md:p-6 lg:p-8 lg:ml-0">
        <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
          <div className="pt-12 lg:pt-0">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-balance">AI Generator Hub</h1>
            <p className="text-muted-foreground text-pretty mt-2">
              Create personalized workouts and meal plans tailored to your fitness goals and preferences
            </p>
          </div>

          <Tabs defaultValue="workouts" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="workouts" className="flex items-center gap-2">
                <Dumbbell className="h-4 w-4" />
                <span className="hidden sm:inline">Workout Plans</span>
                <span className="sm:hidden">Workouts</span>
              </TabsTrigger>
              <TabsTrigger value="meals" className="flex items-center gap-2">
                <ChefHat className="h-4 w-4" />
                <span className="hidden sm:inline">Meal Plans</span>
                <span className="sm:hidden">Meals</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="workouts" className="space-y-6">
              <AIWorkoutGenerator />
            </TabsContent>

            <TabsContent value="meals" className="space-y-6">
              <AIMealGenerator />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
