"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { RecentWorkouts } from "@/app/workouts/components/recent-workouts"
import { WeeklyProgress } from "@/components/weekly-progress"


export function DashboardMainContent() {
  return (
    <>
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

          {/* Today's Focus */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Today&#39;s Focus</CardTitle>
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
    </>
  )
}
