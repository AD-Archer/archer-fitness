import { logger } from "@/lib/logger"

export type RepScheme = "auto" | "reps" | "time"

export interface ApiMuscle {
  muscle: {
    name: string
  }
  isPrimary?: boolean
}

export interface ApiEquipment {
  equipment: {
    name: string
  }
}

export interface ApiExercise {
  id: string
  name: string
  instructions?: string
  description?: string
  muscles?: ApiMuscle[]
  equipments?: ApiEquipment[]
  source?: string
}

export interface DatabaseExercise {
  exerciseId: string
  name: string
  bodyParts: string[]
  targetMuscles: string[]
  secondaryMuscles: string[]
  equipments: string[]
  instructions: string[]
  bodyPart?: string
  target?: string
  equipment?: string
  gifUrl?: string
  source?: string
}

export interface ExerciseFilters {
  workoutType: string
  targetMuscles: string[]
  targetBodyParts: string[]
  equipment: string[]
  limit?: number
  search?: string
}

export const PINNED_EXERCISE_NAME = "Archer Push-ups"
export const PINNED_EXERCISE_ID = "pinned-archer-push-ups"

export const PINNED_EXERCISE_FALLBACK: DatabaseExercise = {
  exerciseId: PINNED_EXERCISE_ID,
  name: PINNED_EXERCISE_NAME,
  bodyParts: ["chest", "upper body"],
  targetMuscles: ["chest", "triceps"],
  secondaryMuscles: ["shoulders", "core"],
  equipments: ["bodyweight"],
  instructions: [
    "Start in a wide push-up position with one arm extended straight and the other hand under your shoulder.",
    "Lower your chest toward the floor, keeping the extended arm straight and bending the supporting arm.",
    "Push back up through the working arm while keeping core braced and hips square.",
  ],
  bodyPart: "chest",
  target: "chest",
  equipment: "bodyweight",
  gifUrl: "",
  source: "pinned",
}

export const normalizeComparisonValue = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")

export const normalizeEquipmentValue = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-")

export const mapApiExerciseToDatabase = (exercise: ApiExercise): DatabaseExercise => {
  const primaryMuscles = (exercise.muscles || []).filter(muscle => muscle.isPrimary)
  const secondaryMuscles = (exercise.muscles || []).filter(muscle => !muscle.isPrimary)
  const equipments = (exercise.equipments || [])
    .map(item => item.equipment?.name?.toLowerCase())
    .filter((name): name is string => Boolean(name) && name.trim().length > 0)

  return {
    exerciseId: exercise.id,
    name: exercise.name,
    bodyParts: (exercise.muscles || []).map(muscle => muscle.muscle?.name?.toLowerCase()).filter((name): name is string => Boolean(name)),
    targetMuscles: primaryMuscles
      .map(muscle => muscle.muscle?.name?.toLowerCase())
      .filter((name): name is string => Boolean(name)),
    secondaryMuscles: secondaryMuscles
      .map(muscle => muscle.muscle?.name?.toLowerCase())
      .filter((name): name is string => Boolean(name)),
    equipments: equipments.length > 0 ? equipments : ["bodyweight"],
    instructions: exercise.instructions
      ? [exercise.instructions]
      : exercise.description
        ? [exercise.description]
        : ["Focus on controlled reps and maintain good form."],
    bodyPart: exercise.muscles?.[0]?.muscle?.name?.toLowerCase(),
    target: primaryMuscles[0]?.muscle?.name?.toLowerCase(),
    equipment: equipments[0] ?? "bodyweight",
    gifUrl: "",
    source: exercise.source ?? "database",
  }
}

const workoutTypeMatchers: Record<string, (value: string) => boolean> = {
  strength: muscle => [
    "chest",
    "back",
    "shoulders",
    "arms",
    "biceps",
    "triceps",
    "legs",
    "quadriceps",
    "hamstrings",
    "glutes",
    "core",
    "abs",
  ].some(target => muscle.includes(target)),
  cardio: muscle => [
    "cardio",
    "legs",
    "core",
    "back",
    "chest",
    "shoulders",
    "full body",
  ].some(target => muscle.includes(target)),
  hiit: muscle => [
    "cardio",
    "full body",
    "legs",
    "core",
    "abs",
    "back",
    "chest",
  ].some(target => muscle.includes(target)),
  flexibility: muscle => [
    "core",
    "abs",
    "back",
    "legs",
    "shoulders",
    "hips",
  ].some(target => muscle.includes(target)),
}

