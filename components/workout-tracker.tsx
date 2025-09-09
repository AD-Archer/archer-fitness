"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Play, Pause, Square, Check, Plus, Timer, Target, Dumbbell, Trash2 } from "lucide-react"

interface ExerciseSet {
  reps: number
  weight: number
  completed: boolean
}

interface TrackedExercise {
  id: string
  name: string
  targetSets: number
  targetReps: string
  instructions: string
  sets: ExerciseSet[]
  completed: boolean
}

interface WorkoutTemplate {
  id: string
  name: string
  description: string
  estimatedDuration: number
  exercises: Omit<TrackedExercise, "sets" | "completed">[]
  isCustom: boolean
}

interface WorkoutSession {
  id: string
  name: string
  startTime: Date
  duration: number
  exercises: TrackedExercise[]
  isActive: boolean
}

const predefinedWorkouts: WorkoutTemplate[] = [
  {
    id: "upper-body",
    name: "Upper Body Strength",
    description: "Focus on chest, shoulders, and arms",
    estimatedDuration: 45,
    exercises: [
      {
        id: "1",
        name: "Dumbbell Bench Press",
        targetSets: 4,
        targetReps: "8-12",
        instructions: "Lower weights to chest, press up explosively",
      },
      {
        id: "2",
        name: "Bent-over Rows",
        targetSets: 4,
        targetReps: "10-12",
        instructions: "Hinge at hips, pull weights to lower chest",
      },
      {
        id: "3",
        name: "Overhead Press",
        targetSets: 3,
        targetReps: "8-10",
        instructions: "Press weights overhead, keep core tight",
      },
      {
        id: "4",
        name: "Bicep Curls",
        targetSets: 3,
        targetReps: "12-15",
        instructions: "Curl weights up, control the descent",
      },
    ],
    isCustom: false,
  },
  {
    id: "lower-body",
    name: "Lower Body Power",
    description: "Legs, glutes, and core strength",
    estimatedDuration: 50,
    exercises: [
      {
        id: "5",
        name: "Goblet Squats",
        targetSets: 4,
        targetReps: "12-15",
        instructions: "Hold dumbbell at chest, squat down keeping chest up",
      },
      {
        id: "6",
        name: "Romanian Deadlifts",
        targetSets: 4,
        targetReps: "10-12",
        instructions: "Hinge at hips, lower weights while keeping back straight",
      },
      {
        id: "7",
        name: "Bulgarian Split Squats",
        targetSets: 3,
        targetReps: "10-12 each leg",
        instructions: "Rear foot elevated, lunge down on front leg",
      },
      {
        id: "8",
        name: "Calf Raises",
        targetSets: 3,
        targetReps: "15-20",
        instructions: "Rise up on toes, squeeze calves at the top",
      },
    ],
    isCustom: false,
  },
  {
    id: "full-body",
    name: "Full Body Circuit",
    description: "Complete body workout in minimal time",
    estimatedDuration: 35,
    exercises: [
      {
        id: "9",
        name: "Burpees",
        targetSets: 3,
        targetReps: "8-10",
        instructions: "Drop down, jump back, push-up, jump forward, jump up",
      },
      {
        id: "10",
        name: "Mountain Climbers",
        targetSets: 3,
        targetReps: "20-30",
        instructions: "Plank position, alternate bringing knees to chest",
      },
      {
        id: "11",
        name: "Dumbbell Thrusters",
        targetSets: 3,
        targetReps: "10-12",
        instructions: "Squat with weights at shoulders, stand and press overhead",
      },
      {
        id: "12",
        name: "Plank",
        targetSets: 3,
        targetReps: "30-60 seconds",
        instructions: "Hold plank position, keep core tight and body straight",
      },
    ],
    isCustom: false,
  },
]

