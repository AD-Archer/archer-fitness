"use client"

import { useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Check, Pause, Play, Square, Target, Timer, Save, X, Trash2 } from "lucide-react"
import Image from "next/image"
import { AddSetForm } from "./add-set-form"
import { RestTimer } from "./rest-timer"
import { ExerciseTimer } from "./exercise-timer"
import { formatTime, getExerciseProgress, isExerciseCompleted, getCompletedExercisesCount } from "../utils"
import { formatWeight } from "@/lib/weight-utils"
import { useUserPreferences } from "@/hooks/use-user-preferences"
import { logger } from "@/lib/logger"

interface ExerciseSet {
  reps: number
  weight?: number
  completed: boolean
}

interface TrackedExercise {
  id: string
  name: string
  targetSets: number
  targetReps: string
  targetType?: "reps" | "time"
  instructions?: string
  sets: ExerciseSet[]
  completed: boolean
  exercise?: {
    id: string
    name: string
    description?: string
    instructions?: string
    gifUrl?: string
    muscles: Array<{
      muscle: {
        id: string
        name: string
      }
      isPrimary: boolean
    }>
    equipments: Array<{
      equipment: {
        id: string
        name: string
      }
    }>
  }
}

interface WorkoutSessionProps {
  session: {
    id: string
    name: string
    startTime: Date
    duration: number
    exercises: TrackedExercise[]
    isActive: boolean
  }
  currentExerciseIndex: number
  timer: number
  isTimerRunning: boolean
  isResting: boolean
  restTimer: number
  exerciseTimer: number
  onPauseWorkout: () => void
  onFinishWorkout: () => void
  onStopWorkout: () => void
  onBackToSelection: () => void
  onAddSet: (exerciseId: string, reps: number, weight?: number) => void
  onAddExercise: () => void
  onRemoveExercise: (exerciseId: string) => void
  onNextExercise: () => void
  onPreviousExercise: () => void
  onSkipRest: () => void
  onSwitchToExercise: (index: number) => void
  onSaveWorkout?: () => void
  getWorkoutProgress: () => number
}

