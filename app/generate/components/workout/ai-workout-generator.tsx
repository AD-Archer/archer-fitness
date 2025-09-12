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

interface DatabaseExercise {
  exerciseId: string
  name: string
  bodyParts: string[]
  targetMuscles: string[]
  equipments: string[]
  instructions: string[]
  secondaryMuscles: string[]
  bodyPart: string
  target: string
  equipment: string
  gifUrl: string
  source?: string
}

interface ApiMuscle {
  muscle: {
    name: string
  }
  isPrimary: boolean
}

interface ApiEquipment {
  equipment: {
    name: string
  }
}

interface ApiExercise {
  id: string
  name: string
  instructions?: string
  muscles?: ApiMuscle[]
  equipments?: ApiEquipment[]
}

// Load exercise database from API with filters
const loadExerciseDatabase = async (
  workoutType: string,
  targetMuscles: string[],
  equipment: string[],
  exerciseCount: number
): Promise<DatabaseExercise[]> => {
  try {
    // Build query parameters
    const params = new URLSearchParams()
    params.append('limit', Math.max(50, exerciseCount * 5).toString()) // Fetch more exercises to ensure we have enough after filtering

    const queryString = params.toString()
    const url = `/api/workout-tracker/exercises${queryString ? `?${queryString}` : ''}`

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('Failed to fetch exercises')
    }
    const data = await response.json()

    // Combine user exercises and predefined exercises
    const allExercises: ApiExercise[] = [
      ...(data.userExercises || []),
      ...(data.predefinedExercises || [])
    ]

    // Convert to our expected format
    const convertedExercises = allExercises.map((exercise: ApiExercise) => ({
      exerciseId: exercise.id,
      name: exercise.name,
      bodyParts: exercise.muscles?.map((m: ApiMuscle) => m.muscle?.name?.toLowerCase()) || [],
      targetMuscles: exercise.muscles?.filter((m: ApiMuscle) => m.isPrimary).map((m: ApiMuscle) => m.muscle?.name?.toLowerCase()) || [],
      equipments: exercise.equipments?.map((e: ApiEquipment) => e.equipment?.name?.toLowerCase()) || [],
      instructions: exercise.instructions ? [exercise.instructions] : [],
      secondaryMuscles: exercise.muscles?.filter((m: ApiMuscle) => !m.isPrimary).map((m: ApiMuscle) => m.muscle?.name?.toLowerCase()) || [],
      bodyPart: exercise.muscles?.[0]?.muscle?.name?.toLowerCase() || '',
      target: exercise.muscles?.find((m: ApiMuscle) => m.isPrimary)?.muscle?.name?.toLowerCase() || '',
      equipment: exercise.equipments?.[0]?.equipment?.name?.toLowerCase() || '',
      gifUrl: '',
      source: 'database'
    }))

    // Apply frontend filtering
    const filteredExercises = filterExercises(convertedExercises, workoutType, targetMuscles, equipment)

    // Return only the filtered exercises (no need to slice here, we'll do it in generateWorkout)
    return filteredExercises
  } catch (error) {
    console.error('Failed to load exercise database:', error)
    return []
  }
}

