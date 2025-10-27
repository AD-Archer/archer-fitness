"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Zap, RefreshCw } from "lucide-react"
import { WorkoutPreferencesForm } from "./workout-preferences-form"
import { WorkoutDisplay } from "./workout-display"
import { logger } from "@/lib/logger"
import type { Exercise, WorkoutPlan } from "@/lib/workout-utils"
import { ExerciseSelectorDialog, ExerciseOption, CustomExerciseInput } from "./exercise-selector-dialog"
import { toast } from "sonner"

interface SavedWorkoutPrefs {
  defaultDuration: string
  difficultyLevel: string
  preferredTime: string
  availableEquipment: string[]
  restDayReminders: boolean
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
  matchScore?: number
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

type WorkoutConfig = {
  workoutType: string
  sets: number
  reps: string
  rest: string
  exerciseCount: number
}

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")

const toTitleCase = (value: string): string =>
  value
    .replace(/[_-]/g, " ")
    .replace(/\w/g, (char) => char.toUpperCase())

const normalizeEquipmentName = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9]/g, "")

const normalizeToken = (value: string): string => {
  const cleaned = value.toLowerCase().replace(/[^a-z0-9]/g, "")
  if (cleaned.length > 3 && cleaned.endsWith("s")) {
    return cleaned.slice(0, -1)
  }
  return cleaned
}

const tokenize = (value: string): string[] =>
  value
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .map(normalizeToken)
    .filter(Boolean)

const TOKEN_SYNONYMS: Record<string, string[]> = {
  chest: ["pec", "pectoral", "pectoralis"],
  pec: ["chest"],
  pectoral: ["chest"],
  pectoralis: ["chest"],
  back: ["lat", "lats", "latissimus", "trap", "traps", "rhomboid", "posterior"],
  lat: ["back"],
  lats: ["back"],
  latissimus: ["back"],
  trap: ["back"],
  traps: ["back"],
  rhomboid: ["back"],
  posterior: ["back"],
  shoulders: ["deltoid", "delt", "delts"],
  deltoid: ["shoulders"],
  delt: ["shoulders"],
  delts: ["shoulders"],
  legs: ["quad", "quadricep", "quadriceps", "hamstring", "calf", "lowerbody", "lower"],
  quadricep: ["legs"],
  quadriceps: ["legs"],
  quad: ["legs"],
  hamstring: ["legs"],
  calf: ["legs"],
  calves: ["legs"],
  lower: ["legs"],
  lowerbody: ["legs"],
  glute: ["glutes"],
  glutes: ["glute"],
  gluteus: ["glute"],
  arms: ["bicep", "tricep", "forearm"],
  bicep: ["arms"],
  tricep: ["arms"],
  forearm: ["arms"],
  core: ["abs", "ab", "oblique"],
  abs: ["core"],
  ab: ["core"],
  oblique: ["core"],
  cardio: ["hiit", "conditioning", "endurance"],
  hiit: ["cardio"],
  conditioning: ["cardio"],
  endurance: ["cardio"],
  fullbody: ["full", "total"],
  mobility: ["flexibility"],
  flexibility: ["mobility"],
  stretch: ["mobility", "flexibility"],
}

const addSynonyms = (tokens: Set<string>): Set<string> => {
  const expanded = new Set(tokens)
  tokens.forEach((token) => {
    const synonyms = TOKEN_SYNONYMS[token]
    if (synonyms) {
      synonyms.forEach((synonym) => {
        expanded.add(normalizeToken(synonym))
      })
    }
  })
  return expanded
}

const buildExerciseTokenSet = (exercise: DatabaseExercise): Set<string> => {
  const tokens = new Set<string>()

  const addValue = (value: string | undefined) => {
    if (!value) return
    const normalized = normalizeToken(value)
    if (normalized) {
      tokens.add(normalized)
    }
    tokenize(value).forEach((token) => tokens.add(token))
  }

  const addValues = (values: string[]) => {
    values.forEach(addValue)
  }

  addValue(exercise.name)
  addValue(exercise.bodyPart)
  addValue(exercise.target)
  addValues(exercise.bodyParts)
  addValues(exercise.targetMuscles)
  addValues(exercise.secondaryMuscles)

  return addSynonyms(tokens)
}

const tokenMatches = (tokenSet: Set<string>, needle: string): boolean => {
  const normalizedNeedle = normalizeToken(needle)
  if (!normalizedNeedle) {
    return false
  }
  if (tokenSet.has(normalizedNeedle)) {
    return true
  }

  const synonyms = TOKEN_SYNONYMS[normalizedNeedle] ?? []
  for (const synonym of synonyms) {
    const normalizedSynonym = normalizeToken(synonym)
    if (normalizedSynonym && tokenSet.has(normalizedSynonym)) {
      return true
    }
  }

  for (const token of tokenSet) {
    if (token.includes(normalizedNeedle) || normalizedNeedle.includes(token)) {
      return true
    }
  }

  return false
}

const formatLabel = (value: string): string => {
  const trimmed = value.trim()
  if (!trimmed) {
    return value
  }

  const normalized = trimmed.toLowerCase()
  if (normalized === "hiit") {
    return "HIIT"
  }
  if (normalized === "amrap") {
    return "AMRAP"
  }

  return toTitleCase(trimmed)
}

const uniqueDisplayStrings = (values: string[]): string[] => {
  const seen = new Set<string>()
  const result: string[] = []

  values.forEach((value) => {
    if (!value) {
      return
    }
    const trimmed = value.trim()
    if (!trimmed) {
      return
    }
    const normalized = trimmed.toLowerCase()
    if (seen.has(normalized)) {
      return
    }
    seen.add(normalized)
    result.push(formatLabel(trimmed))
  })

  return result
}

