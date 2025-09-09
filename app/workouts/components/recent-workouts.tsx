import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, CheckCircle } from "lucide-react"
import { getRecentWorkouts, getWorkoutTemplates } from "@/lib/data-store"

export function RecentWorkouts() {
  const recentWorkouts = getRecentWorkouts(3)
  const workoutTemplates = getWorkoutTemplates()

  // Helper function to format date
  const formatDate = (date: Date) => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) return "Today"
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday"

    const daysAgo = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    return `${daysAgo} days ago`
  }

  // Helper function to get template info
  const getTemplateInfo = (templateId: string) => {
    const template = workoutTemplates.find((t) => t.id === templateId)
    return template || { difficulty: "Intermediate", exercises: [] }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Workouts</CardTitle>
        <CardDescription>Your latest training sessions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentWorkouts.map((workout) => {
            const template = getTemplateInfo(workout.templateId)
            return (
              <div key={workout.id} className="flex items-center justify-between p-4 rounded-lg border bg-card/50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-medium">{workout.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span>{formatDate(workout.date)}</span>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {workout.duration} min
                      </div>
                      <span>{template.exercises.length} exercises</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">
                    {template.difficulty}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    View Details
                  </Button>
                </div>
              </div>
            )
          })}
          {recentWorkouts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No recent workouts found. Start your first workout!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
