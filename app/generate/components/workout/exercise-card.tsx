"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Exercise } from "@/lib/workout-utils"
import { Dumbbell, Lock, RefreshCw, Timer, Trash2, Eye } from "lucide-react"
import { useState } from "react"

interface ExerciseCardProps {
  exercise: Exercise
  onRemove?: () => void
  onRegenerate?: () => void
  isPinned?: boolean
}

export function ExerciseCard({ exercise, onRemove, onRegenerate, isPinned = false }: ExerciseCardProps) {
  const equipment = exercise.equipment && exercise.equipment.length > 0 ? exercise.equipment : ["bodyweight"]
  const [showGifModal, setShowGifModal] = useState(false)

  return (
    <>
      <div className="rounded-lg border bg-card/50 p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="font-medium leading-tight">{exercise.name}</h4>
              {exercise.gifUrl && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowGifModal(true)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              )}
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

      {/* GIF Modal */}
      <Dialog open={showGifModal} onOpenChange={setShowGifModal}>
        <DialogContent className="w-[95vw] mx-auto max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg md:text-xl">
              <Eye className="w-5 h-5 text-green-600" />
              {exercise.name} - Exercise Demo
            </DialogTitle>
            <DialogDescription>
              Watch the proper form for this exercise
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-center py-4">
            {exercise.gifUrl ? (
              <div className="relative w-full max-w-2xl">
                <img
                  src={exercise.gifUrl}
                  alt={`${exercise.name} exercise demonstration`}
                  className="w-full h-auto rounded-lg shadow-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      const errorDiv = document.createElement('div');
                      errorDiv.className = 'text-center py-12 text-muted-foreground';
                      errorDiv.innerHTML = `
                        <div class="text-lg mb-2">GIF not available</div>
                        <div class="text-sm">The demonstration video for this exercise is not currently available.</div>
                      `;
                      parent.appendChild(errorDiv);
                    }
                  }}
                />
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Eye className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <div className="text-lg mb-2">GIF not available</div>
                <div className="text-sm">The demonstration video for this exercise is not currently available.</div>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button onClick={() => setShowGifModal(false)} className="w-full sm:w-auto">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}