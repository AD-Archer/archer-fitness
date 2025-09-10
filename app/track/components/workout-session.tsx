"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Check, Pause, Play, Square, Target, Timer } from "lucide-react"
import { AddSetForm } from "./add-set-form"
import { RestTimer } from "./rest-timer"

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
  onPauseWorkout: () => void
  onFinishWorkout: () => void
  onBackToSelection: () => void
  onAddSet: (exerciseId: string, reps: number, weight?: number) => void
  onAddExercise: () => void
  onNextExercise: () => void
  onPreviousExercise: () => void
  onSkipRest: () => void
  onSwitchToExercise: (index: number) => void
  formatTime: (seconds: number) => string
  getWorkoutProgress: () => number
}

export function WorkoutSession({
  session,
  currentExerciseIndex,
  timer,
  isTimerRunning,
  isResting,
  restTimer,
  onPauseWorkout,
  onFinishWorkout,
  onBackToSelection,
  onAddSet,
  onAddExercise,
  onNextExercise,
  onPreviousExercise,
  onSkipRest,
  onSwitchToExercise,
  formatTime,
  getWorkoutProgress,
}: WorkoutSessionProps) {
  const currentExercise = session.exercises[currentExerciseIndex]

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
              <span>{Math.round(getWorkoutProgress())}%</span>
            </div>
            <Progress value={getWorkoutProgress()} className="h-2" />
          </div>

          <div className="flex gap-2">
            <Button onClick={onPauseWorkout} variant="outline" className="bg-transparent">
              {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button onClick={onFinishWorkout} variant="outline" className="bg-transparent">
              <Square className="w-4 h-4" />
              Finish
            </Button>
            <Button onClick={onBackToSelection} variant="outline" className="bg-transparent">
              Back to Selection
            </Button>
            <Button onClick={onAddExercise} variant="outline" className="bg-transparent">
              Add Exercise
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Rest Timer */}
      {isResting && (
        <RestTimer
          restTimer={restTimer}
          onSkipRest={onSkipRest}
          formatTime={formatTime}
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
                Target: {currentExercise.targetSets} sets × {currentExercise.targetReps} reps
              </CardDescription>
            </div>
            {currentExercise.completed && (
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                <Check className="w-3 h-3 mr-1" />
                Complete
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-sm">{currentExercise.instructions}</p>
          </div>

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
        {set.reps} reps × {set.weight != null ? `${set.weight} lbs` : "bodyweight"}
                  </span>
                </div>
                <Check className="w-4 h-4 text-green-600" />
              </div>
            ))}

            {/* Add New Set */}
            {currentExercise.sets.length < currentExercise.targetSets && (
              <AddSetForm
                exerciseId={currentExercise.id}
                setNumber={currentExercise.sets.length + 1}
                onAddSet={onAddSet}
              />
            )}
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
            {session.exercises.map((ex, idx) => (
              <div
                key={ex.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  idx === currentExerciseIndex
                    ? "bg-blue-50 dark:bg-blue-950 border-blue-200"
                    : ex.completed
                    ? "bg-green-50 dark:bg-green-950 border-green-200"
                    : "bg-muted/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Badge variant={idx === currentExerciseIndex ? "default" : "secondary"}>
                    {idx === currentExerciseIndex ? "Current" : ex.completed ? "Done" : "Upcoming"}
                  </Badge>
                  <span className="font-medium">{ex.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {ex.sets.length}/{ex.targetSets} sets
                  </span>
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
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