const getExerciseId = (exercise: Pick<DatabaseExercise, "exerciseId" | "name">): string =>
  exercise.exerciseId || slugify(exercise.name)

const getWorkoutExerciseId = (exercise: Exercise): string => exercise.id ?? slugify(exercise.name)

const determineIsTimeBased = (config: WorkoutConfig): boolean =>
  ["cardio", "hiit"].includes(config.workoutType) || /sec|min|hold|\bs\b/i.test(config.reps)

const convertToWorkoutExercise = (dbExercise: DatabaseExercise, config: WorkoutConfig): Exercise => {
  const instructions = dbExercise.instructions.join(" ").trim()
  const targetMuscles = uniqueDisplayStrings([
    ...dbExercise.targetMuscles,
    ...dbExercise.secondaryMuscles,
    ...dbExercise.bodyParts,
    dbExercise.bodyPart,
    dbExercise.target,
  ])
  const equipment = uniqueDisplayStrings(
    dbExercise.equipments.length > 0
      ? dbExercise.equipments
      : [dbExercise.equipment || "bodyweight"]
  )

  return {
    id: getExerciseId(dbExercise),
    name: formatLabel(dbExercise.name),
    sets: config.sets,
    reps: config.reps,
    rest: config.rest,
    instructions: instructions || "Focus on controlled tempo and keep great form throughout the movement.",
    targetMuscles: targetMuscles.length > 0 ? targetMuscles : ["Full Body"],
    equipment: equipment.length > 0 ? equipment : ["Bodyweight"],
    source: dbExercise.source ?? "database",
    isTimeBased: determineIsTimeBased(config),
    gifUrl: dbExercise.gifUrl,
  }
}

const uniqueById = (exercises: DatabaseExercise[]): DatabaseExercise[] => {
  const map = new Map<string, DatabaseExercise>()
  exercises.forEach((exercise) => {
    map.set(getExerciseId(exercise), exercise)
  })
  return Array.from(map.values())
}

