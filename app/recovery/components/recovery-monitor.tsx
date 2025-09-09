"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"
import { Moon, Heart, Zap, Brain, TrendingUp, Plus, CheckCircle, AlertTriangle } from "lucide-react"

interface RecoveryMetrics {
  sleepHours: number
  sleepQuality: number
  energyLevel: number
  muscleRecovery: number
  stressLevel: number
  hydration: number
  mood: number
  date: string
}

const recoveryTrendData = [
  { date: "Jan 1", sleep: 7.5, energy: 8, recovery: 7, stress: 3 },
  { date: "Jan 2", sleep: 6.5, energy: 6, recovery: 6, stress: 5 },
  { date: "Jan 3", sleep: 8.0, energy: 9, recovery: 8, stress: 2 },
  { date: "Jan 4", sleep: 7.0, energy: 7, recovery: 7, stress: 4 },
  { date: "Jan 5", sleep: 8.5, energy: 9, recovery: 9, stress: 2 },
  { date: "Jan 6", sleep: 6.0, energy: 5, recovery: 5, stress: 6 },
  { date: "Jan 7", sleep: 9.0, energy: 10, recovery: 9, stress: 1 },
]

const recoveryRadarData = [
  { metric: "Sleep Quality", value: 8, fullMark: 10 },
  { metric: "Energy Level", value: 7, fullMark: 10 },
  { metric: "Muscle Recovery", value: 6, fullMark: 10 },
  { metric: "Hydration", value: 9, fullMark: 10 },
  { metric: "Mood", value: 8, fullMark: 10 },
  { metric: "Low Stress", value: 7, fullMark: 10 },
]

const recoveryRecommendations = [
  {
    type: "sleep",
    priority: "high",
    title: "Improve Sleep Duration",
    description: "Your average sleep is 6.8 hours. Aim for 7-9 hours for optimal recovery.",
    action: "Set a consistent bedtime routine",
  },
  {
    type: "hydration",
    priority: "medium",
    title: "Maintain Hydration",
    description: "Great hydration levels! Keep drinking water throughout the day.",
    action: "Continue current hydration habits",
  },
  {
    type: "stress",
    priority: "high",
    title: "Manage Stress Levels",
    description: "Elevated stress can impact recovery. Consider relaxation techniques.",
    action: "Try meditation or deep breathing exercises",
  },
]

