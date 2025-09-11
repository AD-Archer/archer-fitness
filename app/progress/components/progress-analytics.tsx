"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { useState } from "react"
import { ProgressAnalyticsHeader } from "./progress-analytics-header"
import { KeyMetricsCards } from "./key-metrics-cards"
import { StrengthAnalytics } from "./strength-analytics"
import { VolumeAnalytics } from "./volume-analytics"
import { NutritionAnalytics } from "./nutrition-analytics"
import { DistributionAnalytics } from "./distribution-analytics"
import { BodyCompositionAnalytics } from "./body-composition-analytics"
import { AchievementsAnalytics } from "./achievements-analytics"
import { FitnessOverview } from "./fitness-overview"

export function ProgressAnalytics() {
  const [timeRange, setTimeRange] = useState("3months")
  const [tab, setTab] = useState("overview")

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selector */}
      <ProgressAnalyticsHeader timeRange={timeRange} setTimeRange={setTimeRange} />

      {/* Key Metrics Cards */}
      <KeyMetricsCards timeRange={timeRange} />

      {/* Main Analytics Tabs - Dropdown for mobile, tabs for desktop */}
      <div className="block lg:hidden">
        <Select value={tab} onValueChange={setTab}>
          <SelectTrigger className="w-full justify-center text-center">
            <SelectValue className="text-center w-full" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="overview" className="justify-center text-center">Overview</SelectItem>
            <SelectItem value="strength" className="justify-center text-center">Strength</SelectItem>
            <SelectItem value="volume" className="justify-center text-center">Volume</SelectItem>
            <SelectItem value="distribution" className="justify-center text-center">Muscle Distribution</SelectItem>
            <SelectItem value="nutrition" className="justify-center text-center">Nutrition</SelectItem>
            <SelectItem value="body" className="justify-center text-center">Body Comp</SelectItem>
            <SelectItem value="achievements" className="justify-center text-center">Achievements</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="hidden lg:block">
        <Tabs value={tab} onValueChange={setTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="strength">Strength</TabsTrigger>
            <TabsTrigger value="volume">Volume</TabsTrigger>
            <TabsTrigger value="distribution">Muscle Distribution</TabsTrigger>
            <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
            <TabsTrigger value="body">Body Comp</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Tab Content - always rendered, but only the selected one is visible */}
      <div>
        {tab === "overview" && <FitnessOverview timeRange={timeRange} />}
        {tab === "strength" && <StrengthAnalytics timeRange={timeRange} />}
        {tab === "volume" && <VolumeAnalytics timeRange={timeRange} />}
        {tab === "distribution" && <DistributionAnalytics timeRange={timeRange} />}
        {tab === "nutrition" && <NutritionAnalytics timeRange={timeRange} />}
        {tab === "body" && <BodyCompositionAnalytics timeRange={timeRange} />}
        {tab === "achievements" && <AchievementsAnalytics timeRange={timeRange} />}
      </div>
    </div>
  )
}
