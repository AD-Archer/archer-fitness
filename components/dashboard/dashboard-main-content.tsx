"use client"
import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { RecentWorkouts } from "@/app/workouts/components/recent-workouts"
import { WeeklyProgress } from "@/components/dashboard/weekly-progress"
import { TodaysFocus } from "@/components/dashboard/todays-focus"
import { WeightTracker } from "@/components/dashboard/weight-tracker"


export function DashboardMainContent() {
  return (
    <>
      {/* Stats Overview */}
      <DashboardStats />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-2 sm:gap-3 xl:grid-cols-3">
        {/* Left Column - 2/3 width */}
        <div className="xl:col-span-2 space-y-2 sm:space-y-3">
          <WeeklyProgress />
          <RecentWorkouts />
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-2 sm:space-y-3">

          {/* Today's Focus */}
          <TodaysFocus />

          {/* Weight Tracking */}
            <WeightTracker />
        </div>
      </div>
    </>
  )
}
