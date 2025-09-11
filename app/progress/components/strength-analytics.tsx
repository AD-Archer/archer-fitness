"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { TrendingUp, Award } from "lucide-react"

const strengthProgressData = [
  { date: "Jan 1", benchPress: 135, squat: 185, deadlift: 225 },
  { date: "Jan 8", benchPress: 140, squat: 190, deadlift: 235 },
  { date: "Jan 15", benchPress: 145, squat: 195, deadlift: 245 },
  { date: "Jan 22", benchPress: 150, squat: 200, deadlift: 255 },
  { date: "Jan 29", benchPress: 155, squat: 205, deadlift: 265 },
  { date: "Feb 5", benchPress: 160, squat: 210, deadlift: 275 },
]

const personalRecords = [
  { exercise: "Bench Press", weight: 160, date: "Feb 5, 2024", improvement: "+25 lbs" },
  { exercise: "Squat", weight: 210, date: "Feb 5, 2024", improvement: "+25 lbs" },
  { exercise: "Deadlift", weight: 275, date: "Feb 5, 2024", improvement: "+50 lbs" },
  { exercise: "Overhead Press", weight: 95, date: "Jan 29, 2024", improvement: "+15 lbs" },
]

export function StrengthAnalytics() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Strength Progression
          </CardTitle>
          <CardDescription>Track your major lift improvements over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={strengthProgressData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Line type="monotone" dataKey="benchPress" stroke="#3b82f6" strokeWidth={2} name="Bench Press" />
                <Line type="monotone" dataKey="squat" stroke="#10b981" strokeWidth={2} name="Squat" />
                <Line type="monotone" dataKey="deadlift" stroke="#f59e0b" strokeWidth={2} name="Deadlift" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Personal Records */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-600" />
            Personal Records
          </CardTitle>
          <CardDescription>Your current best lifts and recent improvements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {personalRecords.map((record, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-lg border bg-card/50">
                <div>
                  <h3 className="font-medium">{record.exercise}</h3>
                  <p className="text-sm text-muted-foreground">{record.date}</p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold">{record.weight} lbs</div>
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  >
                    {record.improvement}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
