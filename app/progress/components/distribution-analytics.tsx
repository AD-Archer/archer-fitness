"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { Target } from "lucide-react"

const muscleGroupData = [
  { name: "Chest", value: 25, color: "#3b82f6" },
  { name: "Back", value: 22, color: "#10b981" },
  { name: "Legs", value: 28, color: "#f59e0b" },
  { name: "Shoulders", value: 15, color: "#ef4444" },
  { name: "Arms", value: 10, color: "#8b5cf6" },
]

export function DistributionAnalytics() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-orange-600" />
              Muscle Group Focus
            </CardTitle>
            <CardDescription>Distribution of training volume by muscle group</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={muscleGroupData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {muscleGroupData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Muscle Group Breakdown</CardTitle>
            <CardDescription>Percentage of total training volume</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {muscleGroupData.map((group, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: group.color }} />
                  <span className="font-medium">{group.name}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold">{group.value}%</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Training Balance Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Training Balance Insights</CardTitle>
          <CardDescription>AI recommendations for optimal muscle group distribution</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Great balance!</strong> Your leg training (28%) is well-proportioned to upper body work.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Consider more shoulder work:</strong> Shoulders (15%) could benefit from additional volume.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
