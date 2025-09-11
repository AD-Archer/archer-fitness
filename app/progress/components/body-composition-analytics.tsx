"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Scale, Target } from "lucide-react"

const nutritionProgressData = [
  { date: "Jan 1", calories: 2100, protein: 140, carbs: 220, fat: 75, water: 2200, weight: 75.2 },
  { date: "Jan 8", calories: 2180, protein: 145, carbs: 235, fat: 78, water: 2400, weight: 75.0 },
  { date: "Jan 15", calories: 2220, protein: 150, carbs: 245, fat: 80, water: 2500, weight: 74.8 },
  { date: "Jan 22", calories: 2200, protein: 155, carbs: 240, fat: 82, water: 2600, weight: 74.5 },
  { date: "Jan 29", calories: 2250, protein: 160, carbs: 250, fat: 85, water: 2700, weight: 74.3 },
  { date: "Feb 5", calories: 2300, protein: 165, carbs: 260, fat: 88, water: 2800, weight: 74.0 },
]

const macroDistributionData = [
  { name: "Protein", value: 30, color: "#ef4444", grams: 165 },
  { name: "Carbs", value: 45, color: "#3b82f6", grams: 260 },
  { name: "Fat", value: 25, color: "#10b981", grams: 88 },
]

export function BodyCompositionAnalytics() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-purple-600" />
              Weight Progress
            </CardTitle>
            <CardDescription>Track your weight changes over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={nutritionProgressData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis domain={["dataMin - 0.5", "dataMax + 0.5"]} className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="weight"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.3}
                    name="Weight (kg)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-600" />
              Macro Distribution
            </CardTitle>
            <CardDescription>Current macronutrient breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={macroDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {macroDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Macro Breakdown Details */}
      <Card>
        <CardHeader>
          <CardTitle>Macronutrient Breakdown</CardTitle>
          <CardDescription>Current intake vs recommended ranges</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {macroDistributionData.map((macro, index) => (
            <div key={index} className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: macro.color }} />
                <div>
                  <span className="font-medium">{macro.name}</span>
                  <p className="text-sm text-muted-foreground">{macro.grams}g daily average</p>
                </div>
              </div>
              <div className="text-right">
                <span className="font-bold">{macro.value}%</span>
                <p className="text-xs text-muted-foreground">
                  {macro.name === "Protein" ? "Optimal" : macro.name === "Carbs" ? "Good" : "Within range"}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Body Composition Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Body Composition Insights</CardTitle>
          <CardDescription>AI analysis of your progress and recommendations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-800 dark:text-green-200">
              <strong>Excellent progress!</strong> You&apos;ve lost 1.2kg while maintaining high protein intake,
              indicating healthy fat loss.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Hydration on track:</strong> Your water intake has improved 27% over the tracking period.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800">
            <p className="text-sm text-purple-800 dark:text-purple-200">
              <strong>Macro balance:</strong> Your 30/45/25 protein/carb/fat split is optimal for your muscle gain
              goals.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
