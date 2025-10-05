"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Dumbbell, Play, Plus, Trash2, Zap, User, Settings, ListPlus } from "lucide-react"
import { CustomWorkoutForm } from "./custom-workout-form"
import type { WorkoutTemplate } from "../types/workout"

interface WorkoutSelectionProps {
  availableWorkouts: WorkoutTemplate[]
  onStartWorkout: (workout: WorkoutTemplate) => void
  onDeleteWorkout: (workoutId: string) => void
  onSaveCustomWorkout: (workout: WorkoutTemplate) => void
  onEditCustomWorkout?: (workout: WorkoutTemplate) => void
}

export function WorkoutSelection({
  availableWorkouts,
  onStartWorkout,
  onDeleteWorkout,
  onSaveCustomWorkout,
  onEditCustomWorkout,
}: WorkoutSelectionProps) {
  const [showCustomWorkoutDialog, setShowCustomWorkoutDialog] = useState(false)
  const [editingWorkout, setEditingWorkout] = useState<WorkoutTemplate | null>(null)
  
  // Filter out premade workouts, only show AI-generated and custom workouts
  const filteredWorkouts = availableWorkouts.filter(workout => 
    workout.isAIGenerated || workout.isCustom || workout.name.toLowerCase().includes('ai-generated')
  )

  const startBlankWorkout = () => {
    const blankWorkout: WorkoutTemplate = {
      id: `blank-${Date.now()}`,
      name: "Blank Workout",
      description: "Empty workout session - add exercises as you go",
      estimatedDuration: 0,
      exercises: [],
      isCustom: true,
      isAIGenerated: false,
    }
    onStartWorkout(blankWorkout)
  }
  
  const getWorkoutTypeInfo = (workout: WorkoutTemplate) => {
    if (workout.isAIGenerated || workout.name.toLowerCase().includes('ai-generated')) {
      return {
        icon: Zap,
        label: 'AI Generated',
        bgColor: 'bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30',
        borderColor: 'border-purple-200 dark:border-purple-800',
        iconColor: 'text-purple-600',
        badgeVariant: 'secondary' as const
      }
    } else if (workout.isCustom) {
      return {
        icon: User,
        label: 'Custom',
        bgColor: 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30',
        borderColor: 'border-green-200 dark:border-green-800',
        iconColor: 'text-green-600',
        badgeVariant: 'secondary' as const
      }
    } else {
      return {
        icon: Settings,
        label: 'Premade',
        bgColor: 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30',
        borderColor: 'border-blue-200 dark:border-blue-800',
        iconColor: 'text-blue-600',
        badgeVariant: 'outline' as const
      }
    }
  }

  return (
  <div className="space-y-6 xl:space-y-8">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
        <Dumbbell className="w-6 h-6 text-blue-600" />
        Choose Your Workout
          </CardTitle>
          <CardDescription>Create a custom workout or <a href="/generate" className="text-blue-500 hover:underline">generate one with AI</a></CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredWorkouts.map((workout) => {
              const typeInfo = getWorkoutTypeInfo(workout)
              const Icon = typeInfo.icon
              
              return (
                <Card 
                  key={workout.id} 
                  className={`cursor-pointer hover:shadow-md transition-all hover:scale-[1.02] ${typeInfo.bgColor} ${typeInfo.borderColor} border-2`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className={`w-4 h-4 ${typeInfo.iconColor}`} />
                          <Badge variant={typeInfo.badgeVariant} className="text-xs">
                            {typeInfo.label}
                          </Badge>
                        </div>
                        <CardTitle className="text-base flex items-center">
                          {workout.name}
                          {workout.isCustom && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                if (confirm("Are you sure you want to delete this workout?")) {
                                  onDeleteWorkout(workout.id)
                                }
                              }}
                              className="ml-2 h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                              title="Delete workout"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </CardTitle>
                        <CardDescription className="text-sm">{workout.description}</CardDescription>
                      </div>
                      {workout.isCustom && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingWorkout(workout)
                            setShowCustomWorkoutDialog(true)
                          }}
                          className="h-7 px-2 text-xs"
                        >
                          Edit
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span>Exercises:</span>
                        <span>{workout.exercises.length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Duration:</span>
                        <span>~{workout.estimatedDuration} min</span>
                      </div>
                    </div>
                    <Button
                      onClick={() => onStartWorkout(workout)}
                      className={`w-full ${
                        workout.isAIGenerated || workout.name.toLowerCase().includes('ai-generated')
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
                          : workout.isCustom
                          ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                          : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                      }`}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start Workout
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4">
            <Button 
              onClick={startBlankWorkout}
              variant="default"
              className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
            >
              <ListPlus className="w-4 h-4 mr-2" />
              Start Blank Workout
            </Button>

            <Dialog open={showCustomWorkoutDialog} onOpenChange={(open) => { if (!open) { setEditingWorkout(null) } setShowCustomWorkoutDialog(open) }}>
              <DialogTrigger asChild>
                <Button variant="outline" className="bg-transparent">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Custom Workout
                </Button>
              </DialogTrigger>
              <DialogContent
                className="w-[98vw] sm:w-[98vw] md:w-[96vw] lg:w-[95vw] xl:w-[92vw] 2xl:w-[1600px]
                           h-[96vh]
                           max-w-none sm:max-w-[98vw] md:max-w-[96vw] lg:max-w-[95vw] xl:max-w-[92vw] 2xl:max-w-[1600px]
                           overflow-y-auto p-0 rounded-xl"
              >

                <CustomWorkoutForm
                  initialWorkout={
                    editingWorkout
                      ? {
                          ...editingWorkout,
                          exercises: editingWorkout.exercises.map((ex) => ({
                            id: ex.id,
                            exerciseId: ex.id, // Map id to exerciseId for the form
                            name: ex.name,
                            targetSets: ex.targetSets,
                            targetReps: ex.targetReps,
                            targetType: ex.targetType ?? "reps", // default to "reps" if undefined
                            instructions: ex.instructions,
                          })),
                        }
                      : undefined
                  }
                  onSave={(workout) => {
                    if (editingWorkout) {
                      onEditCustomWorkout?.(workout)
                    } else {
                      onSaveCustomWorkout(workout)
                    }
                    setShowCustomWorkoutDialog(false)
                    setEditingWorkout(null)
                  }}
                  onCancel={() => setShowCustomWorkoutDialog(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
