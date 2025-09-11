"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState } from "react"
import { ProgressAnalyticsHeader } from "./progress-analytics-header"
import { KeyMetricsCards } from "./key-metrics-cards"
import { StrengthAnalytics } from "./strength-analytics"
import { VolumeAnalytics } from "./volume-analytics"
import { NutritionAnalytics } from "./nutrition-analytics"
import { DistributionAnalytics } from "./distribution-analytics"
import { BodyCompositionAnalytics } from "./body-composition-analytics"
import { AchievementsAnalytics } from "./achievements-analytics"

export function ProgressAnalytics() {
  const [timeRange, setTimeRange] = useState("6weeks")

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selector */}
      <ProgressAnalyticsHeader timeRange={timeRange} setTimeRange={setTimeRange} />

      {/* Key Metrics Cards */}
      <KeyMetricsCards />

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="strength" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
          <TabsTrigger value="strength">Strength</TabsTrigger>
          <TabsTrigger value="volume">Volume</TabsTrigger>
          <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
          <TabsTrigger value="body">Body Comp</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        {/* Strength Progress Tab */}
        <TabsContent value="strength">
          <StrengthAnalytics />
        </TabsContent>

        {/* Volume Analysis Tab */}
        <TabsContent value="volume">
          <VolumeAnalytics />
        </TabsContent>

        {/* Nutrition Analytics Tab */}
        <TabsContent value="nutrition">
          <NutritionAnalytics />
        </TabsContent>

        {/* Muscle Group Distribution Tab */}
        <TabsContent value="distribution">
          <DistributionAnalytics />
        </TabsContent>

        {/* Body Composition Tab */}
        <TabsContent value="body">
          <BodyCompositionAnalytics />
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements">
          <AchievementsAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  )
}
