"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ProgressAnalyticsHeaderProps {
  timeRange: string
  setTimeRange: (value: string) => void
}

export function ProgressAnalyticsHeader({ timeRange, setTimeRange }: ProgressAnalyticsHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <Select value={timeRange} onValueChange={setTimeRange}>
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="4weeks">Last 4 Weeks</SelectItem>
          <SelectItem value="6weeks">Last 6 Weeks</SelectItem>
          <SelectItem value="3months">Last 3 Months</SelectItem>
          <SelectItem value="6months">Last 6 Months</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