export function WorkoutTracker() {
  const [session, setSession] = useState<WorkoutSession | null>(null)
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [timer, setTimer] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [restTimer, setRestTimer] = useState(0)
  const [isResting, setIsResting] = useState(false)
  const [availableWorkouts, setAvailableWorkouts] = useState<WorkoutTemplate[]>(predefinedWorkouts)
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutTemplate | null>(null)
  const [showWorkoutSelection, setShowWorkoutSelection] = useState(true)
  const [showCustomWorkoutDialog, setShowCustomWorkoutDialog] = useState(false)

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isTimerRunning && session) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTimerRunning, session])

  // Rest timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isResting && restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer((prev) => {
          if (prev <= 1) {
            setIsResting(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isResting, restTimer])

  const startWorkout = (workoutTemplate: WorkoutTemplate) => {
    const newSession: WorkoutSession = {
      id: Date.now().toString(),
      name: workoutTemplate.name,
      startTime: new Date(),
      duration: 0,
      exercises: workoutTemplate.exercises.map((ex) => ({ ...ex, sets: [], completed: false })),
      isActive: true,
    }
    setSession(newSession)
    setIsTimerRunning(true)
    setCurrentExerciseIndex(0)
    setShowWorkoutSelection(false)
  }

  const pauseWorkout = () => {
    setIsTimerRunning(!isTimerRunning)
  }

  const finishWorkout = () => {
    if (session) {
      const completedSession = {
        ...session,
        duration: timer,
        isActive: false,
      }
      // Here you would save to database
      console.log("[v0] Workout completed:", completedSession)
      setSession(null)
      setTimer(0)
      setIsTimerRunning(false)
      setCurrentExerciseIndex(0)
      setShowWorkoutSelection(true)
    }
  }

  const backToSelection = () => {
    setSession(null)
    setTimer(0)
    setIsTimerRunning(false)
    setCurrentExerciseIndex(0)
    setShowWorkoutSelection(true)
  }

  const addSet = (exerciseId: string, reps: number, weight: number) => {
    if (!session) return

    setSession((prev) => {
      if (!prev) return prev

      const updatedExercises = prev.exercises.map((ex) => {
        if (ex.id === exerciseId) {
          const newSet: ExerciseSet = { reps, weight, completed: true }
          const updatedSets = [...ex.sets, newSet]
          const isCompleted = updatedSets.length >= ex.targetSets

          return {
            ...ex,
            sets: updatedSets,
            completed: isCompleted,
          }
        }
        return ex
      })

      return { ...prev, exercises: updatedExercises }
    })

    // Start rest timer after completing a set
    setRestTimer(90) // 90 seconds rest
    setIsResting(true)
  }

  const nextExercise = () => {
    if (currentExerciseIndex < (session?.exercises.length || 0) - 1) {
      setCurrentExerciseIndex((prev) => prev + 1)
    }
  }

  const previousExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex((prev) => prev - 1)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const getWorkoutProgress = () => {
    if (!session) return 0
    const completedExercises = session.exercises.filter((ex) => ex.completed).length
    return (completedExercises / session.exercises.length) * 100
  }

  const deleteWorkout = (workoutId: string) => {
    setAvailableWorkouts((prev) => prev.filter((w) => w.id !== workoutId))
  }

  if (showWorkoutSelection) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Dumbbell className="w-6 h-6 text-blue-600" />
              Choose Your Workout
            </CardTitle>
            <CardDescription>Select from predefined workouts or create your own</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {availableWorkouts.map((workout) => (
                <Card key={workout.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{workout.name}</CardTitle>
                        <CardDescription className="text-sm">{workout.description}</CardDescription>
                      </div>
                      {workout.isCustom && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteWorkout(workout.id)
                          }}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
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
                      onClick={() => startWorkout(workout)}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start Workout
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-center pt-4">
              <Dialog open={showCustomWorkoutDialog} onOpenChange={setShowCustomWorkoutDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="bg-transparent">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Custom Workout
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create Custom Workout</DialogTitle>
                    <DialogDescription>Design your own workout with custom exercises and targets</DialogDescription>
                  </DialogHeader>
                  <CustomWorkoutForm
                    onSave={(workout) => {
                      setAvailableWorkouts((prev) => [...prev, workout])
                      setShowCustomWorkoutDialog(false)
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

  if (!session) {
    return null
  }

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
            <Button onClick={pauseWorkout} variant="outline" className="bg-transparent">
              {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button onClick={finishWorkout} variant="outline" className="bg-transparent">
              <Square className="w-4 h-4" />
              Finish
            </Button>
            <Button onClick={backToSelection} variant="outline" className="bg-transparent">
              Back to Selection
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Rest Timer */}
      {isResting && (
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">{formatTime(restTimer)}</div>
              <div className="text-sm text-orange-700 dark:text-orange-300">Rest Time Remaining</div>
              <Button
                onClick={() => setIsResting(false)}
                variant="outline"
                className="mt-3 bg-transparent border-orange-300"
              >
                Skip Rest
              </Button>
            </div>
          </CardContent>
        </Card>
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
                    {set.reps} reps × {set.weight} lbs
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
                onAddSet={addSet}
              />
            )}
          </div>

          {/* Navigation */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={previousExercise}
              disabled={currentExerciseIndex === 0}
              variant="outline"
              className="bg-transparent"
            >
              Previous
            </Button>
            <Button
              onClick={nextExercise}
              disabled={currentExerciseIndex === session.exercises.length - 1}
              variant="outline"
              className="bg-transparent"
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function CustomWorkoutForm({
  onSave,
  onCancel,
}: {
  onSave: (workout: WorkoutTemplate) => void
  onCancel: () => void
}) {
  const [workoutName, setWorkoutName] = useState("")
  const [workoutDescription, setWorkoutDescription] = useState("")
  const [estimatedDuration, setEstimatedDuration] = useState("")
  const [exercises, setExercises] = useState<Omit<TrackedExercise, "sets" | "completed">[]>([])

  const addExercise = () => {
    const newExercise: Omit<TrackedExercise, "sets" | "completed"> = {
      id: Date.now().toString(),
      name: "",
      targetSets: 3,
      targetReps: "8-12",
      instructions: "",
    }
    setExercises((prev) => [...prev, newExercise])
  }

  const updateExercise = (index: number, field: string, value: string | number) => {
    setExercises((prev) => prev.map((ex, i) => (i === index ? { ...ex, [field]: value } : ex)))
  }

  const removeExercise = (index: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSave = () => {
    if (!workoutName.trim() || exercises.length === 0) return

    const newWorkout: WorkoutTemplate = {
      id: Date.now().toString(),
      name: workoutName.trim(),
      description: workoutDescription.trim(),
      estimatedDuration: Number.parseInt(estimatedDuration) || 30,
      exercises: exercises.filter((ex) => ex.name.trim()),
      isCustom: true,
    }

    onSave(newWorkout)
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <div>
          <Label htmlFor="workout-name">Workout Name</Label>
          <Input
            id="workout-name"
            placeholder="My Custom Workout"
            value={workoutName}
            onChange={(e) => setWorkoutName(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="workout-description">Description</Label>
          <Input
            id="workout-description"
            placeholder="Brief description of the workout"
            value={workoutDescription}
            onChange={(e) => setWorkoutDescription(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="estimated-duration">Estimated Duration (minutes)</Label>
          <Input
            id="estimated-duration"
            type="number"
            placeholder="45"
            value={estimatedDuration}
            onChange={(e) => setEstimatedDuration(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Exercises</h3>
          <Button onClick={addExercise} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Add Exercise
          </Button>
        </div>

        {exercises.map((exercise, index) => (
          <Card key={exercise.id} className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Exercise {index + 1}</h4>
                <Button
                  onClick={() => removeExercise(index)}
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid gap-3">
                <div>
                  <Label>Exercise Name</Label>
                  <Input
                    placeholder="Push-ups"
                    value={exercise.name}
                    onChange={(e) => updateExercise(index, "name", e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Target Sets</Label>
                    <Input
                      type="number"
                      placeholder="3"
                      value={exercise.targetSets}
                      onChange={(e) => updateExercise(index, "targetSets", Number.parseInt(e.target.value) || 3)}
                    />
                  </div>
                  <div>
                    <Label>Target Reps</Label>
                    <Input
                      placeholder="8-12"
                      value={exercise.targetReps}
                      onChange={(e) => updateExercise(index, "targetReps", e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label>Instructions</Label>
                  <Textarea
                    placeholder="How to perform this exercise..."
                    value={exercise.instructions}
                    onChange={(e) => updateExercise(index, "instructions", e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex gap-2 pt-4">
        <Button onClick={handleSave} disabled={!workoutName.trim() || exercises.length === 0}>
          Save Workout
        </Button>
        <Button onClick={onCancel} variant="outline" className="bg-transparent">
          Cancel
        </Button>
      </div>
    </div>
  )
}

function AddSetForm({
  exerciseId,
  setNumber,
  onAddSet,
}: {
  exerciseId: string
  setNumber: number
  onAddSet: (exerciseId: string, reps: number, weight: number) => void
}) {
  const [reps, setReps] = useState("")
  const [weight, setWeight] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (reps && weight) {
      onAddSet(exerciseId, Number.parseInt(reps), Number.parseFloat(weight))
      setReps("")
      setWeight("")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 rounded-lg border-2 border-dashed border-muted-foreground/25">
      <div className="flex items-center gap-3 mb-3">
        <Badge variant="outline">Set {setNumber}</Badge>
        <span className="text-sm text-muted-foreground">Log your performance</span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <Label htmlFor="reps" className="text-xs">
            Reps
          </Label>
          <Input
            id="reps"
            type="number"
            placeholder="12"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            className="h-8"
          />
        </div>
        <div>
          <Label htmlFor="weight" className="text-xs">
            Weight (lbs)
          </Label>
          <Input
            id="weight"
            type="number"
            step="0.5"
            placeholder="25"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="h-8"
          />
        </div>
      </div>

      <Button type="submit" size="sm" className="w-full">
        <Plus className="w-3 h-3 mr-1" />
        Add Set
      </Button>
    </form>
  )
}
