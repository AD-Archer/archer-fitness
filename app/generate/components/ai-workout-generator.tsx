"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Zap, Clock, Target, Dumbbell, Play, RefreshCw, Settings } from "lucide-react"

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

const exerciseDatabase = {
  strength: {
    beginner: [
      {
        name: "Push-ups",
        sets: 3,
        reps: "8-12",
        rest: "60s",
        instructions: "Keep body straight, lower chest to floor",
        targetMuscles: ["chest", "triceps"],
      },
      {
        name: "Bodyweight Squats",
        sets: 3,
        reps: "12-15",
        rest: "60s",
        instructions: "Feet shoulder-width apart, lower until thighs parallel",
        targetMuscles: ["legs", "glutes"],
      },
      {
        name: "Plank",
        sets: 3,
        reps: "30-45s",
        rest: "60s",
        instructions: "Hold straight line from head to heels",
        targetMuscles: ["core"],
      },
      {
        name: "Lunges",
        sets: 3,
        reps: "10 each leg",
        rest: "60s",
        instructions: "Step forward, lower back knee toward ground",
        targetMuscles: ["legs", "glutes"],
      },
    ],
    intermediate: [
      {
        name: "Dumbbell Bench Press",
        sets: 4,
        reps: "8-12",
        rest: "90s",
        instructions: "Lower weights to chest, press up explosively",
        targetMuscles: ["chest", "triceps"],
      },
      {
        name: "Goblet Squats",
        sets: 4,
        reps: "12-15",
        rest: "90s",
        instructions: "Hold dumbbell at chest, squat down keeping chest up",
        targetMuscles: ["legs", "glutes"],
      },
      {
        name: "Bent-over Rows",
        sets: 4,
        reps: "10-12",
        rest: "90s",
        instructions: "Hinge at hips, pull weights to lower chest",
        targetMuscles: ["back", "biceps"],
      },
      {
        name: "Overhead Press",
        sets: 3,
        reps: "8-10",
        rest: "90s",
        instructions: "Press weights overhead, keep core tight",
        targetMuscles: ["shoulders", "triceps"],
      },
    ],
    advanced: [
      {
        name: "Barbell Deadlifts",
        sets: 4,
        reps: "6-8",
        rest: "2-3min",
        instructions: "Hip hinge movement, keep bar close to body",
        targetMuscles: ["back", "legs", "glutes"],
      },
      {
        name: "Pull-ups",
        sets: 4,
        reps: "8-12",
        rest: "2min",
        instructions: "Full range of motion, control the descent",
        targetMuscles: ["back", "biceps"],
      },
      {
        name: "Barbell Squats",
        sets: 4,
        reps: "8-10",
        rest: "2-3min",
        instructions: "Bar on upper back, squat to parallel or below",
        targetMuscles: ["legs", "glutes"],
      },
      {
        name: "Dips",
        sets: 3,
        reps: "10-15",
        rest: "90s",
        instructions: "Lower body until shoulders below elbows",
        targetMuscles: ["chest", "triceps"],
      },
    ],
  },
  cardio: {
    beginner: [
      {
        name: "Marching in Place",
        sets: 3,
        reps: "2 min",
        rest: "60s",
        instructions: "Lift knees high, pump arms",
        targetMuscles: ["cardio"],
      },
      {
        name: "Step-ups",
        sets: 3,
        reps: "1 min each leg",
        rest: "60s",
        instructions: "Step up onto sturdy surface, control descent",
        targetMuscles: ["legs", "cardio"],
      },
      {
        name: "Arm Circles",
        sets: 2,
        reps: "30s each direction",
        rest: "30s",
        instructions: "Large circles, keep arms straight",
        targetMuscles: ["shoulders", "cardio"],
      },
    ],
    intermediate: [
      {
        name: "Jumping Jacks",
        sets: 4,
        reps: "45s",
        rest: "60s",
        instructions: "Jump feet apart while raising arms overhead",
        targetMuscles: ["cardio"],
      },
      {
        name: "High Knees",
        sets: 4,
        reps: "30s",
        rest: "45s",
        instructions: "Run in place bringing knees to chest level",
        targetMuscles: ["legs", "cardio"],
      },
      {
        name: "Burpees",
        sets: 3,
        reps: "8-12",
        rest: "90s",
        instructions: "Squat, jump back to plank, jump forward, jump up",
        targetMuscles: ["full body", "cardio"],
      },
    ],
    advanced: [
      {
        name: "Mountain Climbers",
        sets: 4,
        reps: "45s",
        rest: "60s",
        instructions: "Plank position, alternate bringing knees to chest",
        targetMuscles: ["core", "cardio"],
      },
      {
        name: "Jump Squats",
        sets: 4,
        reps: "15-20",
        rest: "90s",
        instructions: "Squat down, explode up into jump",
        targetMuscles: ["legs", "cardio"],
      },
      {
        name: "Sprint Intervals",
        sets: 6,
        reps: "30s",
        rest: "90s",
        instructions: "All-out effort for 30 seconds",
        targetMuscles: ["cardio"],
      },
    ],
  },
}