const FALLBACK_DATABASE_EXERCISES: Record<string, () => DatabaseExercise[]> = {
  bodyweight: () => [
    {
      exerciseId: "fallback-high-knees",
      name: "High Knees Sprint",
      bodyParts: ["cardio", "legs", "core"],
      targetMuscles: ["legs", "core"],
      equipments: ["bodyweight"],
      instructions: [
        "Jog in place driving knees toward hip height while pumping your arms.",
        "Land softly and maintain an upright chest the entire time.",
      ],
      secondaryMuscles: ["calves", "glutes"],
      bodyPart: "legs",
      target: "legs",
      equipment: "bodyweight",
      gifUrl: "",
      source: "fallback",
    },
    {
      exerciseId: "fallback-burpees",
      name: "Burpees",
      bodyParts: ["full body"],
      targetMuscles: ["legs", "chest", "core"],
      equipments: ["bodyweight"],
      instructions: [
        "From standing, squat down, plant your hands, and kick your feet to a plank.",
        "Lower into a push-up if desired, jump feet back forward, and finish with an explosive jump.",
      ],
      secondaryMuscles: ["shoulders", "arms"],
      bodyPart: "full body",
      target: "legs",
      equipment: "bodyweight",
      gifUrl: "",
      source: "fallback",
    },
    {
      exerciseId: "fallback-plank-shoulder-taps",
      name: "Plank Shoulder Taps",
      bodyParts: ["core", "shoulders"],
      targetMuscles: ["core"],
      equipments: ["bodyweight"],
      instructions: [
        "Hold a strong high plank with feet slightly wider than hips.",
        "Alternate tapping opposite shoulders while resisting hip sway.",
      ],
      secondaryMuscles: ["shoulders", "glutes"],
      bodyPart: "core",
      target: "core",
      equipment: "bodyweight",
      gifUrl: "",
      source: "fallback",
    },
  ],
  dumbbell: () => [
    {
      exerciseId: "fallback-dumbbell-rdl",
      name: "Dumbbell Romanian Deadlift",
      bodyParts: ["posterior chain", "legs"],
      targetMuscles: ["hamstrings", "glutes"],
      equipments: ["dumbbell"],
      instructions: [
        "Hold dumbbells at your thighs, hinge at the hips maintaining a neutral spine.",
        "Lower until you feel a hamstring stretch, then drive hips forward to stand tall.",
      ],
      secondaryMuscles: ["lower back", "core"],
      bodyPart: "legs",
      target: "hamstrings",
      equipment: "dumbbell",
      gifUrl: "",
      source: "fallback",
    },
    {
      exerciseId: "fallback-single-arm-row",
      name: "Single-Arm Dumbbell Row",
      bodyParts: ["back", "arms"],
      targetMuscles: ["lats", "upper back"],
      equipments: ["dumbbell"],
      instructions: [
        "Brace one hand on a bench, keep spine long, and pull the dumbbell toward your hip.",
        "Squeeze shoulder blade at the top and control the lowering phase.",
      ],
      secondaryMuscles: ["biceps", "core"],
      bodyPart: "back",
      target: "back",
      equipment: "dumbbell",
      gifUrl: "",
      source: "fallback",
    },
    {
      exerciseId: "fallback-dumbbell-push-press",
      name: "Dumbbell Push Press",
      bodyParts: ["shoulders", "full body"],
      targetMuscles: ["shoulders", "triceps"],
      equipments: ["dumbbell"],
      instructions: [
        "Stand tall with dumbbells at shoulder height, dip through knees slightly, and drive weights overhead.",
        "Lock out elbows and lower under control before the next rep.",
      ],
      secondaryMuscles: ["legs", "core"],
      bodyPart: "shoulders",
      target: "shoulders",
      equipment: "dumbbell",
      gifUrl: "",
      source: "fallback",
    },
  ],
  kettlebell: () => [
    {
      exerciseId: "fallback-kettlebell-swing",
      name: "Kettlebell Swing",
      bodyParts: ["posterior chain", "cardio"],
      targetMuscles: ["glutes", "hamstrings"],
      equipments: ["kettlebell"],
      instructions: [
        "Hinge at the hips, hike the kettlebell back, then explosively drive hips forward to swing chest height.",
        "Keep lats engaged and avoid overextending the lower back.",
      ],
      secondaryMuscles: ["core", "shoulders"],
      bodyPart: "legs",
      target: "glutes",
      equipment: "kettlebell",
      gifUrl: "",
      source: "fallback",
    },
    {
      exerciseId: "fallback-kettlebell-goblet-squat",
      name: "Kettlebell Goblet Squat",
      bodyParts: ["legs"],
      targetMuscles: ["quads", "glutes"],
      equipments: ["kettlebell"],
      instructions: [
        "Hold the kettlebell at chest height, keep elbows close, and squat until hips are below parallel.",
        "Drive through mid-foot to stand while keeping chest tall.",
      ],
      secondaryMuscles: ["core"],
      bodyPart: "legs",
      target: "quads",
      equipment: "kettlebell",
      gifUrl: "",
      source: "fallback",
    },
    {
      exerciseId: "fallback-kettlebell-high-pull",
      name: "Kettlebell High Pull",
      bodyParts: ["shoulders", "posterior chain"],
      targetMuscles: ["shoulders", "upper back"],
      equipments: ["kettlebell"],
      instructions: [
        "From a hinge position, drive hips forward and pull kettlebell toward chest height keeping elbows high.",
        "Control the return and reset your stance between reps.",
      ],
      secondaryMuscles: ["glutes", "hamstrings"],
      bodyPart: "shoulders",
      target: "shoulders",
      equipment: "kettlebell",
      gifUrl: "",
      source: "fallback",
    },
  ],
  barbell: () => [
    {
      exerciseId: "fallback-barbell-deadlift",
      name: "Barbell Deadlift",
      bodyParts: ["posterior chain"],
      targetMuscles: ["glutes", "hamstrings"],
      equipments: ["barbell"],
      instructions: [
        "Set feet hip-width, brace core, drive floor away as you stand with the bar close to your shins.",
        "Lower with control, keeping spine neutral and lats engaged.",
      ],
      secondaryMuscles: ["upper back", "core"],
      bodyPart: "back",
      target: "glutes",
      equipment: "barbell",
      gifUrl: "",
      source: "fallback",
    },
    {
      exerciseId: "fallback-barbell-row",
      name: "Barbell Bent-Over Row",
      bodyParts: ["back"],
      targetMuscles: ["lats", "mid back"],
      equipments: ["barbell"],
      instructions: [
        "Hinge forward to a 45° torso angle and pull the bar toward your lower ribs.",
        "Squeeze shoulder blades together and control the lowering phase.",
      ],
      secondaryMuscles: ["biceps", "posterior delts"],
      bodyPart: "back",
      target: "back",
      equipment: "barbell",
      gifUrl: "",
      source: "fallback",
    },
    {
      exerciseId: "fallback-barbell-press",
      name: "Standing Barbell Press",
      bodyParts: ["shoulders"],
      targetMuscles: ["shoulders", "triceps"],
      equipments: ["barbell"],
      instructions: [
        "Press the bar overhead while bracing your glutes and core to prevent lean-back.",
        "Lower under control until the bar is at chin level.",
      ],
      secondaryMuscles: ["core", "upper back"],
      bodyPart: "shoulders",
      target: "shoulders",
      equipment: "barbell",
      gifUrl: "",
      source: "fallback",
    },
  ],
  resistanceband: () => [
    {
      exerciseId: "fallback-band-row",
      name: "Resistance Band Row",
      bodyParts: ["back"],
      targetMuscles: ["mid back", "lats"],
      equipments: ["resistance band"],
      instructions: [
        "Anchor the band at chest height, step back to create tension, and pull elbows toward your ribs.",
        "Pause with shoulder blades squeezed and control the return.",
      ],
      secondaryMuscles: ["biceps"],
      bodyPart: "back",
      target: "back",
      equipment: "resistance band",
      gifUrl: "",
      source: "fallback",
    },
    {
      exerciseId: "fallback-band-squat",
      name: "Banded Squat to Press",
      bodyParts: ["legs", "shoulders"],
      targetMuscles: ["quads", "shoulders"],
      equipments: ["resistance band"],
      instructions: [
        "Stand on the band, hold handles at shoulders, sit into a squat, then stand and press overhead.",
        "Keep knees tracking over toes and core braced.",
      ],
      secondaryMuscles: ["glutes", "core"],
      bodyPart: "legs",
      target: "legs",
      equipment: "resistance band",
      gifUrl: "",
      source: "fallback",
    },
    {
      exerciseId: "fallback-band-pallof",
      name: "Pallof Press",
      bodyParts: ["core"],
      targetMuscles: ["core", "obliques"],
      equipments: ["resistance band"],
      instructions: [
        "Stand perpendicular to the anchor, press the band straight out, resisting rotation.",
        "Hold briefly then return hands to chest before the next rep.",
      ],
      secondaryMuscles: ["shoulders"],
      bodyPart: "core",
      target: "core",
      equipment: "resistance band",
      gifUrl: "",
      source: "fallback",
    },
  ],
  pullupbar: () => [
    {
      exerciseId: "fallback-pull-up",
      name: "Pull-Ups",
      bodyParts: ["back", "arms"],
      targetMuscles: ["lats", "biceps"],
      equipments: ["pull-up bar"],
      instructions: [
        "Hang from the bar with active shoulders and pull your chest toward the bar.",
        "Lower with control and keep core braced to avoid swinging.",
      ],
      secondaryMuscles: ["core", "forearms"],
      bodyPart: "back",
      target: "back",
      equipment: "pull-up bar",
      gifUrl: "",
      source: "fallback",
    },
    {
      exerciseId: "fallback-hanging-knee-raise",
      name: "Hanging Knee Raise",
      bodyParts: ["core", "hip flexors"],
      targetMuscles: ["core"],
      equipments: ["pull-up bar"],
      instructions: [
        "Hang with a neutral grip, brace abs, and draw knees toward chest without swinging.",
        "Lower slowly to maintain control.",
      ],
      secondaryMuscles: ["hip flexors"],
      bodyPart: "core",
      target: "core",
      equipment: "pull-up bar",
      gifUrl: "",
      source: "fallback",
    },
    {
      exerciseId: "fallback-negative-pull-up",
      name: "Negative Pull-Up",
      bodyParts: ["back", "arms"],
      targetMuscles: ["lats", "biceps"],
      equipments: ["pull-up bar"],
      instructions: [
        "Use a box to start at the top of the pull-up and slowly lower for 3-5 seconds.",
        "Reset and repeat, focusing on control.",
      ],
      secondaryMuscles: ["core"],
      bodyPart: "back",
      target: "back",
      equipment: "pull-up bar",
      gifUrl: "",
      source: "fallback",
    },
  ],
  bench: () => [
    {
      exerciseId: "fallback-bench-press",
      name: "Dumbbell Bench Press",
      bodyParts: ["chest", "arms"],
      targetMuscles: ["chest", "triceps"],
      equipments: ["bench", "dumbbell"],
      instructions: [
        "Lie on the bench, press dumbbells over the chest, wrists stacked, elbows at ~45°.",
        "Lower until elbows are just below bench height then press back up.",
      ],
      secondaryMuscles: ["shoulders"],
      bodyPart: "chest",
      target: "chest",
      equipment: "bench",
      gifUrl: "",
      source: "fallback",
    },
    {
      exerciseId: "fallback-bulgarian-split-squat",
      name: "Bulgarian Split Squat",
      bodyParts: ["legs"],
      targetMuscles: ["quads", "glutes"],
      equipments: ["bench"],
      instructions: [
        "Place rear foot on the bench, descend until front thigh is parallel, keeping torso tall.",
        "Drive through front heel to stand and maintain balance.",
      ],
      secondaryMuscles: ["hamstrings", "core"],
      bodyPart: "legs",
      target: "legs",
      equipment: "bench",
      gifUrl: "",
      source: "fallback",
    },
    {
      exerciseId: "fallback-bench-tricep-dip",
      name: "Bench Tricep Dip",
      bodyParts: ["arms"],
      targetMuscles: ["triceps"],
      equipments: ["bench"],
      instructions: [
        "With hands on the bench behind you, lower hips by bending elbows to ~90°.",
        "Press back up without locking elbows completely.",
      ],
      secondaryMuscles: ["shoulders", "chest"],
      bodyPart: "arms",
      target: "arms",
      equipment: "bench",
      gifUrl: "",
      source: "fallback",
    },
  ],
}