export function WorkoutSession({
  session,
  currentExerciseIndex,
  timer,
  isTimerRunning,
  isResting,
  restTimer,
  exerciseTimer,
  onPauseWorkout,
  onFinishWorkout,
  onStopWorkout,
  onBackToSelection,
  onAddSet,
  onAddExercise,
  onRemoveExercise,
  onNextExercise,
  onPreviousExercise,
  onSkipRest,
  onSwitchToExercise,
  onSaveWorkout,
  getWorkoutProgress,
}: WorkoutSessionProps) {
  const currentExercise = session.exercises[currentExerciseIndex]
  const workoutHeaderRef = useRef<HTMLDivElement>(null)
  const { units } = useUserPreferences()

  // Handle add exercise with scroll to top
  const handleAddExercise = () => {
    if (workoutHeaderRef.current) {
      workoutHeaderRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    onAddExercise()
  }

  // Get last set data for pre-filling the form
  const getLastSetData = () => {
    if (currentExercise.sets.length === 0) return undefined
    const lastSet = currentExercise.sets[currentExercise.sets.length - 1]
    return {
      reps: lastSet.reps,
      weight: lastSet.weight,
      isBodyweight: lastSet.weight === undefined
    }
  }

  // Guard clause: if no exercises or invalid index, show message
  if (!currentExercise) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="w-5 h-5 text-red-600" />
              No Exercises Found
            </CardTitle>
            <CardDescription>
              This workout session doesn&apos;t have any exercises. Please go back and select a different workout.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={onBackToSelection} variant="outline" className="bg-transparent">
              Back to Selection
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Debug: Log exercise data
  logger.info('Current exercise data:', {
    name: currentExercise.name,
    exercise: currentExercise.exercise,
    gifUrl: currentExercise.exercise?.gifUrl,
    hasGifUrl: !!currentExercise.exercise?.gifUrl,
    muscles: currentExercise.exercise?.muscles,
    hasMuscles: !!currentExercise.exercise?.muscles?.length,
    primaryMuscles: currentExercise.exercise?.muscles?.filter(m => m.isPrimary),
    secondaryMuscles: currentExercise.exercise?.muscles?.filter(m => !m.isPrimary)
  })

  return (
    <div className="space-y-6">
      {/* Workout Header */}
      <Card ref={workoutHeaderRef}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Timer className="w-5 h-5 text-green-600" />
                {session.name}
              </CardTitle>
              <CardDescription>
                Exercise {currentExerciseIndex + 1} of {session.exercises.length}
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{formatTime(timer)}</div>
              <div className="text-sm text-muted-foreground">Total Time</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Workout Progress</span>
              <span>{Math.round(getWorkoutProgress())}% • {getCompletedExercisesCount(session)}/{session.exercises.length} exercises</span>
            </div>
            <Progress value={getWorkoutProgress()} className="h-2" />
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={onPauseWorkout} variant="outline" className="bg-transparent flex-1 sm:flex-none">
              {isTimerRunning ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
              {isTimerRunning ? "Resume" : "Pause"}
            </Button>
            <Button 
              onClick={onFinishWorkout} 
              className="bg-green-600 hover:bg-green-700 text-white flex-1 sm:flex-none"
              disabled={getCompletedExercisesCount(session) === 0}
            >
              <Check className="w-4 h-4 mr-1" />
              Finish Workout
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="bg-transparent text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 flex-1 sm:flex-none">
                  <Square className="w-4 h-4 mr-1" />
                  Stop
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Stop Workout</AlertDialogTitle>
                  <AlertDialogDescription>
                    What would you like to do with your current workout progress?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col sm:flex-col gap-2">
                  <AlertDialogAction
                    onClick={onSaveWorkout}
                    className="bg-green-600 hover:bg-green-700 text-white w-full"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save & Exit Workout
                  </AlertDialogAction>
                  <AlertDialogAction
                    onClick={onStopWorkout}
                    className="bg-red-600 hover:bg-red-700 text-white w-full"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Discard & Exit
                  </AlertDialogAction>
                  <AlertDialogCancel className="w-full">
                    Continue Workout
                  </AlertDialogCancel>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button onClick={onBackToSelection} variant="outline" className="bg-transparent flex-1 sm:flex-none">
              Back to Selection
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Add Exercise Button - Prominent */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-lg p-4 sm:p-6 border-2 border-dashed border-blue-200 dark:border-blue-800">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-3">Need to add another exercise?</p>
          <Button onClick={handleAddExercise} className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto">
            <Target className="w-4 h-4 mr-2" />
            Add Exercise
          </Button>
        </div>
      </div>

      {/* Rest Timer */}
      {isResting && (
        <RestTimer
          restTimer={restTimer}
          onSkipRest={onSkipRest}
        />
      )}

      {/* Exercise Timer for Timed Exercises */}
      {currentExercise.targetType === "time" && !isResting && (
        <ExerciseTimer
          exerciseTimer={exerciseTimer}
          targetTime={currentExercise.targetReps}
        />
      )}

      {/* Current Exercise */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                {currentExercise.name}
              </CardTitle>
              <CardDescription>
                <div className="space-y-3">
                  <div className="text-base font-medium text-foreground">
                    Target: {currentExercise.targetSets} sets × {currentExercise.targetReps} {currentExercise.targetType === "time" ? "" : "reps"}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{currentExercise.sets.length}/{currentExercise.targetSets} sets completed</span>
                    </div>
                    <Progress value={getExerciseProgress(currentExercise)} className="h-2" />
                  </div>
                  
                  {/* Exercise GIF - positioned here */}
                  {currentExercise.exercise?.gifUrl ? (
                    <div className="space-y-2 pt-2">
                      <div className="flex justify-center">
                        <Image
                          src={currentExercise.exercise.gifUrl}
                          alt={`${currentExercise.name} demonstration`}
                          width={250}
                          height={150}
                          className="max-w-full h-auto rounded-lg border shadow-sm"
                          style={{ maxHeight: '150px' }}
                          onError={(e) => {
                            logger.info('GIF failed to load:', currentExercise.exercise?.gifUrl);
                            e.currentTarget.style.display = 'none';
                          }}
                          onLoad={() => {
                            logger.info('GIF loaded successfully:', currentExercise.exercise?.gifUrl);
                          }}
                        />
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">
                          💡 Pause the workout to see the demonstration more clearly
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-center pt-2">
                      <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3 text-center">
                        📹 No demonstration video available
                      </div>
                    </div>
                  )}
                </div>
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {currentExercise.completed || isExerciseCompleted(currentExercise) ? (
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  <Check className="w-3 h-3 mr-1" />
                  Complete
                </Badge>
              ) : null}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove Exercise</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to remove &quot;{currentExercise.name}&quot; from this workout? 
                      All sets for this exercise will be lost.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onRemoveExercise(currentExercise.id)}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove Exercise
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Exercise Tags */}
          <div className="space-y-3">
            {/* Equipment Tags */}
            {currentExercise.exercise?.equipments && currentExercise.exercise.equipments.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Equipment</h4>
                <div className="flex flex-wrap gap-1">
                  {currentExercise.exercise.equipments.map((eq, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {eq.equipment.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Target Muscles */}
            {currentExercise.exercise?.muscles && currentExercise.exercise.muscles.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Target Muscles</h4>
                <div className="flex flex-wrap gap-1">
                  {currentExercise.exercise.muscles
                    .filter(m => m.isPrimary)
                    .map((muscle, idx) => (
                      <Badge key={idx} className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {muscle.muscle.name}
                      </Badge>
                    ))}
                </div>
              </div>
            )}

            {/* Secondary Muscles */}
            {currentExercise.exercise?.muscles && currentExercise.exercise.muscles.some(m => !m.isPrimary) && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Secondary Muscles</h4>
                <div className="flex flex-wrap gap-1">
                  {currentExercise.exercise.muscles
                    .filter(m => !m.isPrimary)
                    .map((muscle, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs border-orange-200 text-orange-700 dark:border-orange-800 dark:text-orange-300">
                        {muscle.muscle.name}
                      </Badge>
                    ))}
                </div>
              </div>
            )}
          </div>

          {currentExercise.instructions && (
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-sm">{currentExercise.instructions}</p>
            </div>
          )}

          {/* Exercise Sets */}
          <div className="space-y-4">
            <h3 className="font-medium">Sets</h3>

            {/* Completed Sets */}
      {currentExercise.sets.map((set, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg border bg-green-50 dark:bg-green-950"
              >
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">Set {index + 1}</Badge>
                  <span className="text-sm">
                    {currentExercise.targetType === "time"
                      ? `${Math.floor(set.reps / 60)}:${(set.reps % 60).toString().padStart(2, "0")}`
                      : `${set.reps} reps × ${set.weight !== null && set.weight !== undefined ? formatWeight(set.weight, units) : "bodyweight"}`
                    }
                  </span>
                </div>
                <Check className="w-4 h-4 text-green-600" />
              </div>
            ))}

            {/* Add New Set - Always available */}
            <AddSetForm
              exerciseId={currentExercise.id}
              setNumber={currentExercise.sets.length + 1}
              targetType={currentExercise.targetType}
              currentExerciseTimer={exerciseTimer}
              lastSetData={getLastSetData()}
              onAddSet={onAddSet}
            />
          </div>

          {/* Navigation */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={onPreviousExercise}
              disabled={currentExerciseIndex === 0}
              variant="outline"
              className="bg-transparent"
            >
              Previous
            </Button>
            <Button
              onClick={onNextExercise}
              disabled={currentExerciseIndex === session.exercises.length - 1}
              variant="outline"
              className="bg-transparent"
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* All Exercises Overview */}
      <Card>
        <CardHeader>
          <CardTitle>All Exercises</CardTitle>
          <CardDescription>Overview of your workout</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {session.exercises.map((ex, idx) => {
              return (
                <div
                  key={ex.id}
                  className={`p-3 rounded-lg border ${
                    idx === currentExerciseIndex
                      ? "bg-blue-50 dark:bg-blue-950 border-blue-200"
                      : isExerciseCompleted(ex)
                      ? "bg-green-50 dark:bg-green-950 border-green-200"
                      : "bg-muted/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Badge variant={idx === currentExerciseIndex ? "default" : "secondary"}>
                        {idx === currentExerciseIndex ? "Current" : isExerciseCompleted(ex) ? "Done" : "Upcoming"}
                      </Badge>
                      <span className="font-medium">{ex.name}</span>
                    </div>
                    <Button
                      onClick={() => onSwitchToExercise(idx)}
                      variant="outline"
                      size="sm"
                      disabled={idx === currentExerciseIndex}
                    >
                      {idx === currentExerciseIndex ? "Active" : "Go"}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
