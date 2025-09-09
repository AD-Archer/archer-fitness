import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, Calendar, TrendingUp } from "lucide-react"

const workoutHistory = [
  {
    id: "1",
    name: "Upper Body Strength",
    date: "2024-01-15",
    duration: 2700, // 45 minutes in seconds
    exercises: 4,
    totalSets: 14,
    totalReps: 168,
    avgWeight: 22.5,
    difficulty: "Intermediate",
  },
  {
    id: "2",
    name: "HIIT Cardio",
    date: "2024-01-14",
    duration: 1800, // 30 minutes
    exercises: 6,
    totalSets: 12,
    totalReps: 240,
    avgWeight: 0,
    difficulty: "Advanced",
  },
  {
    id: "3",
    name: "Lower Body Focus",
    date: "2024-01-12",
    duration: 3000, // 50 minutes
    exercises: 5,
    totalSets: 16,
    totalReps: 192,
    avgWeight: 35.2,
    difficulty: "Intermediate",
  },
]

export function WorkoutHistory() {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    return `${mins} min`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          Workout History
        </CardTitle>
        <CardDescription>Your recent training sessions and performance</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {workoutHistory.map((workout) => (
            <div key={workout.id} className="p-4 rounded-lg border bg-card/50 hover:bg-card/80 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-medium mb-1">{workout.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(workout.date)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDuration(workout.duration)}
                    </div>
                  </div>
                </div>
                <Badge variant="outline">{workout.difficulty}</Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                <div className="text-center p-2 rounded bg-muted/50">
                  <div className="text-lg font-semibold text-blue-600">{workout.exercises}</div>
                  <div className="text-xs text-muted-foreground">Exercises</div>
                </div>
                <div className="text-center p-2 rounded bg-muted/50">
                  <div className="text-lg font-semibold text-green-600">{workout.totalSets}</div>
                  <div className="text-xs text-muted-foreground">Sets</div>
                </div>
                <div className="text-center p-2 rounded bg-muted/50">
                  <div className="text-lg font-semibold text-purple-600">{workout.totalReps}</div>
                  <div className="text-xs text-muted-foreground">Reps</div>
                </div>
                <div className="text-center p-2 rounded bg-muted/50">
                  <div className="text-lg font-semibold text-orange-600">
                    {workout.avgWeight > 0 ? `${workout.avgWeight}` : "—"}
                  </div>
                  <div className="text-xs text-muted-foreground">Avg Weight</div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="bg-transparent">
                  View Details
                </Button>
                <Button variant="outline" size="sm" className="bg-transparent">
                  Repeat Workout
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 text-center">
          <Button variant="outline" className="bg-transparent">
            <TrendingUp className="w-4 h-4 mr-2" />
            View All History
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
