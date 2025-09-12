"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Award } from "lucide-react"
import { useUserPreferences } from "@/hooks/use-user-preferences"
import { formatWeight, formatVolume } from "@/lib/weight-utils"

interface AchievementsAnalyticsProps {
  timeRange?: string
}

export function AchievementsAnalytics({ timeRange = "3months" }: AchievementsAnalyticsProps) {
  const { units } = useUserPreferences()
  
  // Use timeRange in the title to avoid unused variable warning
  const rangeLabel = timeRange === "3months" ? "Recent" : `${timeRange}`

  // Dynamic achievement data based on user units
  const dynamicAchievements = [
    {
      title: "Strength Gains",
      description: `Increased bench press by ${formatWeight(25, units)}`, // 25 lbs in database format
      date: "Feb 5",
      type: "strength" as const,
    },
    {
      title: "Consistency Champion",
      description: "Completed 4 weeks of consistent training",
      date: "Jan 29",
      type: "milestone" as const,
    },
    {
      title: "Volume King",
      description: `Hit ${formatVolume(16000, units)} total volume`, // 16,000 lbs in database format
      date: "Feb 5",
      type: "volume" as const,
    },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-600" />
            {rangeLabel} Achievements
          </CardTitle>
          <CardDescription>Milestones and accomplishments in your fitness journey</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dynamicAchievements.map((achievement, index) => (
              <div key={index} className="flex items-start gap-4 p-4 rounded-lg border bg-card/50">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{achievement.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{achievement.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {achievement.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{achievement.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Achievement Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Total Achievements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">12</div>
            <p className="text-sm text-muted-foreground">unlocked so far</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">4</div>
            <p className="text-sm text-muted-foreground">new achievements</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Next Goal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium text-orange-600">{formatWeight(200, units)} Bench Press</div>
            <p className="text-sm text-muted-foreground">{formatWeight(40, units)} to go</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