const createGenericEquipmentFallback = (equipmentName: string): DatabaseExercise[] => {
  const slug = normalizeEquipmentName(equipmentName) || "equipment"
  const label = formatLabel(equipmentName || "Equipment")

  return [
    {
      exerciseId: `fallback-${slug}-complex`,
      name: `${label} Complex`,
      bodyParts: ["full body"],
      targetMuscles: ["full body"],
      equipments: [equipmentName],
      instructions: [
        `Cycle through 3 movements using your ${label.toLowerCase()} for a strength-and-cardio blast.`,
        "Keep transitions crisp and rest minimally between rounds.",
      ],
      secondaryMuscles: ["core"],
      bodyPart: "full body",
      target: "full body",
      equipment: equipmentName,
      gifUrl: "",
      source: "fallback",
    },
    {
      exerciseId: `fallback-${slug}-strength`,
      name: `${label} Strength Ladder`,
      bodyParts: ["strength"],
      targetMuscles: ["full body"],
      equipments: [equipmentName],
      instructions: [
        `Pick two staple moves with your ${label.toLowerCase()} and ladder reps 10→8→6.`,
        "Focus on crisp form and controlled tempo throughout.",
      ],
      secondaryMuscles: ["stability"],
      bodyPart: "full body",
      target: "full body",
      equipment: equipmentName,
      gifUrl: "",
      source: "fallback",
    },
  ]
}

const buildFallbackExercisePool = (equipment: string[]): DatabaseExercise[] => {
  const normalized = equipment.length > 0 ? equipment.map(normalizeEquipmentName) : ["bodyweight"]
  const pool: DatabaseExercise[] = []

  normalized.forEach((key, index) => {
    const generator = FALLBACK_DATABASE_EXERCISES[key]
    if (generator) {
      pool.push(...generator())
    } else if (equipment[index]) {
      pool.push(...createGenericEquipmentFallback(equipment[index]))
    }
  })

  if (pool.length === 0) {
    pool.push(...FALLBACK_DATABASE_EXERCISES.bodyweight())
  }

  return uniqueById(pool)
}

