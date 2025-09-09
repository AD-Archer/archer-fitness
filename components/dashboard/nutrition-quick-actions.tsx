"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

export function NutritionQuickActions() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Quick Nutrition</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Nutrition Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" size="sm" className="bg-transparent flex-1">
                Log Meal
              </Button>
              <Button variant="outline" size="sm" className="bg-transparent flex-1">
                Add Water
              </Button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Protein</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm">85g / 150g</span>
                  <Badge
                    variant="secondary"
                    className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                  >
                    57%
                  </Badge>
                </div>
              </div>
              <Progress value={57} className="h-2" />

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Carbs</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm">180g / 250g</span>
                  <Badge
                    variant="secondary"
                    className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  >
                    72%
                  </Badge>
                </div>
              </div>
              <Progress value={72} className="h-2" />

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Fat</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm">45g / 80g</span>
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  >
                    56%
                  </Badge>
                </div>
              </div>
              <Progress value={56} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">AI Meal Suggestion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-950 dark:to-blue-950 border">
              <h4 className="font-medium text-emerald-900 dark:text-emerald-100">Grilled Chicken Salad</h4>
              <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">
                Perfect for your protein goals • 420 cal
              </p>
            </div>
            <Button variant="outline" size="sm" className="w-full bg-transparent">
              Generate Meal Plan
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Hydration Tracker</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">72%</div>
              <p className="text-sm text-muted-foreground">Daily water goal</p>
            </div>
            <div className="space-y-2">
              <Progress value={72} className="h-3" />
              <p className="text-sm text-center text-muted-foreground">700ml remaining</p>
            </div>
            <Button variant="outline" size="sm" className="w-full bg-transparent">
              Log Water
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
