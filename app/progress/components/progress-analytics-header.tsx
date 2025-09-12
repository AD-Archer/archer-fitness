"use client"
import { cn } from "@/lib/utils"
import { useRouter, useSearchParams } from "next/navigation"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Calendar, TrendingUp } from "lucide-react"



interface ProgressAnalyticsHeaderProps {
  timeRange: string
  setTimeRange: (value: string) => void
}

const timeRanges = [
  { value: "7days", label: "7 Days", shortLabel: "7D" },
  { value: "4weeks", label: "4 Weeks", shortLabel: "4W" },
  { value: "3months", label: "3 Months", shortLabel: "3M" },
  { value: "6months", label: "6 Months", shortLabel: "6M" },
  { value: "1year", label: "1 Year", shortLabel: "1Y" },
]

export function ProgressAnalyticsHeader({ timeRange, setTimeRange }: ProgressAnalyticsHeaderProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Update URL when timeRange changes
  const handleTimeRangeChange = (newTimeRange: string) => {
    setTimeRange(newTimeRange)

    // Update URL with the new time range
    const params = new URLSearchParams(searchParams.toString())
    params.set('period', newTimeRange)

    // Update the URL without triggering a page reload
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="flex items-center justify-between bg-card rounded-lg border p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Analytics Dashboard</h2>
          </div>
          <div className="hidden sm:block text-sm text-muted-foreground">
            Track your fitness progress and performance metrics
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Desktop: Tab-like buttons */}
          <div className="hidden md:flex items-center bg-muted rounded-lg p-1">
            {timeRanges.map((range) => (
              <Button
                key={range.value}
                variant={timeRange === range.value ? "default" : "ghost"}
                size="sm"
                onClick={() => handleTimeRangeChange(range.value)}
                className={cn(
                  "text-xs font-medium transition-all duration-200",
                  timeRange === range.value
                    ? "bg-background shadow-sm text-primary"
                    : "hover:bg-background/50"
                )}
              >
                {range.shortLabel}
              </Button>
            ))}
          </div>

          {/* Mobile: Dropdown */}
          <div className="md:hidden">
            <Select value={timeRange} onValueChange={handleTimeRangeChange}>
              <SelectTrigger className="w-28 h-9">
                <Calendar className="w-4 h-4 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeRanges.map((range) => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tablet: Medium buttons */}
          <div className="hidden sm:flex md:hidden items-center bg-muted rounded-lg p-1">
            {timeRanges.map((range) => (
              <Button
                key={range.value}
                variant={timeRange === range.value ? "default" : "ghost"}
                size="sm"
                onClick={() => setTimeRange(range.value)}
                className={cn(
                  "text-xs font-medium px-2 transition-all duration-200",
                  timeRange === range.value
                    ? "bg-background shadow-sm text-primary"
                    : "hover:bg-background/50"
                )}
              >
                {range.shortLabel}
              </Button>
            ))}
          </div>
        </div>
      </div>
  )
}