const selectVariedExercises = (exercises: DatabaseExercise[], count: number): DatabaseExercise[] => {
  if (exercises.length <= count) {
    return weightedShuffle(exercises)
  }

  const selected: DatabaseExercise[] = []
  const selectedIds = new Set<string>()
  const grouped = new Map<string, DatabaseExercise[]>()

  exercises.forEach((exercise) => {
    const groupKey =
      exercise.targetMuscles[0] ||
      exercise.bodyParts[0] ||
      exercise.target ||
      exercise.bodyPart ||
      "general"

    const existing = grouped.get(groupKey) ?? []
    existing.push(exercise)
    grouped.set(groupKey, existing)
  })

  const rankedGroups = Array.from(grouped.entries())
    .map(([key, entries]) => {
      const shuffled = weightedShuffle(entries)
      const bestScore = Math.max(...shuffled.map((item) => item.matchScore ?? 0), 0)
      return { key, entries: shuffled, score: bestScore }
    })
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score
      }
      return Math.random() - 0.5
    })

  const groupOrder = rankedGroups.map((entry) => entry.key)
  const groupLookup = new Map(rankedGroups.map((entry) => [entry.key, entry.entries]))
  let guard = 0

  while (selected.length < count && guard < count * groupOrder.length * 2) {
    const key = groupOrder[guard % groupOrder.length]
    const bucket = groupLookup.get(key)
    if (bucket && bucket.length > 0) {
      const candidate = bucket.shift()!
      const candidateId = getExerciseId(candidate)
      if (!selectedIds.has(candidateId)) {
        selected.push(candidate)
        selectedIds.add(candidateId)
      }
    }
    guard++
  }

  if (selected.length < count) {
    const remaining = weightedShuffle(
      exercises.filter((exercise) => !selectedIds.has(getExerciseId(exercise)))
    )
    selected.push(...remaining.slice(0, count - selected.length))
  }

  return selected.slice(0, count)
}

const formatListForName = (values: string[]): string[] => values.map(formatLabel)

const createWorkoutPlan = (
  workoutType: string,
  duration: number,
  equipment: string[],
  targetBodyParts: string[],
  targetMuscles: string[],
  exercises: Exercise[]
): WorkoutPlan => {
  const formattedEquipment = equipment.length > 0 ? formatListForName(equipment) : []
  const formattedBodyParts = targetBodyParts.length > 0 ? formatListForName(targetBodyParts) : []
  const formattedMuscles = targetMuscles.length > 0 ? formatListForName(targetMuscles) : []

  const equipmentText = formattedEquipment.length > 0 ? ` (${formattedEquipment.join(", ")})` : ""
  const bodyPartText = formattedBodyParts.length > 0 ? ` - ${formattedBodyParts.join(", ")}` : ""
  const muscleText = formattedMuscles.length > 0 && formattedBodyParts.length === 0 ? ` - ${formattedMuscles.join(", ")}` : ""

  return {
    name: `${formatLabel(workoutType)} Workout${equipmentText}${bodyPartText}${muscleText}`,
    duration,
    difficulty: "Custom",
    exercises,
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
}

const buildFallbackWorkout = (
  workoutType: string,
  duration: number,
  targetMuscles: string[],
  targetBodyParts: string[],
  equipment: string[],
  config: WorkoutConfig
): {
  workout: WorkoutPlan
  pool: DatabaseExercise[]
  pinnedId: string
} => {
  const fallbackPool = buildFallbackExercisePool(equipment)
  const varied = selectVariedExercises(fallbackPool, config.exerciseCount)
  const exercises = varied
    .slice(0, config.exerciseCount)
    .map((exercise) => convertToWorkoutExercise(exercise, config))

  return {
    workout: createWorkoutPlan(
      workoutType,
      duration,
      equipment,
      targetBodyParts,
      targetMuscles,
      exercises
    ),
    pool: fallbackPool,
    pinnedId: '',
  }
}

// Load exercise database from API with filters
const loadExerciseDatabase = async (
  workoutType: string,
  targetMuscles: string[],
  targetBodyParts: string[],
  equipment: string[],
  exerciseCount: number
): Promise<DatabaseExercise[]> => {
  try {
    // Build query parameters - fetch more exercises to ensure better variety
    const params = new URLSearchParams()
    params.append('limit', Math.max(100, exerciseCount * 10).toString()) // Fetch significantly more exercises for better randomization

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
      gifUrl: (exercise as any).gifUrl || '',
      source: 'database'
    }))

    // Apply frontend filtering
    const filteredExercises = filterExercises(convertedExercises, workoutType, targetMuscles, targetBodyParts, equipment)

    // Return only the filtered exercises (no need to slice here, we'll do it in generateWorkout)
    return filteredExercises
  } catch (error) {
    logger.error('Failed to load exercise database:', error)
    return []
  }
}

const isBodyweightEquipment = (value: string): boolean => {
  const normalized = value.toLowerCase().replace(/[^a-z0-9]/g, "")
  return (
    normalized.length === 0 ||
    normalized === "bodyweight" ||
    normalized === "body" ||
    normalized === "none" ||
    normalized === "noequipment"
  )
}

