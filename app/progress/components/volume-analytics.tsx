"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Dumbbell } from "lucide-react"

const workoutVolumeData = [
  { week: "Week 1", volume: 12500, workouts: 4 },
  { week: "Week 2", volume: 13200, workouts: 4 },
  { week: "Week 3", volume: 14100, workouts: 5 },
  { week: "Week 4", volume: 13800, workouts: 4 },
  { week: "Week 5", volume: 15200, workouts: 5 },
  { week: "Week 6", volume: 16100, workouts: 5 },
]

export function VolumeAnalytics() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-green-600" />
            Training Volume Trends
          </CardTitle>
          <CardDescription>Weekly volume and workout frequency analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workoutVolumeData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="week" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="volume" fill="#10b981" name="Volume (lbs)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Volume Breakdown */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Average Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">14.2K</div>
            <p className="text-sm text-muted-foreground">lbs per week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Peak Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">16.1K</div>
            <p className="text-sm text-muted-foreground">highest week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Volume Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">+28%</div>
            <p className="text-sm text-muted-foreground">vs first week</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
