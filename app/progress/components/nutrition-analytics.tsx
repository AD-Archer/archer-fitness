"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"
import { Apple, Target } from "lucide-react"
import { useEffect } from "react"

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

const nutritionGoals = [
	{ metric: "Daily Calories", current: 2300, target: 2200, unit: "cal", adherence: 105 },
	{ metric: "Protein", current: 165, target: 150, unit: "g", adherence: 110 },
	{ metric: "Water Intake", current: 2800, target: 2500, unit: "ml", adherence: 112 },
	{ metric: "Weight Progress", current: 74.0, target: 72.0, unit: "kg", progress: 60 },
]

interface NutritionAnalyticsProps {
	timeRange?: string
}

export function NutritionAnalytics({ timeRange = "3months" }: NutritionAnalyticsProps) {
	useEffect(() => {
		console.log(`Time range selected: ${timeRange}`)
		// Add logic here to filter or fetch data based on the timeRange
	}, [timeRange])

	return (
		<div className="space-y-6">
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
		</div>
	)
}