const buildEquipmentSet = (exercise: DatabaseExercise): Set<string> => {
  const equipmentSet = new Set<string>()

  exercise.equipments.forEach((entry) => {
    const normalized = normalizeEquipmentName(entry)
    if (normalized) {
      equipmentSet.add(normalized)
    }
  })

  const primary = normalizeEquipmentName(exercise.equipment)
  if (primary) {
    equipmentSet.add(primary)
  }

  equipmentSet.delete("")
  return equipmentSet
}

const WORKOUT_TYPE_KEYWORDS: Record<string, string[]> = {
  strength: ["strength", "power", "press", "row", "deadlift", "squat", "hinge", "pull", "push", "lift"],
  cardio: ["cardio", "conditioning", "endurance", "run", "cycle", "bike", "jump", "burpee", "sprint", "interval"],
  hiit: ["hiit", "interval", "plyometric", "tabata", "burpee", "sprint", "circuit"],
  flexibility: ["flexibility", "mobility", "stretch", "yoga", "pilates", "recover"],
}

const computeWorkoutTypeScore = (
  exercise: DatabaseExercise,
  workoutType: string,
  tokens: Set<string>
): number => {
  const normalizedType = normalizeToken(workoutType)
  if (!normalizedType) {
    return 0
  }

  const keywords = WORKOUT_TYPE_KEYWORDS[normalizedType]
  if (!keywords || keywords.length === 0) {
    return 0
  }

  let matches = 0
  keywords.forEach((keyword) => {
    if (tokenMatches(tokens, keyword)) {
      matches += 1
    }
  })

  const name = exercise.name.toLowerCase()
  if (normalizedType === "cardio") {
    if (name.includes("run") || name.includes("row") || name.includes("bike") || name.includes("jump")) {
      matches += 1
    }
  }

  if (normalizedType === "strength") {
    if (name.includes("press") || name.includes("row") || name.includes("deadlift") || name.includes("squat") || name.includes("pull") || name.includes("push")) {
      matches += 1
    }
  }

  if (normalizedType === "flexibility") {
    if (name.includes("stretch") || name.includes("mobility") || name.includes("yoga")) {
      matches += 1
    }
  }

  if (normalizedType === "hiit") {
    if (name.includes("hiit") || name.includes("interval") || name.includes("circuit")) {
      matches += 1
    }
  }

  const capped = Math.min(matches, 5)
  return capped > 0 ? 1.5 + capped : 0
}

// Filter exercises based on criteria and score them for smarter randomness
const filterExercises = (
  exercises: DatabaseExercise[],
  workoutType: string,
  targetMuscles: string[],
  targetBodyParts: string[],
  equipment: string[]
): DatabaseExercise[] => {
  const normalizedMuscles = targetMuscles.map(normalizeToken).filter(Boolean)
  const normalizedBodyParts = targetBodyParts.map(normalizeToken).filter(Boolean)
  const allowedEquipment = new Set(
    equipment.map(normalizeEquipmentName).filter(Boolean)
  )

  if (
    normalizedMuscles.length === 0 &&
    normalizedBodyParts.length === 0 &&
    allowedEquipment.size === 0 &&
    !workoutType
  ) {
    return exercises
  }

  const scored: DatabaseExercise[] = []

  exercises.forEach((exercise) => {
    const tokens = buildExerciseTokenSet(exercise)
    const equipmentSet = buildEquipmentSet(exercise)
    const hasEquipment = equipmentSet.size > 0
    const requiresSpecificEquipment = allowedEquipment.size > 0

    if (requiresSpecificEquipment) {
      const hasMismatch = Array.from(equipmentSet).some(
        (item) => !isBodyweightEquipment(item) && !allowedEquipment.has(item)
      )
      if (hasMismatch) {
        return
      }
    }

    let equipmentScore = 0
    if (requiresSpecificEquipment) {
      let matchedEquipment = 0
      allowedEquipment.forEach((item) => {
        if (!item) return
        if (item === "bodyweight") {
          if (equipmentSet.size === 0 || Array.from(equipmentSet).some(isBodyweightEquipment)) {
            matchedEquipment += 1
          }
          return
        }

        if (
          equipmentSet.has(item) ||
          Array.from(equipmentSet).some(
            (entry) => entry.includes(item) || item.includes(entry)
          )
        ) {
          matchedEquipment += 1
        }
      })

      if (matchedEquipment === 0 && hasEquipment) {
        return
      }

      equipmentScore = matchedEquipment > 0 ? 4 + matchedEquipment * 1.2 : hasEquipment ? 1 : 2
    } else {
      equipmentScore = hasEquipment ? 1 : 2.5
    }

    const matchedMuscles = normalizedMuscles.filter((needle) =>
      tokenMatches(tokens, needle)
    ).length
    const matchedBodyParts = normalizedBodyParts.filter((needle) =>
      tokenMatches(tokens, needle)
    ).length

    const workoutScore = computeWorkoutTypeScore(exercise, workoutType, tokens)

    let score = equipmentScore + workoutScore

    if (normalizedMuscles.length > 0) {
      score += matchedMuscles > 0 ? matchedMuscles * 4 : -3
    }

    if (normalizedBodyParts.length > 0) {
      score += matchedBodyParts > 0 ? matchedBodyParts * 3 : -1.5
    }

    const normalizedName = normalizeToken(exercise.name)
    if (
      normalizedMuscles.some((muscle) => normalizedName.includes(muscle))
    ) {
      score += 1.25
    }
    if (
      normalizedBodyParts.some((bodyPart) => normalizedName.includes(bodyPart))
    ) {
      score += 0.75
    }

    const targetsCount =
      normalizedMuscles.length + normalizedBodyParts.length
    if (targetsCount > 0) {
      const coverage = matchedMuscles + matchedBodyParts
      score += (coverage / targetsCount) * 1.5
    }

    score += Math.random() * 0.25

    const matchScore = Number(score.toFixed(3))
    scored.push({
      ...exercise,
      matchScore,
    })
  })

  if (scored.length === 0) {
    return []
  }

  return scored.sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0))
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