export function RecoveryMonitor() {
  const [currentMetrics, setCurrentMetrics] = useState<Partial<RecoveryMetrics>>({
    sleepHours: 7,
    sleepQuality: 7,
    energyLevel: 7,
    muscleRecovery: 6,
    stressLevel: 4,
    hydration: 8,
    mood: 7,
  })

  const [showLogForm, setShowLogForm] = useState(false)

  const handleMetricChange = (metric: keyof RecoveryMetrics, value: number[]) => {
    setCurrentMetrics((prev) => ({ ...prev, [metric]: value[0] }))
  }

  const logRecoveryData = () => {
    const newEntry = {
      ...currentMetrics,
      date: new Date().toISOString().split("T")[0],
    } as RecoveryMetrics

    console.log("[v0] Logging recovery data:", newEntry)
    setShowLogForm(false)
    // Here you would save to database
  }

  const getRecoveryScore = () => {
    const metrics = currentMetrics
    if (!metrics.sleepQuality || !metrics.energyLevel || !metrics.muscleRecovery) return 0

    const score =
      metrics.sleepQuality * 0.3 +
      metrics.energyLevel * 0.25 +
      metrics.muscleRecovery * 0.25 +
      (10 - (metrics.stressLevel || 5)) * 0.2
    return Math.round(score * 10)
  }

  const getRecoveryStatus = (score: number) => {
    if (score >= 80) return { status: "Excellent", color: "text-green-600", bgColor: "bg-green-100 dark:bg-green-900" }
    if (score >= 65) return { status: "Good", color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-900" }
    if (score >= 50) return { status: "Fair", color: "text-yellow-600", bgColor: "bg-yellow-100 dark:bg-yellow-900" }
    return { status: "Poor", color: "text-red-600", bgColor: "bg-red-100 dark:bg-red-900" }
  }

  const recoveryScore = getRecoveryScore()
  const recoveryStatus = getRecoveryStatus(recoveryScore)

  return (
    <div className="space-y-6">
      {/* Recovery Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recovery Score</CardTitle>
            <Heart className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recoveryScore}%</div>
            <Badge className={`${recoveryStatus.bgColor} ${recoveryStatus.color} mt-1`}>{recoveryStatus.status}</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sleep Quality</CardTitle>
            <Moon className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentMetrics.sleepQuality}/10</div>
            <p className="text-xs text-muted-foreground">{currentMetrics.sleepHours}h last night</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Energy Level</CardTitle>
            <Zap className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentMetrics.energyLevel}/10</div>
            <p className="text-xs text-muted-foreground">Current energy</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Muscle Recovery</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentMetrics.muscleRecovery}/10</div>
            <p className="text-xs text-muted-foreground">Recovery status</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Recovery Tabs */}
      <Tabs defaultValue="today" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="today">Today's Status</TabsTrigger>
            <TabsTrigger value="trends">Recovery Trends</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>

          <Button
            onClick={() => setShowLogForm(!showLogForm)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Log Recovery Data
          </Button>
        </div>

        {/* Today's Status Tab */}
        <TabsContent value="today" className="space-y-6">
          {/* Recovery Logging Form */}
          {showLogForm && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-blue-600" />
                  Log Today's Recovery Metrics
                </CardTitle>
                <CardDescription>Track your recovery indicators for personalized insights</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Sleep Hours */}
                  <div className="space-y-3">
                    <Label>Sleep Duration: {currentMetrics.sleepHours} hours</Label>
                    <Slider
                      value={[currentMetrics.sleepHours || 7]}
                      onValueChange={(value) => handleMetricChange("sleepHours", value)}
                      max={12}
                      min={3}
                      step={0.5}
                      className="w-full"
                    />
                  </div>

                  {/* Sleep Quality */}
                  <div className="space-y-3">
                    <Label>Sleep Quality: {currentMetrics.sleepQuality}/10</Label>
                    <Slider
                      value={[currentMetrics.sleepQuality || 7]}
                      onValueChange={(value) => handleMetricChange("sleepQuality", value)}
                      max={10}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  {/* Energy Level */}
                  <div className="space-y-3">
                    <Label>Energy Level: {currentMetrics.energyLevel}/10</Label>
                    <Slider
                      value={[currentMetrics.energyLevel || 7]}
                      onValueChange={(value) => handleMetricChange("energyLevel", value)}
                      max={10}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  {/* Muscle Recovery */}
                  <div className="space-y-3">
                    <Label>Muscle Recovery: {currentMetrics.muscleRecovery}/10</Label>
                    <Slider
                      value={[currentMetrics.muscleRecovery || 6]}
                      onValueChange={(value) => handleMetricChange("muscleRecovery", value)}
                      max={10}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  {/* Stress Level */}
                  <div className="space-y-3">
                    <Label>Stress Level: {currentMetrics.stressLevel}/10</Label>
                    <Slider
                      value={[currentMetrics.stressLevel || 4]}
                      onValueChange={(value) => handleMetricChange("stressLevel", value)}
                      max={10}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  {/* Hydration */}
                  <div className="space-y-3">
                    <Label>Hydration Level: {currentMetrics.hydration}/10</Label>
                    <Slider
                      value={[currentMetrics.hydration || 8]}
                      onValueChange={(value) => handleMetricChange("hydration", value)}
                      max={10}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button onClick={logRecoveryData} className="flex-1">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Save Recovery Data
                  </Button>
                  <Button variant="outline" onClick={() => setShowLogForm(false)} className="bg-transparent">
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recovery Radar Chart */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  Recovery Profile
                </CardTitle>
                <CardDescription>Your current recovery metrics overview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={recoveryRadarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="metric" className="text-xs" />
                      <PolarRadiusAxis angle={90} domain={[0, 10]} className="text-xs" />
                      <Radar
                        name="Recovery"
                        dataKey="value"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Recovery Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-500" />
                  Recovery Insights
                </CardTitle>
                <CardDescription>AI-powered analysis of your recovery status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-green-800 dark:text-green-200">Good Hydration</span>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Your hydration levels are excellent. This supports optimal recovery and performance.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    <span className="font-medium text-yellow-800 dark:text-yellow-200">Moderate Recovery</span>
                  </div>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Muscle recovery is moderate. Consider a lighter workout or active recovery today.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Moon className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-blue-800 dark:text-blue-200">Sleep Optimization</span>
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Aim for 7-9 hours of sleep tonight to improve tomorrow's recovery score.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Recovery Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Recovery Trends (Last 7 Days)
              </CardTitle>
              <CardDescription>Track your recovery patterns over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={recoveryTrendData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis domain={[0, 10]} className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Line type="monotone" dataKey="sleep" stroke="#3b82f6" strokeWidth={2} name="Sleep Quality" />
                    <Line type="monotone" dataKey="energy" stroke="#10b981" strokeWidth={2} name="Energy Level" />
                    <Line type="monotone" dataKey="recovery" stroke="#f59e0b" strokeWidth={2} name="Muscle Recovery" />
                    <Line type="monotone" dataKey="stress" stroke="#ef4444" strokeWidth={2} name="Stress Level" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Recovery Statistics */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Average Sleep</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">7.4h</div>
                <p className="text-sm text-muted-foreground">per night this week</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Recovery Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">+15%</div>
                <p className="text-sm text-muted-foreground">improvement this week</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Best Day</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">Jan 7</div>
                <p className="text-sm text-muted-foreground">highest recovery score</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-600" />
                Personalized Recovery Recommendations
              </CardTitle>
              <CardDescription>AI-powered suggestions to optimize your recovery</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recoveryRecommendations.map((rec, index) => (
                <div key={index} className="p-4 rounded-lg border bg-card/50">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={rec.priority === "high" ? "destructive" : "secondary"} className="text-xs">
                        {rec.priority} priority
                      </Badge>
                      <h3 className="font-medium">{rec.title}</h3>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{rec.description}</p>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium">{rec.action}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recovery Tips */}
          <Card>
            <CardHeader>
              <CardTitle>Recovery Tips</CardTitle>
              <CardDescription>Evidence-based strategies for better recovery</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 rounded-lg bg-muted/50">
                <h4 className="font-medium mb-1">Sleep Hygiene</h4>
                <p className="text-sm text-muted-foreground">
                  Maintain a consistent sleep schedule and create a cool, dark sleeping environment.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <h4 className="font-medium mb-1">Active Recovery</h4>
                <p className="text-sm text-muted-foreground">
                  Light movement like walking or gentle stretching can enhance recovery.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <h4 className="font-medium mb-1">Nutrition Timing</h4>
                <p className="text-sm text-muted-foreground">
                  Consume protein within 2 hours post-workout to support muscle recovery.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
