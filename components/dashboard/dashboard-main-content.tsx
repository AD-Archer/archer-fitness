"use client";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { RecentWorkouts } from "@/app/workouts/components/recent-workouts";
import { TodaysFocus } from "@/components/dashboard/todays-focus";
import { WeightTracker } from "@/components/dashboard/weight-tracker";
import { ScheduleOverview } from "@/components/dashboard/schedule-overview";
import { RecoveryQuickLink } from "@/components/dashboard/recovery-quick-link";
import { ProgressionNextNodeCard } from "@/components/dashboard/progression-next-node-card";
import { ProgressionLeaderboardCard } from "@/components/dashboard/progression-leaderboard-card";

export function DashboardMainContent() {
  return (
    <>
      {/* Stats Overview */}
      <DashboardStats />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-2 sm:gap-3 xl:grid-cols-3">
        {/* Left Column - 2/3 width (Schedule + Progress + Recent) */}
        <div className="xl:col-span-2 space-y-2 sm:space-y-3">
          <ProgressionNextNodeCard />
          {/* Schedule (This Week's Schedule + Week at a Glance stacked inside) */}
          <ScheduleOverview />
          {/* Weekly Progress */}
          {/* <WeeklyProgress /> */}
          {/* Recent Workouts Removed for the tiem being*/}
          <RecentWorkouts />
        </div>

        {/* Right Column - 1/3 width (Focus + Weight) */}
        <div className="space-y-2 sm:space-y-3">
          <ProgressionLeaderboardCard />
          <TodaysFocus />
          <WeightTracker />
          <RecoveryQuickLink />
        </div>
      </div>
    </>
  );
}
