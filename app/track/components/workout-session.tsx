"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Check, Pause, Play, Square, Target, Timer } from "lucide-react"
import { AddSetForm } from "./add-set-form"
import { RestTimer } from "./rest-timer"
import { ExerciseTimer } from "./exercise-timer"
import { formatTime, getExerciseProgress, isExerciseCompleted, getCompletedExercisesCount } from "../utils"

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
  onStopWorkout,
  onBackToSelection,
  onAddSet,
  onAddExercise,
  onNextExercise,
  onPreviousExercise,
  onSkipRest,
  onSwitchToExercise,
  onSaveWorkout,
  getWorkoutProgress,
}: WorkoutSessionProps) {
  const currentExercise = session.exercises[currentExerciseIndex]

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

  return (
    <div className="space-y-6">
      {/* Workout Header */}
      <Card>
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

          <div className="flex gap-2">
            <Button onClick={onPauseWorkout} variant="outline" className="bg-transparent">
              {isTimerRunning ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
              {isTimerRunning ? "Pause" : "Resume"}
            </Button>
            <Button onClick={onStopWorkout} variant="outline" className="bg-transparent text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950">
              <Square className="w-4 h-4" />
              Stop
            </Button>
            <Button onClick={onBackToSelection} variant="outline" className="bg-transparent">
              Back to Selection
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Add Exercise Button - Prominent */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-lg p-4 sm:p-6 border-2 border-dashed border-blue-200 dark:border-blue-800">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-3">Need to add another exercise?</p>
          <Button onClick={onAddExercise} className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto">
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
            <div>
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
                </div>
              </CardDescription>
            </div>
            {currentExercise.completed || isExerciseCompleted(currentExercise) ? (
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                <Check className="w-3 h-3 mr-1" />
                Complete
              </Badge>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
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
                      : `${set.reps} reps × ${set.weight != null ? `${set.weight} lbs` : "bodyweight"}`
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
              onSaveWorkout={onSaveWorkout}
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
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{ex.sets.length}/{ex.targetSets} sets</span>
                    <div className="flex-1">
                      <Progress value={getExerciseProgress(ex)} className="h-1" />
                    </div>
                    <span>{isExerciseCompleted(ex) ? "Done" : "In progress"}</span>
                    {ex.targetType === "time" && <span className="text-xs">({ex.targetReps})</span>}
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