const matchesWorkoutType = (exercise: DatabaseExercise, workoutType: string) => {
  const matcher = workoutTypeMatchers[workoutType]
  if (!matcher) return true
  const primaryMuscle = normalizeComparisonValue(exercise.targetMuscles[0] || exercise.bodyPart || exercise.target || "")
  const bodyPartValues = exercise.bodyParts.map(normalizeComparisonValue)
  if (primaryMuscle && matcher(primaryMuscle)) return true
  return bodyPartValues.some(matcher)
}

const matchesMuscleSelection = (exercise: DatabaseExercise, targetMuscles: string[]) => {
  if (targetMuscles.length === 0) return true
  const normalizedTargets = targetMuscles.map(normalizeComparisonValue)
  const primary = exercise.targetMuscles.map(normalizeComparisonValue)
  const secondary = exercise.secondaryMuscles.map(normalizeComparisonValue)
  const bodyParts = exercise.bodyParts.map(normalizeComparisonValue)
  const name = normalizeComparisonValue(exercise.name)

  return normalizedTargets.some(target => {
    if (primary.some(muscle => muscle.includes(target) || target.includes(muscle))) return true
    if (secondary.some(muscle => muscle.includes(target) || target.includes(muscle))) return true
    if (bodyParts.some(part => part.includes(target) || target.includes(part))) return true
    if (target === "back" && (name.includes("row") || name.includes("pull"))) return true
    if (target === "chest" && name.includes("press")) return true
    if (target === "legs" && (name.includes("squat") || name.includes("lunge"))) return true
    return false
  })
}

const matchesBodyPartSelection = (exercise: DatabaseExercise, targetBodyParts: string[]) => {
  if (targetBodyParts.length === 0) return true
  const normalizedTargets = targetBodyParts.map(normalizeComparisonValue)
  const bodyParts = exercise.bodyParts.map(normalizeComparisonValue)
  const name = normalizeComparisonValue(exercise.name)

  return normalizedTargets.some(target => {
    if (bodyParts.some(part => part.includes(target) || target.includes(part))) return true
    if (target.includes("upper") && (name.includes("press") || name.includes("pull") || name.includes("row"))) return true
    if (target.includes("lower") && (name.includes("squat") || name.includes("lunge") || name.includes("deadlift"))) return true
    if (target.includes("full") && name.includes("burpee")) return true
    return false
  })
}

const matchesEquipmentSelection = (exercise: DatabaseExercise, equipment: string[]) => {
  if (equipment.length === 0) return true
  const normalizedEquipment = equipment.map(normalizeEquipmentValue)
  const bodyweightAllowed = normalizedEquipment.includes("bodyweight")
  const exerciseEquipment = exercise.equipments.map(normalizeEquipmentValue)

  return exerciseEquipment.some(eq => {
    if (eq === "bodyweight") {
      return bodyweightAllowed
    }
    if (normalizedEquipment.includes(eq)) {
      return true
    }

    return normalizedEquipment.some(target => (
      (target.includes("dumbbell") && eq.includes("dumbbell")) ||
      (target.includes("barbell") && eq.includes("barbell")) ||
      (target.includes("kettlebell") && eq.includes("kettlebell")) ||
      (target.includes("resistance") && eq.includes("band")) ||
      (target.includes("band") && eq.includes("resistance")) ||
      (target.includes("pull") && eq.includes("bar")) ||
      (target.includes("cable") && eq.includes("machine")) ||
      (target.includes("bench") && eq.includes("bench"))
    ))
  })
}

export const filterExercises = (exercises: DatabaseExercise[], filters: ExerciseFilters) => {
  const { workoutType, targetMuscles, targetBodyParts, equipment } = filters
  return exercises.filter(exercise =>
    matchesWorkoutType(exercise, workoutType) &&
    matchesMuscleSelection(exercise, targetMuscles) &&
    matchesBodyPartSelection(exercise, targetBodyParts) &&
    matchesEquipmentSelection(exercise, equipment)
  )
}

export const loadExerciseDatabase = async (filters: ExerciseFilters): Promise<DatabaseExercise[]> => {
  try {
    const params = new URLSearchParams()
    params.append("limit", String(filters.limit ?? Math.max(100, filters.targetMuscles.length * 10 || 100)))
    if (filters.search) {
      params.append("search", filters.search)
    }

    const url = `/api/workout-tracker/exercises?${params.toString()}`
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Failed to fetch exercises: ${response.status}`)
    }

    const data = await response.json()
    const allExercises: ApiExercise[] = [
      ...(data.userExercises || []),
      ...(data.predefinedExercises || []),
    ]

    const mapped = allExercises.map(mapApiExerciseToDatabase)
    return filterExercises(mapped, filters)
  } catch (error) {
    logger.error("Failed to load exercise database", error)
    return []
  }
}
