import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, CheckCircle } from "lucide-react"
import { useEffect, useState } from "react"
import { WorkoutDetailsModal } from "./workout-details-modal"

interface WorkoutSession {
  id: string
  name: string
  date: Date | string
  duration: number
  exercises: Array<{
    exerciseId: string
    sets: Array<{
      reps: number
      weight?: number
      completed: boolean
    }>
  }>
  status: "completed" | "in_progress" | "skipped"
  notes?: string
  templateId?: string
}

interface WorkoutTemplate {
  id: string
  name: string
  description: string
  difficulty: "beginner" | "intermediate" | "advanced"
  duration: number
  exercises: Array<{
    id: string
    name: string
  }>
}

interface ApiWorkoutSession {
  id: string
  name: string
  startTime: string
  duration: number | null
  exercises: Array<{
    exerciseId: string
    sets: Array<{
      reps: number
      weight?: number
      completed: boolean
    }>
  }>
  status: string
  notes?: string
  workoutTemplateId?: string
  workoutTemplate?: {
    id: string
    name: string
    difficulty: string
    exercises: Array<{
      id: string
      name: string
    }>
  }
}

interface ApiWorkoutTemplate {
  id: string
  name: string
  description?: string
  estimatedDuration?: number
  difficulty: string
  exercises?: Array<{
    exercise?: {
      id: string
      name: string
    }
    exerciseId: string
  }>
}

interface ApiTemplatesResponse {
  userTemplates: ApiWorkoutTemplate[]
  predefinedTemplates: ApiWorkoutTemplate[]
}

export function RecentWorkouts({ onRepeatWorkout }: { onRepeatWorkout?: (workout: WorkoutSession) => void }) {
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutSession[]>([])
  const [workoutTemplates, setWorkoutTemplates] = useState<WorkoutTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutSession | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch recent workout sessions
        const sessionsResponse = await fetch('/api/workout-sessions?limit=3')
        let sessionsData: ApiWorkoutSession[] = []
        if (sessionsResponse.ok) {
          sessionsData = await sessionsResponse.json()
        }

        // Fetch workout templates
        const templatesResponse = await fetch('/api/workout-templates?limit=10')
        let templatesData: ApiTemplatesResponse = { userTemplates: [], predefinedTemplates: [] }
        if (templatesResponse.ok) {
          templatesData = await templatesResponse.json()
        }

        // Transform sessions data
        const transformedSessions = sessionsData.map((session) => ({
          id: session.id,
          name: session.name,
          date: new Date(session.startTime),
          duration: session.duration || 0,
          exercises: session.exercises || [],
          status: session.status as "completed" | "in_progress" | "skipped",
          notes: session.notes,
          templateId: session.workoutTemplateId,
        }))

        setRecentWorkouts(transformedSessions)

        // Transform templates data
        const allTemplates = [...templatesData.userTemplates, ...templatesData.predefinedTemplates]
        const transformedTemplates = allTemplates.map((template: ApiWorkoutTemplate) => ({
          id: template.id,
          name: template.name,
          description: template.description || template.name,
          difficulty: template.difficulty as "beginner" | "intermediate" | "advanced",
          duration: template.estimatedDuration || 0,
          exercises: template.exercises?.map((ex) => ({
            id: ex.exercise?.id || ex.exerciseId,
            name: ex.exercise?.name || "Unknown Exercise",
          })) || [],
        }))

        setWorkoutTemplates(transformedTemplates)

      } catch (error) {
        console.error('Failed to fetch recent workouts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Helper function to format date
  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (dateObj.toDateString() === today.toDateString()) return "Today"
    if (dateObj.toDateString() === yesterday.toDateString()) return "Yesterday"

    const daysAgo = Math.floor((today.getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24))
    return `${daysAgo} days ago`
  }

  // Helper function to get template info
  const getTemplateInfo = (templateId?: string) => {
    if (!templateId) {
      return {
        difficulty: "intermediate" as const,
        exercises: [],
      }
    }
    const template = workoutTemplates.find((t) => t.id === templateId)
    return template || {
      difficulty: "intermediate" as const,
      exercises: [],
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Workouts</CardTitle>
          <CardDescription>Your latest training sessions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Loading recent workouts...
          </div>
        </CardContent>
      </Card>
    )
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
                  <WorkoutDetailsModal
                    workout={selectedWorkout}
                    onRepeat={onRepeatWorkout}
                    trigger={
                      <Button variant="ghost" size="sm" onClick={() => setSelectedWorkout(workout)}>
                        View Details
                      </Button>
                    }
                  />
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
