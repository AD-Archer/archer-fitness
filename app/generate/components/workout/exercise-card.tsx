"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Exercise } from "@/lib/workout-utils"
import { Dumbbell, Lock, RefreshCw, Timer, Trash2 } from "lucide-react"

interface ExerciseCardProps {
  exercise: Exercise
  onRemove?: () => void
  onRegenerate?: () => void
  isPinned?: boolean
}

export function ExerciseCard({ exercise, onRemove, onRegenerate, isPinned = false }: ExerciseCardProps) {
  const equipment = exercise.equipment && exercise.equipment.length > 0 ? exercise.equipment : ["bodyweight"]

  return (
    <div className="rounded-lg border bg-card/50 p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium leading-tight">{exercise.name}</h4>
            {exercise.isTimeBased && (
              <Badge variant="outline" className="flex items-center gap-1 text-xs">
                <Timer className="h-3 w-3" /> Time-based
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary" className="bg-transparent text-muted-foreground">
              {exercise.sets} sets × {exercise.reps}
            </Badge>
            <span>Rest: {exercise.rest}</span>
            <span>Targets: {exercise.targetMuscles.join(", ")}</span>
          </div>
        </div>
        <div className="flex gap-1">
          {isPinned ? (
            <Badge variant="outline" className="flex items-center gap-1 text-xs">
              <Lock className="h-3 w-3" /> Pinned
            </Badge>
          ) : (
            <>
              {onRegenerate && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={onRegenerate}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
              {onRemove && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={onRemove}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      <p className="mb-3 text-sm text-muted-foreground">{exercise.instructions}</p>

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {equipment.map(eq => (
          <Badge key={`${exercise.id ?? exercise.name}-${eq}`} variant="outline" className="flex items-center gap-1">
            <Dumbbell className="h-3 w-3" /> {eq}
          </Badge>
        ))}
      </div>
    </div>
  )
}