// Better randomization: Use Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function weightedShuffle<T extends { matchScore?: number }>(array: T[]): T[] {
  return [...array]
    .map((item) => ({
      item,
      weight: (item.matchScore ?? 0) + Math.random(),
    }))
    .sort((a, b) => b.weight - a.weight)
    .map((entry) => entry.item)
}

// Load saved workout preferences from user settings
const loadSavedWorkoutPreferences = async (): Promise<SavedWorkoutPrefs | null> => {
  try {
    const response = await fetch('/api/user/preferences')
    if (!response.ok) {
      logger.warn('Failed to fetch user preferences:', response.statusText)
      return null
    }
    
    const data = await response.json()
    return data.preferences?.workoutPrefs || null
  } catch (error) {
    logger.error('Error loading saved workout preferences:', error)
    return null
  }
}

export function AIWorkoutGenerator() {
  const [preferences, setPreferences] = useState({
    fitnessLevel: "",
    workoutType: "",
    duration: "",
    targetMuscles: [] as string[],
    targetBodyParts: [] as string[],
    equipment: [] as string[],
    notes: "",
  })
  const [savedPrefs, setSavedPrefs] = useState<SavedWorkoutPrefs | null>(null)
  const [isLoadingPrefs, setIsLoadingPrefs] = useState(true)
  const [generatedWorkout, setGeneratedWorkout] = useState<WorkoutPlan | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [exercisePool, setExercisePool] = useState<DatabaseExercise[]>([])
  const [currentConfig, setCurrentConfig] = useState<WorkoutConfig | null>(null)
  const [isExercisePickerOpen, setIsExercisePickerOpen] = useState(false)

  // Load saved preferences on component mount
  useEffect(() => {
    const loadPrefs = async () => {
      const saved = await loadSavedWorkoutPreferences()
      setSavedPrefs(saved)
      
      // Auto-fill form with saved preferences if available
      if (saved) {
        setPreferences(prev => ({
          ...prev,
          // Map saved preferences to form preferences
          duration: saved.defaultDuration || "",
          equipment: saved.availableEquipment || [],
          // Set fitness level based on difficulty level from settings
          fitnessLevel: saved.difficultyLevel || "",
        }))
      }
      
      setIsLoadingPrefs(false)
    }
    
    loadPrefs()
  }, [])

  const generateWorkout = async () => {
    setIsGenerating(true)
    setIsExercisePickerOpen(false)

    const { workoutType, duration, targetMuscles, targetBodyParts, equipment } = preferences
    const parsedDuration = Number.parseInt(duration || "0", 10)
    const durationMinutes = Number.isNaN(parsedDuration) ? 30 : parsedDuration
    const normalizedBodyParts = targetBodyParts || []

    const workoutParams = calculateWorkoutParameters(workoutType, durationMinutes)
    const config: WorkoutConfig = {
      workoutType: workoutType || "custom",
      sets: workoutParams.sets,
      reps: workoutParams.reps,
      rest: workoutParams.rest,
      exerciseCount: workoutParams.exerciseCount,
    }

    setCurrentConfig(config)

    try {
      const exercises = await loadExerciseDatabase(
        workoutType,
        targetMuscles,
        normalizedBodyParts,
        equipment,
        workoutParams.exerciseCount
      )

      if (exercises.length === 0) {
        throw new Error('No exercises match the selected criteria')
      }

      const uniqueExercises = uniqueById(exercises)
      const variedExercises = selectVariedExercises(uniqueExercises, workoutParams.exerciseCount)
      const workoutExercises = variedExercises
        .slice(0, workoutParams.exerciseCount)
        .map((dbExercise) => convertToWorkoutExercise(dbExercise, config))

      const workout = createWorkoutPlan(
        config.workoutType,
        durationMinutes,
        equipment,
        normalizedBodyParts,
        targetMuscles,
        workoutExercises
      )

  setGeneratedWorkout(workout)
  setExercisePool(uniqueExercises)
    } catch (error) {
      logger.error('Failed to generate workout:', error)
      const fallback = buildFallbackWorkout(
        config.workoutType,
        durationMinutes,
        targetMuscles,
        normalizedBodyParts,
        equipment,
        config
      )
  setGeneratedWorkout(fallback.workout)
  setExercisePool(uniqueById(fallback.pool))
      toast.info('Showing a curated backup workout while we refresh the exercise library.')
    } finally {
      setIsGenerating(false)
    }
  }

  const exerciseOptions = useMemo<ExerciseOption[]>(() => {
    if (exercisePool.length === 0) {
      return []
    }

    return exercisePool.map((exercise) => ({
      id: getExerciseId(exercise),
      name: formatLabel(exercise.name),
      targetMuscles: uniqueDisplayStrings([
        ...exercise.targetMuscles,
        ...exercise.secondaryMuscles,
        ...exercise.bodyParts,
      ]),
      equipment: uniqueDisplayStrings(
        exercise.equipments.length > 0 ? exercise.equipments : [exercise.equipment || 'bodyweight']
      ),
      instructions: exercise.instructions.join(' '),
      source: exercise.source ? formatLabel(exercise.source) : undefined,
    }))
  }, [exercisePool])

  const selectedExerciseIds = useMemo(() => {
    if (!generatedWorkout) {
      return new Set<string>()
    }

    return new Set(generatedWorkout.exercises.map((exercise) => getWorkoutExerciseId(exercise)))
  }, [generatedWorkout])

  const handleRemoveExercise = (exerciseId: string) => {
    if (!generatedWorkout) {
      return
    }

    setGeneratedWorkout((previous) => {
      if (!previous) {
        return previous
      }

      const updatedExercises = previous.exercises.filter(
        (exercise) => getWorkoutExerciseId(exercise) !== exerciseId
      )

      return { ...previous, exercises: updatedExercises }
    })
  }

  const handleRegenerateExercise = (exerciseId: string) => {
    if (!generatedWorkout || !currentConfig) {
      return
    }

    const index = generatedWorkout.exercises.findIndex(
      (exercise) => getWorkoutExerciseId(exercise) === exerciseId
    )

    if (index === -1) {
      return
    }

    const usedIds = new Set(
      generatedWorkout.exercises
        .filter((_, idx) => idx !== index)
        .map((exercise) => getWorkoutExerciseId(exercise))
    )

    const poolToSearch =
      exercisePool.length > 0 ? exercisePool : buildFallbackExercisePool(preferences.equipment)
  if (poolToSearch.length === 0) {
    toast.error('No additional exercises are available to swap in right now.')
    return
  }

  const availableCandidates = poolToSearch.filter(
    (exercise) => !usedIds.has(getExerciseId(exercise)) && getExerciseId(exercise) !== exerciseId
  )

  const candidatePool = availableCandidates.length > 0 ? availableCandidates : poolToSearch

  const targetBodyParts = preferences.targetBodyParts || []
  const prioritizedByCriteria = filterExercises(
    candidatePool,
    preferences.workoutType,
    preferences.targetMuscles,
    targetBodyParts,
    preferences.equipment
  )

  const prioritizedPool = prioritizedByCriteria.length > 0 ? prioritizedByCriteria : candidatePool
  const weightedPool = weightedShuffle(prioritizedPool)
  const replacementDb = weightedPool[0]

  if (!replacementDb) {
    toast.error('No additional exercises are available to swap in right now.')
    return
  }

    const replacementExercise = convertToWorkoutExercise(replacementDb, currentConfig)

    setGeneratedWorkout((previous) => {
      if (!previous) {
        return previous
      }

      const updatedExercises = [...previous.exercises]
      updatedExercises[index] = replacementExercise
      return { ...previous, exercises: updatedExercises }
    })
  }

  const handleAddExerciseFromOption = (option: ExerciseOption) => {
    if (!generatedWorkout || !currentConfig) {
      return
    }

    if (selectedExerciseIds.has(option.id)) {
      toast.info('That exercise is already part of your plan.')
      return
    }

    const databaseExercise = exercisePool.find((exercise) => getExerciseId(exercise) === option.id)

    if (!databaseExercise) {
      toast.error('Exercise not found in database. Please try a different exercise.')
      return
    }

    const workoutExercise = convertToWorkoutExercise(databaseExercise, currentConfig)

    setGeneratedWorkout((previous) =>
      previous ? { ...previous, exercises: [...previous.exercises, workoutExercise] } : previous
    )
  }

  const handleCreateCustomExercise = (custom: CustomExerciseInput) => {
    if (!generatedWorkout) {
      return
    }

    const exerciseId = `custom-${slugify(custom.name)}-${Date.now()}`
    const workoutExercise: Exercise = {
      id: exerciseId,
      name: formatLabel(custom.name),
      sets: custom.sets,
      reps: custom.reps,
      rest: custom.rest,
      instructions:
        custom.instructions || 'Include precise coaching cues so you remember how this should feel.',
      targetMuscles:
        custom.targetMuscles.length > 0
          ? custom.targetMuscles.map(formatLabel)
          : ['Full Body'],
      equipment:
        custom.equipment.length > 0
          ? custom.equipment.map(formatLabel)
          : ['Bodyweight'],
      source: 'custom',
      isTimeBased: custom.isTimeBased,
    }

    setGeneratedWorkout((previous) =>
      previous ? { ...previous, exercises: [...previous.exercises, workoutExercise] } : previous
    )
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
            savedPrefs={savedPrefs}
            isLoadingPrefs={isLoadingPrefs}
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
        <>
          <WorkoutDisplay
            workout={generatedWorkout}
            userNotes={preferences.notes}
            onRegeneratePlan={generateWorkout}
            onRemoveExercise={handleRemoveExercise}
            onRegenerateExercise={handleRegenerateExercise}
            onAddExercise={() => setIsExercisePickerOpen(true)}
          />

          <ExerciseSelectorDialog
            open={isExercisePickerOpen}
            onOpenChange={setIsExercisePickerOpen}
            exercises={exerciseOptions}
            selectedExerciseIds={selectedExerciseIds}
            onSelectExercise={handleAddExerciseFromOption}
            onCreateCustomExercise={handleCreateCustomExercise}
            defaultSets={currentConfig?.sets ?? 3}
            defaultReps={currentConfig?.reps ?? '8-12'}
            defaultRest={currentConfig?.rest ?? '60s'}
            workoutType={currentConfig?.workoutType ?? preferences.workoutType}
            defaultTargetMuscles={preferences.targetMuscles}
            defaultEquipment={preferences.equipment}
          />
        </>
      )}
    </div>
  )
}