export function AIWorkoutGenerator() {
  const [preferences, setPreferences] = useState({
    fitnessLevel: "",
    workoutType: "",
    duration: "",
    targetMuscles: [] as string[],
    equipment: [] as string[],
    notes: "",
  })
  const [generatedWorkout, setGeneratedWorkout] = useState<WorkoutPlan | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleMuscleToggle = (muscle: string) => {
    setPreferences((prev) => ({
      ...prev,
      targetMuscles: prev.targetMuscles.includes(muscle)
        ? prev.targetMuscles.filter((m) => m !== muscle)
        : [...prev.targetMuscles, muscle],
    }))
  }

  const handleEquipmentToggle = (equipment: string) => {
    setPreferences((prev) => ({
      ...prev,
      equipment: prev.equipment.includes(equipment)
        ? prev.equipment.filter((e) => e !== equipment)
        : [...prev.equipment, equipment],
    }))
  }

  const generateWorkout = async () => {
    setIsGenerating(true)

    await new Promise((resolve) => setTimeout(resolve, 2000))

    const { fitnessLevel, workoutType, duration, equipment } = preferences
    const durationNum = Number.parseInt(duration)

    let availableExercises =
      exerciseDatabase[workoutType as keyof typeof exerciseDatabase]?.[
        fitnessLevel as keyof typeof exerciseDatabase.strength
      ] || []

    if (equipment.length > 0) {
      availableExercises = availableExercises.filter((exercise) => {
        if (equipment.includes("dumbbells") && exercise.name.toLowerCase().includes("dumbbell")) return true
        if (equipment.includes("barbell") && exercise.name.toLowerCase().includes("barbell")) return true
        if (
          equipment.includes("bodyweight") &&
          !exercise.name.toLowerCase().includes("dumbbell") &&
          !exercise.name.toLowerCase().includes("barbell")
        )
          return true
        if (equipment.includes("resistance-bands") && exercise.name.toLowerCase().includes("band")) return true
        if (equipment.includes("pull-up-bar") && exercise.name.toLowerCase().includes("pull")) return true
        if (equipment.includes("kettlebells") && exercise.name.toLowerCase().includes("kettlebell")) return true
        return equipment.includes("bodyweight")
      })
    }

    const exerciseCount = durationNum <= 20 ? 3 : durationNum <= 40 ? 4 : durationNum <= 60 ? 6 : 8
    const selectedExercises = availableExercises.slice(0, exerciseCount)

    const equipmentText = equipment.length > 0 ? ` (${equipment.join(", ")})` : ""

    const workout: WorkoutPlan = {
      name: `AI-Generated ${workoutType.charAt(0).toUpperCase() + workoutType.slice(1)} Workout${equipmentText}`,
      duration: durationNum,
      difficulty: fitnessLevel.charAt(0).toUpperCase() + fitnessLevel.slice(1),
      exercises: selectedExercises,
      warmup: [
        "5 minutes light cardio (marching, arm swings)",
        "Dynamic stretching (leg swings, arm circles)",
        "Joint mobility (shoulder rolls, hip circles)",
      ],
      cooldown: [
        "5 minutes walking or light movement",
        "Static stretching (hold 30 seconds each)",
        "Deep breathing and relaxation",
      ],
    }

    setGeneratedWorkout(workout)
    setIsGenerating(false)
  }

  const canGenerate = preferences.fitnessLevel && preferences.workoutType && preferences.duration

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600" />
            AI Workout Generator
          </CardTitle>
          <CardDescription>Tell me about your preferences and I&apos;ll create a personalized workout plan</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Fitness Level</Label>
              <Select
                value={preferences.fitnessLevel}
                onValueChange={(value) => setPreferences((prev) => ({ ...prev, fitnessLevel: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Workout Type</Label>
              <Select
                value={preferences.workoutType}
                onValueChange={(value) => setPreferences((prev) => ({ ...prev, workoutType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose workout type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="strength">Strength Training</SelectItem>
                  <SelectItem value="cardio">Cardio</SelectItem>
                  <SelectItem value="hiit">HIIT</SelectItem>
                  <SelectItem value="flexibility">Flexibility</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Duration (minutes)</Label>
              <Select
                value={preferences.duration}
                onValueChange={(value) => setPreferences((prev) => ({ ...prev, duration: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="How long?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                  <SelectItem value="90">90 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Target Muscle Groups (optional)</Label>
            <div className="flex flex-wrap gap-2">
              {["chest", "back", "shoulders", "arms", "legs", "glutes", "core"].map((muscle) => (
                <div key={muscle} className="flex items-center space-x-2">
                  <Checkbox
                    id={muscle}
                    checked={preferences.targetMuscles.includes(muscle)}
                    onCheckedChange={() => handleMuscleToggle(muscle)}
                  />
                  <Label htmlFor={muscle} className="text-sm capitalize cursor-pointer">
                    {muscle}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Available Equipment
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { id: "bodyweight", label: "Bodyweight Only" },
                { id: "dumbbells", label: "Dumbbells" },
                { id: "barbell", label: "Barbell" },
                { id: "kettlebells", label: "Kettlebells" },
                { id: "resistance-bands", label: "Resistance Bands" },
                { id: "pull-up-bar", label: "Pull-up Bar" },
                { id: "bench", label: "Weight Bench" },
                { id: "cable-machine", label: "Cable Machine" },
                { id: "treadmill", label: "Treadmill" },
                { id: "stationary-bike", label: "Stationary Bike" },
                { id: "rowing-machine", label: "Rowing Machine" },
                { id: "yoga-mat", label: "Yoga Mat" },
              ].map((equipment) => (
                <div key={equipment.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={equipment.id}
                    checked={preferences.equipment.includes(equipment.id)}
                    onCheckedChange={() => handleEquipmentToggle(equipment.id)}
                  />
                  <Label htmlFor={equipment.id} className="text-sm cursor-pointer">
                    {equipment.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="ai-notes">Additional Notes & Preferences</Label>
            <Textarea
              id="ai-notes"
              placeholder="Tell the AI about any specific preferences, injuries to avoid, favorite exercises, time constraints, or other details that would help create the perfect workout for you..."
              value={preferences.notes}
              onChange={(e) => setPreferences((prev) => ({ ...prev, notes: e.target.value }))}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {`Examples: "I have a bad knee, avoid lunges", "I love compound movements", "Focus on upper body today", "I only have 20 minutes between meetings"`}
            </p>
          </div>

          <Button
            onClick={generateWorkout}
            disabled={!canGenerate || isGenerating}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Generating Your Workout...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Generate AI Workout
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {generatedWorkout && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-600" />
                  {generatedWorkout.name}
                </CardTitle>
                <CardDescription className="flex items-center gap-4 mt-2">
                  <Badge variant="outline">{generatedWorkout.difficulty}</Badge>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {generatedWorkout.duration} min
                  </div>
                  <div className="flex items-center gap-1">
                    <Dumbbell className="w-3 h-3" />
                    {generatedWorkout.exercises.length} exercises
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
            {preferences.notes && (
              <>
                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                  <h3 className="font-semibold mb-2 text-blue-900 dark:text-blue-100 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    AI Insights
                  </h3>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Based on your notes: {`"${preferences.notes.slice(0, 100)}${preferences.notes.length > 100 ? "..." : ""}"`}, I&apos;ve customized this workout to match your specific
                    needs and preferences.
                  </p>
                </div>
                <Separator />
              </>
            )}

            <div>
              <h3 className="font-semibold mb-3 text-orange-600">Warm-up (5 min)</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {generatedWorkout.warmup.map((item, index) => (
                  <li key={index}>• {item}</li>
                ))}
              </ul>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-4 text-blue-600">Main Workout</h3>
              <div className="space-y-4">
                {generatedWorkout.exercises.map((exercise, index) => (
                  <div key={index} className="p-4 rounded-lg border bg-card/50">
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
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-3 text-purple-600">Cool-down (5 min)</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {generatedWorkout.cooldown.map((item, index) => (
                  <li key={index}>• {item}</li>
                ))}
              </ul>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1 bg-transparent">
                Save Workout
              </Button>
              <Button variant="outline" className="flex-1 bg-transparent">
                Share
              </Button>
              <Button onClick={generateWorkout} variant="outline">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
