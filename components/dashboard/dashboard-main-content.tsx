"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { RecentWorkouts } from "@/app/workouts/components/recent-workouts"
import { WeeklyProgress } from "@/components/weekly-progress"
import { TodaysFocus } from "@/components/dashboard/todays-focus"


export function DashboardMainContent() {
  return (
    <>
      {/* Stats Overview */}
      <DashboardStats />

      {/* Main Content Grid */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <WeeklyProgress />
          <RecentWorkouts />
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-4 sm:space-y-6">

          {/* Today's Focus */}
          <TodaysFocus />

          {/* Rest & Recovery */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recovery Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between min-w-0">
                <span className="text-sm font-medium truncate flex-1 mr-2">Sleep Quality</span>
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 flex-shrink-0"
                >
                  Good
                </Badge>
              </div>
              <div className="flex items-center justify-between min-w-0">
                <span className="text-sm font-medium truncate flex-1 mr-2">Muscle Recovery</span>
                <Badge
                  variant="secondary"
                  className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 flex-shrink-0"
                >
                  Moderate
                </Badge>
              </div>
              <div className="flex items-center justify-between min-w-0">
                <span className="text-sm font-medium truncate flex-1 mr-2">Energy Level</span>
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 flex-shrink-0"
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