// Filter exercises based on criteria
const filterExercises = (
  exercises: DatabaseExercise[],
  workoutType: string,
  targetMuscles: string[],
  equipment: string[]
): DatabaseExercise[] => {
  // If no filters are applied, return all exercises
  if (targetMuscles.length === 0 && equipment.length === 0) {
    return exercises
  }

  return exercises.filter(exercise => {
    // Filter by workout type
    const matchesWorkoutType = (() => {
      const bodyParts = exercise.bodyParts || []
      const targetMuscles = exercise.targetMuscles || []

      switch (workoutType) {
        case 'strength':
          return bodyParts.some(part =>
            ['chest', 'back', 'shoulders', 'arms', 'biceps', 'triceps', 'legs', 'quadriceps', 'hamstrings', 'glutes', 'core', 'abs'].includes(part.toLowerCase())
          ) || targetMuscles.some(muscle =>
            ['chest', 'back', 'shoulders', 'arms', 'biceps', 'triceps', 'legs', 'quadriceps', 'hamstrings', 'glutes', 'core', 'abs'].includes(muscle.toLowerCase())
          )
        case 'cardio':
          // For cardio, include exercises that are cardio-related OR can be done as cardio
          return bodyParts.includes('cardio') ||
                 targetMuscles.some(muscle => muscle.toLowerCase().includes('cardio')) ||
                 exercise.name.toLowerCase().includes('run') ||
                 exercise.name.toLowerCase().includes('jump') ||
                 exercise.name.toLowerCase().includes('burpee') ||
                 exercise.name.toLowerCase().includes('mountain climber') ||
                 exercise.name.toLowerCase().includes('high knees') ||
                 exercise.name.toLowerCase().includes('jumping jacks') ||
                 // Also include strength exercises that can be done with cardio timing
                 bodyParts.some(part =>
                   ['full body', 'legs', 'core', 'back', 'chest', 'shoulders'].includes(part.toLowerCase())
                 ) ||
                 targetMuscles.some(muscle =>
                   ['legs', 'core', 'back', 'chest', 'shoulders', 'full body'].includes(muscle.toLowerCase())
                 ) ||
                 true // Allow any exercise for cardio if no other matches
        case 'hiit':
          return bodyParts.some(part =>
            ['cardio', 'full body', 'legs', 'core', 'abs', 'back', 'chest'].includes(part.toLowerCase())
          ) || targetMuscles.some(muscle =>
            ['cardio', 'full body', 'legs', 'core', 'abs', 'back', 'chest'].includes(muscle.toLowerCase())
          ) || exercise.name.toLowerCase().includes('burpee') ||
             exercise.name.toLowerCase().includes('mountain climber') ||
             exercise.name.toLowerCase().includes('squat') ||
             exercise.name.toLowerCase().includes('push') ||
             exercise.name.toLowerCase().includes('pull')
        case 'flexibility':
          return bodyParts.some(part =>
            ['core', 'abs', 'back', 'legs', 'shoulders'].includes(part.toLowerCase())
          ) || targetMuscles.some(muscle =>
            ['core', 'abs', 'back', 'legs', 'shoulders'].includes(muscle.toLowerCase())
          ) || exercise.name.toLowerCase().includes('stretch') ||
             exercise.name.toLowerCase().includes('yoga') ||
             exercise.name.toLowerCase().includes('plank') ||
             exercise.name.toLowerCase().includes('downward dog')
        default:
          return true
      }
    })()

    // Filter by target muscles if specified
    const matchesTargetMuscles = targetMuscles.length === 0 ||
      targetMuscles.some(muscle => {
        const muscleLower = muscle.toLowerCase()

        // Check primary target muscles
        const primaryMatch = exercise.targetMuscles.some((exMuscle: string) => {
          const exMuscleLower = exMuscle.toLowerCase()
          return exMuscleLower.includes(muscleLower) ||
                 muscleLower.includes(exMuscleLower) ||
                 // Handle common muscle group variations
                 (muscleLower === 'back' && (exMuscleLower.includes('lats') || exMuscleLower.includes('traps') || exMuscleLower.includes('rhomboids'))) ||
                 (muscleLower === 'chest' && exMuscleLower.includes('pecs')) ||
                 (muscleLower === 'legs' && (exMuscleLower.includes('quad') || exMuscleLower.includes('hamstring') || exMuscleLower.includes('calf'))) ||
                 (muscleLower === 'arms' && (exMuscleLower.includes('bicep') || exMuscleLower.includes('tricep'))) ||
                 (muscleLower === 'shoulders' && exMuscleLower.includes('delts'))
        })

        // Check body parts
        const bodyPartMatch = exercise.bodyParts.some((bodyPart: string) => {
          const bodyPartLower = bodyPart.toLowerCase()
          return bodyPartLower.includes(muscleLower) ||
                 muscleLower.includes(bodyPartLower) ||
                 // Handle body part to muscle mapping
                 (muscleLower === 'back' && bodyPartLower === 'posterior') ||
                 (muscleLower === 'chest' && bodyPartLower === 'anterior') ||
                 (muscleLower === 'legs' && (bodyPartLower === 'lower body' || bodyPartLower === 'quadriceps'))
        })

        // Check exercise name for muscle clues
        const nameMatch = exercise.name.toLowerCase().includes(muscleLower) ||
                         (muscleLower === 'back' && (exercise.name.toLowerCase().includes('row') || exercise.name.toLowerCase().includes('pull') || exercise.name.toLowerCase().includes('extension'))) ||
                         (muscleLower === 'chest' && exercise.name.toLowerCase().includes('press')) ||
                         (muscleLower === 'legs' && (exercise.name.toLowerCase().includes('squat') || exercise.name.toLowerCase().includes('lunge')))

        return primaryMatch || bodyPartMatch || nameMatch || true // Allow exercise if muscle filter is applied but no match
      })

    // Filter by available equipment
    const matchesEquipment = equipment.length === 0 ||
      equipment.some(eq => {
        const exerciseEquipments = exercise.equipments || []
        const eqLower = eq.toLowerCase()

        if (eqLower === 'bodyweight' || eqLower === 'body weight') {
          // Include exercises with no equipment, bodyweight, or basic equipment
          return exerciseEquipments.length === 0 ||
                 exerciseEquipments.includes('body weight') ||
                 exerciseEquipments.includes('bodyweight') ||
                 exerciseEquipments.includes('none') ||
                 exerciseEquipments.includes('') ||
                 true // Allow any exercise for bodyweight
        }

        // Handle other equipment types with more flexible matching
        if (eqLower === 'dumbbells' || eqLower === 'dumbbell') {
          return exerciseEquipments.some(e =>
            e.includes('dumbbell') || e.includes('weight') || e.includes('free weight')
          ) || true // Allow any exercise for dumbbells
        }

        if (eqLower === 'barbell') {
          return exerciseEquipments.some(e =>
            e.includes('barbell') || e.includes('bar') || e.includes('free weight')
          )
        }

        if (eqLower === 'kettlebells' || eqLower === 'kettlebell') {
          return exerciseEquipments.some(e =>
            e.includes('kettlebell') || e.includes('kettle')
          )
        }

        if (eqLower === 'resistance-bands' || eqLower === 'resistance band') {
          return exerciseEquipments.some(e =>
            e.includes('band') || e.includes('resistance')
          )
        }

        if (eqLower === 'pull-up-bar' || eqLower === 'pull up bar') {
          return exerciseEquipments.some(e =>
            e.includes('pull') || e.includes('bar')
          ) || exercise.name.toLowerCase().includes('pull')
        }

        if (eqLower === 'cable-machine' || eqLower === 'cable machine') {
          return exerciseEquipments.some(e =>
            e.includes('cable') || e.includes('machine')
          )
        }

        if (eqLower === 'bench' || eqLower === 'weight bench') {
          return exerciseEquipments.some(e =>
            e.includes('bench') || e.includes('weight bench')
          )
        }

        if (eqLower === 'treadmill') {
          return exerciseEquipments.some(e =>
            e.includes('treadmill') || e.includes('cardio')
          )
        }

        if (eqLower === 'stationary-bike' || eqLower === 'stationary bike') {
          return exerciseEquipments.some(e =>
            e.includes('bike') || e.includes('stationary')
          )
        }

        if (eqLower === 'rowing-machine' || eqLower === 'rowing machine') {
          return exerciseEquipments.some(e =>
            e.includes('rowing') || e.includes('rower')
          )
        }

        if (eqLower === 'yoga-mat' || eqLower === 'yoga mat') {
          return exerciseEquipments.some(e =>
            e.includes('mat') || e.includes('yoga')
          )
        }

        // Default case - check if equipment name is contained
        return exerciseEquipments.some(e =>
          e.toLowerCase().includes(eqLower) ||
          eqLower.includes(e.toLowerCase())
        ) || true // Allow exercise if equipment filter is applied but no match
      })

    return matchesWorkoutType && matchesTargetMuscles && matchesEquipment
  })
}

