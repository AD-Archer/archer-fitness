import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Sidebar } from "@/components/sidebar"
import { DashboardStats } from "@/components/dashboard-stats"
import { RecentWorkouts } from "@/components/recent-workouts"
import { WeeklyProgress } from "@/components/weekly-progress"
import { QuickActions } from "@/components/quick-actions"
import Link from "next/link"

export default function Dashboard() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 p-4 md:p-6 lg:p-8 lg:ml-0">
        <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
          {/* Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between pt-12 lg:pt-0">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-balance">Fitness Dashboard</h1>
              <p className="text-muted-foreground text-pretty">AI-powered workout planning and progress tracking</p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <Badge
                variant="secondary"
                className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
              >
                Active Plan
              </Badge>
              <Link href="/generate">
                <Button className="bg-blue-700 hover:bg-blue-800 text-white w-full sm:w-auto">Generate Workout</Button>
              </Link>
            </div>
          </div>

          {/* Stats Overview */}
          <DashboardStats />

          {/* Main Content Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Column - 2/3 width */}
            <div className="lg:col-span-2 space-y-6">
              <WeeklyProgress />
              <RecentWorkouts />
            </div>

            {/* Right Column - 1/3 width */}
            <div className="space-y-6">
              <QuickActions />

              {/* Today's Focus */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Today's Focus</CardTitle>
                  <CardDescription>AI recommended workout</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100">Upper Body Strength</h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">45 min • 6 exercises • Intermediate</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>0/6 exercises</span>
                    </div>
                    <Progress value={0} className="h-2" />
                  </div>
                  <Button variant="outline" className="w-full bg-transparent">
                    Start Workout
                  </Button>
                </CardContent>
              </Card>

              {/* Rest & Recovery */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recovery Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Sleep Quality</span>
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    >
                      Good
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Muscle Recovery</span>
                    <Badge
                      variant="secondary"
                      className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                    >
                      Moderate
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Energy Level</span>
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    >
                      High
                    </Badge>
                  </div>
                  <Button variant="outline" className="w-full mt-4 bg-transparent">
                    Log Recovery Data
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Nutrition Quick Actions Section - Full Width */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Quick Nutrition</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Nutrition Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button variant="outline" size="sm" className="bg-transparent flex-1">
                      Log Meal
                    </Button>
                    <Button variant="outline" size="sm" className="bg-transparent flex-1">
                      Add Water
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Protein</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">85g / 150g</span>
                        <Badge
                          variant="secondary"
                          className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                        >
                          57%
                        </Badge>
                      </div>
                    </div>
                    <Progress value={57} className="h-2" />

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Carbs</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">180g / 250g</span>
                        <Badge
                          variant="secondary"
                          className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        >
                          72%
                        </Badge>
                      </div>
                    </div>
                    <Progress value={72} className="h-2" />

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Fat</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">45g / 80g</span>
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        >
                          56%
                        </Badge>
                      </div>
                    </div>
                    <Progress value={56} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">AI Meal Suggestion</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-950 dark:to-blue-950 border">
                    <h4 className="font-medium text-emerald-900 dark:text-emerald-100">Grilled Chicken Salad</h4>
                    <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">
                      Perfect for your protein goals • 420 cal
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="w-full bg-transparent">
                    Generate Meal Plan
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Hydration Tracker</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">72%</div>
                    <p className="text-sm text-muted-foreground">Daily water goal</p>
                  </div>
                  <div className="space-y-2">
                    <Progress value={72} className="h-3" />
                    <p className="text-sm text-center text-muted-foreground">700ml remaining</p>
                  </div>
                  <Button variant="outline" size="sm" className="w-full bg-transparent">
                    Log Water
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
