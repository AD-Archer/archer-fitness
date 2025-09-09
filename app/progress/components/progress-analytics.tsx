"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts"
import { TrendingUp, Target, Award, Calendar, Dumbbell, Apple, Droplets, Scale } from "lucide-react"
import { useState } from "react"

// Sample data for charts
const strengthProgressData = [
  { date: "Jan 1", benchPress: 135, squat: 185, deadlift: 225 },
  { date: "Jan 8", benchPress: 140, squat: 190, deadlift: 235 },
  { date: "Jan 15", benchPress: 145, squat: 195, deadlift: 245 },
  { date: "Jan 22", benchPress: 150, squat: 200, deadlift: 255 },
  { date: "Jan 29", benchPress: 155, squat: 205, deadlift: 265 },
  { date: "Feb 5", benchPress: 160, squat: 210, deadlift: 275 },
]

const workoutVolumeData = [
  { week: "Week 1", volume: 12500, workouts: 4 },
  { week: "Week 2", volume: 13200, workouts: 4 },
  { week: "Week 3", volume: 14100, workouts: 5 },
  { week: "Week 4", volume: 13800, workouts: 4 },
  { week: "Week 5", volume: 15200, workouts: 5 },
  { week: "Week 6", volume: 16100, workouts: 5 },
]

const muscleGroupData = [
  { name: "Chest", value: 25, color: "#3b82f6" },
  { name: "Back", value: 22, color: "#10b981" },
  { name: "Legs", value: 28, color: "#f59e0b" },
  { name: "Shoulders", value: 15, color: "#ef4444" },
  { name: "Arms", value: 10, color: "#8b5cf6" },
]

const personalRecords = [
  { exercise: "Bench Press", weight: 160, date: "Feb 5, 2024", improvement: "+25 lbs" },
  { exercise: "Squat", weight: 210, date: "Feb 5, 2024", improvement: "+25 lbs" },
  { exercise: "Deadlift", weight: 275, date: "Feb 5, 2024", improvement: "+50 lbs" },
  { exercise: "Overhead Press", weight: 95, date: "Jan 29, 2024", improvement: "+15 lbs" },
]

const achievements = [
  {
    title: "First Month Complete",
    description: "Completed 4 weeks of consistent training",
    date: "Jan 29",
    type: "milestone",
  },
  { title: "Strength Gains", description: "Increased bench press by 25 lbs", date: "Feb 5", type: "strength" },
  { title: "Consistency Champion", description: "5 workouts completed this week", date: "Feb 3", type: "consistency" },
  { title: "Volume King", description: "Hit 16,000 lbs total volume", date: "Feb 5", type: "volume" },
]

const nutritionProgressData = [
  { date: "Jan 1", calories: 2100, protein: 140, carbs: 220, fat: 75, water: 2200, weight: 75.2 },
  { date: "Jan 8", calories: 2180, protein: 145, carbs: 235, fat: 78, water: 2400, weight: 75.0 },
  { date: "Jan 15", calories: 2220, protein: 150, carbs: 245, fat: 80, water: 2500, weight: 74.8 },
  { date: "Jan 22", calories: 2200, protein: 155, carbs: 240, fat: 82, water: 2600, weight: 74.5 },
  { date: "Jan 29", calories: 2250, protein: 160, carbs: 250, fat: 85, water: 2700, weight: 74.3 },
  { date: "Feb 5", calories: 2300, protein: 165, carbs: 260, fat: 88, water: 2800, weight: 74.0 },
]

const calorieAdherenceData = [
  { week: "Week 1", target: 2200, actual: 2100, adherence: 95 },
  { week: "Week 2", target: 2200, actual: 2180, adherence: 99 },
  { week: "Week 3", target: 2200, actual: 2220, adherence: 101 },
  { week: "Week 4", target: 2200, actual: 2200, adherence: 100 },
  { week: "Week 5", target: 2200, actual: 2250, adherence: 102 },
  { week: "Week 6", target: 2200, actual: 2300, adherence: 105 },
]

const macroDistributionData = [
  { name: "Protein", value: 30, color: "#ef4444", grams: 165 },
  { name: "Carbs", value: 45, color: "#3b82f6", grams: 260 },
  { name: "Fat", value: 25, color: "#10b981", grams: 88 },
]

