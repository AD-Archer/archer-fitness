"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Zap, RefreshCw } from "lucide-react"
import { WorkoutPreferencesForm } from "./workout-preferences-form"
import { WorkoutDisplay } from "./workout-display"

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
          <WorkoutPreferencesForm
            preferences={preferences}
            onPreferencesChange={setPreferences}
          />

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
        <WorkoutDisplay
          workout={generatedWorkout}
          userNotes={preferences.notes}
          onRegenerate={generateWorkout}
        />
      )}
    </div>
  )
}
