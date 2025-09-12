"use client"

import { Badge } from "@/components/ui/badge"

interface Exercise {
  name: string
  sets: number
  reps: string
  rest: string
  instructions: string
  targetMuscles: string[]
}

interface ExerciseCardProps {
  exercise: Exercise
}

export function ExerciseCard({ exercise }: ExerciseCardProps) {
  return (
    <div className="p-4 rounded-lg border bg-card/50">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium">{exercise.name}</h4>
        <Badge variant="secondary" className="text-xs">
          {exercise.sets} sets × {exercise.reps}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground mb-2">{exercise.instructions}</p>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>Rest: {exercise.rest}</span>
        <span>Targets: {exercise.targetMuscles.join(", ")}</span>
      </div>
    </div>
  )
}