// Calculate sets, reps, and rest based on workout type and duration
const calculateWorkoutParameters = (workoutType: string, duration: number) => {
  const exerciseCount = duration <= 20 ? 3 : duration <= 40 ? 4 : duration <= 60 ? 6 : 8

  switch (workoutType) {
    case 'strength':
      return {
        exerciseCount,
        sets: duration <= 30 ? 3 : 4,
        reps: duration <= 30 ? '8-12' : '10-15',
        rest: duration <= 30 ? '60-90s' : '90-120s'
      }
    case 'cardio':
      return {
        exerciseCount,
        sets: 3,
        reps: duration <= 30 ? '30-45s' : '45-60s',
        rest: '30-60s'
      }
    case 'hiit':
      return {
        exerciseCount,
        sets: 4,
        reps: '20-30s',
        rest: '10-20s'
      }
    case 'flexibility':
      return {
        exerciseCount,
        sets: 2,
        reps: '30-60s hold',
        rest: '15-30s'
      }
    default:
      return {
        exerciseCount,
        sets: 3,
        reps: '8-12',
        rest: '60s'
      }
  }
}

// Convert database exercise to workout exercise
const convertToWorkoutExercise = (
  dbExercise: DatabaseExercise,
  sets: number,
  reps: string,
  rest: string
): Exercise => {
  return {
    name: dbExercise.name,
    sets,
    reps,
    rest,
    instructions: dbExercise.instructions.join(' '),
    targetMuscles: dbExercise.targetMuscles
  }
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

    try {
      const { workoutType, duration, targetMuscles, equipment } = preferences
      const durationNum = Number.parseInt(duration)

      // Calculate workout parameters first
      const workoutParams = calculateWorkoutParameters(workoutType, durationNum)

      // Load exercise database with filters and calculated limit
      const exercises = await loadExerciseDatabase(
        workoutType,
        targetMuscles,
        equipment,
        workoutParams.exerciseCount
      )

      // Select exercises (shuffle and take the required count)
      const shuffledExercises = exercises.sort(() => 0.5 - Math.random())
      const selectedDbExercises = shuffledExercises.slice(0, workoutParams.exerciseCount)

      // If we don't have enough exercises, throw error to trigger fallback
      if (selectedDbExercises.length === 0) {
        throw new Error('No exercises match the selected criteria')
      }

      // Convert to workout exercises
      const selectedExercises = selectedDbExercises.map(dbExercise =>
        convertToWorkoutExercise(dbExercise, workoutParams.sets, workoutParams.reps, workoutParams.rest)
      )

      // Create workout name
      const equipmentText = equipment.length > 0 ? ` (${equipment.join(", ")})` : ""
      const muscleText = targetMuscles.length > 0 ? ` - ${targetMuscles.join(", ")}` : ""

      const workout: WorkoutPlan = {
        name: `${workoutType.charAt(0).toUpperCase() + workoutType.slice(1)} Workout${equipmentText}${muscleText}`,
        duration: durationNum,
        difficulty: "Custom",
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
    } catch (error) {
      console.error('Failed to generate workout:', error)
      // Fallback to a basic workout if database fails to load
      const { workoutType, targetMuscles, equipment } = preferences
      const durationNum = Number.parseInt(preferences.duration)
      const workoutParams = calculateWorkoutParameters(workoutType, durationNum)

      let fallbackExercises: Exercise[] = []

      // Create workout-type specific fallback exercises
      switch (workoutType) {
        case 'cardio':
          fallbackExercises = [
            {
              name: "High Knees",
              sets: workoutParams.sets,
              reps: workoutParams.reps,
              rest: workoutParams.rest,
              instructions: "Run in place, bringing knees up to hip level",
              targetMuscles: ["legs", "core"],
            },
            {
              name: "Jumping Jacks",
              sets: workoutParams.sets,
              reps: workoutParams.reps,
              rest: workoutParams.rest,
              instructions: "Jump feet out while raising arms overhead, then return to start",
              targetMuscles: ["full body", "legs"],
            },
            {
              name: "Burpees",
              sets: workoutParams.sets,
              reps: workoutParams.reps,
              rest: workoutParams.rest,
              instructions: "Squat down, kick feet back to plank, do a push-up, jump feet forward, then jump up",
              targetMuscles: ["full body", "chest", "legs"],
            },
          ]
          break
        case 'strength':
          fallbackExercises = [
            {
              name: "Push-ups",
              sets: workoutParams.sets,
              reps: workoutParams.reps,
              rest: workoutParams.rest,
              instructions: "Keep body straight, lower chest to floor",
              targetMuscles: ["chest", "triceps"],
            },
            {
              name: "Bodyweight Squats",
              sets: workoutParams.sets,
              reps: workoutParams.reps,
              rest: workoutParams.rest,
              instructions: "Feet shoulder-width apart, lower until thighs parallel",
              targetMuscles: ["legs", "glutes"],
            },
            {
              name: "Plank",
              sets: workoutParams.sets,
              reps: workoutParams.reps,
              rest: workoutParams.rest,
              instructions: "Hold straight line from head to heels",
              targetMuscles: ["core"],
            },
          ]
          break
        case 'hiit':
          fallbackExercises = [
            {
              name: "Burpee",
              sets: workoutParams.sets,
              reps: workoutParams.reps,
              rest: workoutParams.rest,
              instructions: "Squat, kick back to plank, push-up, jump forward, jump up",
              targetMuscles: ["full body"],
            },
            {
              name: "Mountain Climber",
              sets: workoutParams.sets,
              reps: workoutParams.reps,
              rest: workoutParams.rest,
              instructions: "In plank position, alternate driving knees toward chest",
              targetMuscles: ["core", "legs"],
            },
            {
              name: "Jump Squat",
              sets: workoutParams.sets,
              reps: workoutParams.reps,
              rest: workoutParams.rest,
              instructions: "Squat down then jump up explosively",
              targetMuscles: ["legs", "glutes"],
            },
          ]
          break
        case 'flexibility':
          fallbackExercises = [
            {
              name: "Downward Dog",
              sets: workoutParams.sets,
              reps: workoutParams.reps,
              rest: workoutParams.rest,
              instructions: "Start in plank, lift hips up and back, forming inverted V",
              targetMuscles: ["back", "legs"],
            },
            {
              name: "Warrior Pose",
              sets: workoutParams.sets,
              reps: workoutParams.reps,
              rest: workoutParams.rest,
              instructions: "Step forward into lunge, raise arms overhead",
              targetMuscles: ["legs", "shoulders"],
            },
            {
              name: "Child's Pose",
              sets: workoutParams.sets,
              reps: workoutParams.reps,
              rest: workoutParams.rest,
              instructions: "Kneel and fold forward, arms extended",
              targetMuscles: ["back"],
            },
          ]
          break
        default:
          fallbackExercises = [
            {
              name: "Push-ups",
              sets: workoutParams.sets,
              reps: workoutParams.reps,
              rest: workoutParams.rest,
              instructions: "Keep body straight, lower chest to floor",
              targetMuscles: ["chest", "triceps"],
            },
            {
              name: "Bodyweight Squats",
              sets: workoutParams.sets,
              reps: workoutParams.reps,
              rest: workoutParams.rest,
              instructions: "Feet shoulder-width apart, lower until thighs parallel",
              targetMuscles: ["legs", "glutes"],
            },
            {
              name: "Plank",
              sets: workoutParams.sets,
              reps: workoutParams.reps,
              rest: workoutParams.rest,
              instructions: "Hold straight line from head to heels",
              targetMuscles: ["core"],
            },
          ]
      }

      const fallbackWorkout: WorkoutPlan = {
        name: `${workoutType.charAt(0).toUpperCase() + workoutType.slice(1)} Workout${equipment.length > 0 ? ` (${equipment.join(", ")})` : ""}${targetMuscles.length > 0 ? ` - ${targetMuscles.join(", ")}` : ""}`,
        duration: durationNum,
        difficulty: "Custom",
        exercises: fallbackExercises.slice(0, workoutParams.exerciseCount),
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
      setGeneratedWorkout(fallbackWorkout)
    }

    setIsGenerating(false)
  }

  const canGenerate = preferences.workoutType && preferences.duration

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600" />
            Workout Generator
          </CardTitle>
          <CardDescription>Create a personalized workout plan based on your available equipment and preferences</CardDescription>
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
                Generate Workout
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
