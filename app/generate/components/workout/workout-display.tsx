"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Target, Clock, Dumbbell, Play, RefreshCw, Zap } from "lucide-react"
import { ExerciseCard } from "./exercise-card"
import { WarmupCooldownSection } from "./warmup-cooldown-section"

interface Exercise {
  name: string
  sets: number
  reps: string
  rest: string
  instructions: string
  targetMuscles: string[]
}

interface WorkoutPlan {
  name: string
  duration: number
  difficulty: string
  exercises: Exercise[]
  warmup: string[]
  cooldown: string[]
}

interface WorkoutDisplayProps {
  workout: WorkoutPlan
  userNotes?: string
  onRegenerate: () => void
}

export function WorkoutDisplay({ workout, userNotes, onRegenerate }: WorkoutDisplayProps) {
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
          <Button className="bg-green-600 hover:bg-green-700">
            <Play className="w-4 h-4 mr-2" />
            Start Workout
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

        <div>
          <h3 className="font-semibold mb-4 text-blue-600">Main Workout</h3>
          <div className="space-y-4">
            {workout.exercises.map((exercise, index) => (
              <ExerciseCard key={index} exercise={exercise} />
            ))}
          </div>
        </div>

        <Separator />

        <WarmupCooldownSection
          title="Cool-down (5 min)"
          items={workout.cooldown}
          colorClass="text-purple-600"
        />

        <div className="flex gap-3 pt-4">
          <Button variant="outline" className="flex-1 bg-transparent">
            Save Workout
          </Button>
          <Button variant="outline" className="flex-1 bg-transparent">
            Share
          </Button>
          <Button onClick={onRegenerate} variant="outline">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}