const nutritionGoals = [
  { metric: "Daily Calories", current: 2300, target: 2200, unit: "cal", adherence: 105 },
  { metric: "Protein", current: 165, target: 150, unit: "g", adherence: 110 },
  { metric: "Water Intake", current: 2800, target: 2500, unit: "ml", adherence: 112 },
  { metric: "Weight Progress", current: 74.0, target: 72.0, unit: "kg", progress: 60 },
]

export function ProgressAnalytics() {
  const [timeRange, setTimeRange] = useState("6weeks")

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Progress Analytics</h2>
          <p className="text-muted-foreground">Track your fitness journey and performance trends</p>
        </div>
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

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Workouts</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">28</div>
            <p className="text-xs text-muted-foreground">+4 from last period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Daily Calories</CardTitle>
            <Apple className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,210</div>
            <p className="text-xs text-muted-foreground">102% of target</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weight Progress</CardTitle>
            <Scale className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-1.2 kg</div>
            <p className="text-xs text-muted-foreground">60% to goal</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hydration Rate</CardTitle>
            <Droplets className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">95%</div>
            <p className="text-xs text-muted-foreground">daily goal adherence</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="strength" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
          <TabsTrigger value="strength">Strength</TabsTrigger>
          <TabsTrigger value="volume">Volume</TabsTrigger>
          <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
          <TabsTrigger value="body">Body Comp</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        {/* Strength Progress Tab */}
        <TabsContent value="strength" className="space-y-6">
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
        </TabsContent>

        {/* Volume Analysis Tab */}
        <TabsContent value="volume" className="space-y-6">
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
        </TabsContent>

        {/* Nutrition Analytics Tab */}
        <TabsContent value="nutrition" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Apple className="w-5 h-5 text-emerald-600" />
                Nutrition Trends
              </CardTitle>
              <CardDescription>Track your daily nutrition intake and macro balance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={nutritionProgressData}>
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
                    <Line type="monotone" dataKey="calories" stroke="#10b981" strokeWidth={2} name="Calories" />
                    <Line type="monotone" dataKey="protein" stroke="#ef4444" strokeWidth={2} name="Protein (g)" />
                    <Line type="monotone" dataKey="water" stroke="#3b82f6" strokeWidth={2} name="Water (ml)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Calorie Adherence */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                Calorie Goal Adherence
              </CardTitle>
              <CardDescription>Weekly calorie targets vs actual intake</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={calorieAdherenceData}>
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
                    <Bar dataKey="target" fill="#e5e7eb" name="Target" />
                    <Bar dataKey="actual" fill="#10b981" name="Actual" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Nutrition Goals Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {nutritionGoals.map((goal, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{goal.metric}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-baseline gap-2">
                    <div className="text-2xl font-bold">{goal.current.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">
                      / {goal.target.toLocaleString()} {goal.unit}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span
                        className={
                          (goal.adherence ?? goal.progress ?? 0) > 100
                            ? "text-green-600"
                            : (goal.adherence ?? goal.progress ?? 0) > 90
                              ? "text-blue-600"
                              : "text-orange-600"
                        }
                      >
                        {goal.adherence || goal.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${(goal.adherence ?? goal.progress ?? 0) > 100 ? "bg-green-500" : (goal.adherence ?? goal.progress ?? 0) > 90 ? "bg-blue-500" : "bg-orange-500"}`}
                        style={{ width: `${Math.min(goal.adherence ?? goal.progress ?? 0, 100)}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Muscle Group Distribution Tab */}
        <TabsContent value="distribution" className="space-y-6">
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
        </TabsContent>

        {/* Body Composition Tab */}
        <TabsContent value="body" className="space-y-6">
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
                  <strong>Excellent progress!</strong> You've lost 1.2kg while maintaining high protein intake,
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
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-600" />
                Recent Achievements
              </CardTitle>
              <CardDescription>Milestones and accomplishments in your fitness journey</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {achievements.map((achievement, index) => (
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
                <div className="text-sm font-medium text-orange-600">200lb Bench Press</div>
                <p className="text-sm text-muted-foreground">40 lbs to go</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
