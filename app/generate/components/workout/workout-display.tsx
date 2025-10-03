"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Target, Clock, Dumbbell, Play, RefreshCw, Zap, PlusCircle } from "lucide-react"
import { ExerciseCard } from "./exercise-card"
import { WarmupCooldownSection } from "./warmup-cooldown-section"
import {
  transformWorkoutPlanToTemplate,
  transformWorkoutPlanToSession,
  saveWorkoutAsTemplate,
  startWorkoutSession,
  WorkoutPlan,
} from "@/lib/workout-utils"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

interface WorkoutDisplayProps {
  workout: WorkoutPlan
  userNotes?: string
  onRegeneratePlan?: () => void
  onRemoveExercise?: (exerciseId: string) => void
  onRegenerateExercise?: (exerciseId: string) => void
  onAddExercise?: () => void
}

export function WorkoutDisplay({
  workout,
  userNotes,
  onRegeneratePlan,
  onRemoveExercise,
  onRegenerateExercise,
  onAddExercise,
}: WorkoutDisplayProps) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [isStarting, setIsStarting] = useState(false)

  const handleSaveWorkout = async () => {
    try {
      setIsSaving(true)
      const templateData = transformWorkoutPlanToTemplate(workout)
      await saveWorkoutAsTemplate(templateData)
      
      toast.success("Workout saved as template with AI-generated flag.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save workout")
    } finally {
      setIsSaving(false)
    }
  }

  const handleStartWorkout = async () => {
    try {
      setIsStarting(true)
      const sessionData = transformWorkoutPlanToSession(workout)
      const session = await startWorkoutSession(sessionData)
      
      toast.success("Workout started! Redirecting to workout tracker...")
      
      // Redirect to track page with the session ID
      router.push(`/track?sessionId=${(session as { id: string }).id}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to start workout")
    } finally {
      setIsStarting(false)
    }
  }
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-green-600" />
              {workout.name}
            </CardTitle>
            <CardDescription className="flex items-center gap-4 mt-2">
              <Badge variant="outline">{workout.difficulty}</Badge>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {workout.duration} min
              </div>
              <div className="flex items-center gap-1">
                <Dumbbell className="w-3 h-3" />
                {workout.exercises.length} exercises
              </div>
            </CardDescription>
          </div>
          <Button className="bg-green-600 hover:bg-green-700" onClick={handleStartWorkout} disabled={isStarting}>
            <Play className="w-4 h-4 mr-2" />
            {isStarting ? "Starting..." : "Start Workout"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {userNotes && (
          <>
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
              <h3 className="font-semibold mb-2 text-blue-900 dark:text-blue-100 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                AI Insights
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Based on your notes: {`"${userNotes.slice(0, 100)}${userNotes.length > 100 ? "..." : ""}"`}, I&apos;ve customized this workout to match your specific
                needs and preferences.
              </p>
            </div>
            <Separator />
          </>
        )}

        <WarmupCooldownSection
          title="Warm-up (5 min)"
          items={workout.warmup}
          colorClass="text-orange-600"
        />

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold text-blue-600">Main Workout</h3>
            {onAddExercise && (
              <Button size="sm" variant="outline" onClick={onAddExercise} className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                Add exercise
              </Button>
            )}
          </div>
          <div className="space-y-4">
            {workout.exercises.map((exercise, index) => {
              const exerciseId = exercise.id ?? `${exercise.name.toLowerCase().replace(/\s+/g, "-")}-${index}`

              return (
                <ExerciseCard
                  key={exerciseId}
                  exercise={exercise}
                  isPinned={false}
                  onRegenerate={onRegenerateExercise ? () => onRegenerateExercise(exerciseId) : undefined}
                  onRemove={onRemoveExercise ? () => onRemoveExercise(exerciseId) : undefined}
                />
              )
            })}
          </div>
        </div>

        <Separator />

        <WarmupCooldownSection
          title="Cool-down (5 min)"
          items={workout.cooldown}
          colorClass="text-purple-600"
        />

        <div className="flex flex-wrap gap-3 pt-4">
          {onAddExercise && (
            <Button variant="outline" className="bg-transparent" onClick={onAddExercise}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add exercise
            </Button>
          )}
          <div className="ml-auto flex gap-3">
            <Button variant="outline" className="bg-transparent" onClick={handleSaveWorkout} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Workout"}
            </Button>
            <Button onClick={onRegeneratePlan} variant="outline">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}