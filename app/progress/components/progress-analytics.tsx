"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ProgressAnalyticsHeader } from "./progress-analytics-header"
import { KeyMetricsCards } from "./key-metrics-cards"
import { StrengthAnalytics } from "./strength-analytics"
import { VolumeAnalytics } from "./volume-analytics"
import { DistributionAnalytics } from "./distribution-analytics"
import { BodyCompositionAnalytics } from "./body-composition-analytics"
import { AchievementsAnalytics } from "./achievements-analytics"
import { FitnessOverview } from "./fitness-overview"

export function ProgressAnalytics() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Initialize state from URL parameters
  const [timeRange, setTimeRange] = useState(() => {
    return searchParams.get('period') || "3months"
  })
  const [tab, setTab] = useState(() => {
    return searchParams.get('tab') || "overview"
  })

  // Update URL when tab changes
  const handleTabChange = (newTab: string) => {
    setTab(newTab)

    // Update URL with the new tab
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', newTab)

    // Update the URL without triggering a page reload
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  // Update URL when timeRange changes (this is handled in the header component)
  const handleTimeRangeChange = (newTimeRange: string) => {
    setTimeRange(newTimeRange)
  }

  // Sync state with URL changes (for browser back/forward navigation)
  useEffect(() => {
    const urlPeriod = searchParams.get('period')
    const urlTab = searchParams.get('tab')

    if (urlPeriod && urlPeriod !== timeRange) {
      setTimeRange(urlPeriod)
    }

    if (urlTab && urlTab !== tab) {
      setTab(urlTab)
    }
  }, [searchParams, timeRange, tab])

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selector */}
      <ProgressAnalyticsHeader timeRange={timeRange} setTimeRange={handleTimeRangeChange} />

      {/* Key Metrics Cards */}
      <KeyMetricsCards timeRange={timeRange} />

      {/* Main Analytics Tabs - Dropdown for mobile, tabs for desktop */}
      <div className="block lg:hidden">
        <Select value={tab} onValueChange={handleTabChange}>
          <SelectTrigger className="w-full justify-center text-center">
            <SelectValue className="text-center w-full" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="overview" className="justify-center text-center">Overview</SelectItem>
            <SelectItem value="strength" className="justify-center text-center">Strength</SelectItem>
            <SelectItem value="volume" className="justify-center text-center">Volume</SelectItem>
            <SelectItem value="distribution" className="justify-center text-center">Muscle Distribution</SelectItem>
            <SelectItem value="body" className="justify-center text-center">Body</SelectItem>
            <SelectItem value="achievements" className="justify-center text-center">Achievements</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="hidden lg:block">
        <Tabs value={tab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="strength">Strength</TabsTrigger>
            <TabsTrigger value="volume">Volume</TabsTrigger>
            <TabsTrigger value="distribution">Muscle Distribution</TabsTrigger>
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
        {tab === "body" && <BodyCompositionAnalytics timeRange={timeRange} />}
        {tab === "achievements" && <AchievementsAnalytics timeRange={timeRange} />}
      </div>
    </div>
  )
}
