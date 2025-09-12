/* eslint-disable @typescript-eslint/no-unused-vars */
import { PrismaClient } from "@prisma/client"
import fs from "fs"
import path from "path"

const prisma = new PrismaClient()

// Resolve data file paths relative to this file (ESM-safe)
const exercisesDataPath = new URL("../data/all-exercises.json", import.meta.url)
const metadataPath = new URL("../data/exercisedb-metadata.json", import.meta.url)

const exercisesData = JSON.parse(fs.readFileSync(exercisesDataPath, "utf-8"))
const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf-8"))

const exercises = exercisesData.exercises || []

// Allow overriding the quick-skip check with --force or FORCE_SEED=1
const force = process.argv.includes("--force") || process.env.FORCE_SEED === "1"

// A small set of representative exercise names to check for existing data.
// If at least `seedSkipThreshold` are found we skip the heavy exercise seeding by default.
const seedCheckExercises = [
  "dumbbell bench press",
  "dumbbell bent over row",
  "dumbbell goblet squat",
  "barbell romanian deadlift",
  "burpee",
  "wide hand push up",
  "dumbbell standing overhead press",
]
const seedSkipThreshold = 5

const workoutTemplates = [
  {
    name: "Upper Body Strength",
    description: "Focus on chest, shoulders, and arms",
    estimatedDuration: 45,
    category: "upper-body",
    difficulty: "intermediate",
    isPredefined: true,
    exercises: [
      { exerciseName: "dumbbell bench press", targetSets: 4, targetReps: "8-12", restTime: 90 },
      { exerciseName: "dumbbell bent over row", targetSets: 4, targetReps: "10-12", restTime: 90 },
      { exerciseName: "dumbbell standing overhead press", targetSets: 3, targetReps: "8-10", restTime: 90 },
      { exerciseName: "dumbbell seated bicep curl", targetSets: 3, targetReps: "12-15", restTime: 60 },
    ],
  },
  {
    name: "Lower Body Power",
    description: "Legs, glutes, and core strength",
    estimatedDuration: 50,
    category: "lower-body",
    difficulty: "intermediate",
    isPredefined: true,
    exercises: [
      { exerciseName: "dumbbell goblet squat", targetSets: 4, targetReps: "12-15", restTime: 90 },
      { exerciseName: "barbell romanian deadlift", targetSets: 4, targetReps: "10-12", restTime: 90 },
      { exerciseName: "dumbbell single leg split squat", targetSets: 3, targetReps: "10-12", restTime: 90 },
      { exerciseName: "bodyweight standing calf raise", targetSets: 3, targetReps: "15-20", restTime: 60 },
    ],
  },
  {
    name: "Full Body Circuit",
    description: "Complete body workout in minimal time",
    estimatedDuration: 35,
    category: "full-body",
    difficulty: "intermediate",
    isPredefined: true,
    exercises: [
      { exerciseName: "burpee", targetSets: 3, targetReps: "8-10", restTime: 60 },
      { exerciseName: "mountain climber", targetSets: 3, targetReps: "20-30", restTime: 60 },
      { exerciseName: "barbell thruster", targetSets: 3, targetReps: "10-12", restTime: 60 },
      { exerciseName: "weighted front plank", targetSets: 3, targetReps: "30-60", restTime: 60 },
    ],
  },
  {
    name: "Beginner Full Body",
    description: "Perfect for beginners starting their fitness journey",
    estimatedDuration: 30,
    category: "full-body",
    difficulty: "beginner",
    isPredefined: true,
    exercises: [
      { exerciseName: "wide hand push up", targetSets: 3, targetReps: "8-12", restTime: 60 },
      { exerciseName: "dumbbell goblet squat", targetSets: 3, targetReps: "10-15", restTime: 60 },
      { exerciseName: "dumbbell bent over row", targetSets: 3, targetReps: "10-12", restTime: 60 },
      { exerciseName: "weighted front plank", targetSets: 3, targetReps: "20-30", restTime: 45 },
    ],
  },
]

const foods = [
  { name: "Chicken Breast", brand: null, calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, sugar: 0, sodium: 74, servingSize: 100, servingUnit: "g", category: "protein", verified: true },
  { name: "Salmon", brand: null, calories: 208, protein: 20, carbs: 0, fat: 13, fiber: 0, sugar: 0, sodium: 59, servingSize: 100, servingUnit: "g", category: "protein", verified: true },
  { name: "Greek Yogurt", brand: null, calories: 59, protein: 10, carbs: 3.6, fat: 0.4, fiber: 0, sugar: 3.6, sodium: 36, servingSize: 100, servingUnit: "g", category: "dairy", verified: true },
  { name: "Eggs", brand: null, calories: 155, protein: 13, carbs: 1.1, fat: 11, fiber: 0, sugar: 0.6, sodium: 124, servingSize: 100, servingUnit: "g", category: "protein", verified: true },
  { name: "Tuna", brand: null, calories: 128, protein: 29, carbs: 0, fat: 1.3, fiber: 0, sugar: 0, sodium: 50, servingSize: 100, servingUnit: "g", category: "protein", verified: true },
  { name: "Broccoli", brand: null, calories: 34, protein: 2.8, carbs: 7, fat: 0.4, fiber: 2.6, sugar: 1.7, sodium: 33, servingSize: 100, servingUnit: "g", category: "vegetable", verified: true },
  { name: "Spinach", brand: null, calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2, sugar: 0.4, sodium: 79, servingSize: 100, servingUnit: "g", category: "vegetable", verified: true },
  { name: "Sweet Potato", brand: null, calories: 86, protein: 1.6, carbs: 20, fat: 0.1, fiber: 3, sugar: 4.2, sodium: 55, servingSize: 100, servingUnit: "g", category: "vegetable", verified: true },
  { name: "Carrots", brand: null, calories: 41, protein: 0.9, carbs: 10, fat: 0.2, fiber: 2.8, sugar: 4.9, sodium: 69, servingSize: 100, servingUnit: "g", category: "vegetable", verified: true },
  { name: "Banana", brand: null, calories: 89, protein: 1.1, carbs: 23, fat: 0.3, fiber: 2.6, sugar: 12, sodium: 1, servingSize: 118, servingUnit: "g", category: "fruit", verified: true },
  { name: "Apple", brand: null, calories: 52, protein: 0.3, carbs: 14, fat: 0.2, fiber: 2.4, sugar: 10, sodium: 1, servingSize: 182, servingUnit: "g", category: "fruit", verified: true },
  { name: "Strawberries", brand: null, calories: 32, protein: 0.7, carbs: 7.7, fat: 0.3, fiber: 2, sugar: 4.9, sodium: 1, servingSize: 100, servingUnit: "g", category: "fruit", verified: true },
  { name: "Brown Rice", brand: null, calories: 111, protein: 2.6, carbs: 23, fat: 0.9, fiber: 1.8, sugar: 0.4, sodium: 10, servingSize: 100, servingUnit: "g", category: "grain", verified: true },
  { name: "Oats", brand: null, calories: 379, protein: 13, carbs: 67, fat: 6.9, fiber: 10, sugar: 1, sodium: 2, servingSize: 100, servingUnit: "g", category: "grain", verified: true },
  { name: "Quinoa", brand: null, calories: 120, protein: 4.4, carbs: 21, fat: 1.9, fiber: 2.8, sugar: 0.9, sodium: 13, servingSize: 100, servingUnit: "g", category: "grain", verified: true },
  { name: "Almonds", brand: null, calories: 579, protein: 21, carbs: 22, fat: 50, fiber: 12, sugar: 4.2, sodium: 1, servingSize: 100, servingUnit: "g", category: "nuts", verified: true },
  { name: "Peanut Butter", brand: null, calories: 588, protein: 25, carbs: 20, fat: 50, fiber: 6, sugar: 9, sodium: 17, servingSize: 100, servingUnit: "g", category: "nuts", verified: true },
  { name: "Chia Seeds", brand: null, calories: 486, protein: 17, carbs: 42, fat: 31, fiber: 34, sugar: 0, sodium: 16, servingSize: 100, servingUnit: "g", category: "seeds", verified: true },
]

async function main() {
  console.log("Seeding body parts...")

  for (const name of metadata.bodyParts || []) {
    try {
      await prisma.bodyPart.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    } catch (e) {
      console.log(`Body part ${name} already exists or error, skipping...`)
    }
  }

  console.log("Seeding equipment...")

  for (const name of metadata.equipment || []) {
    try {
      await prisma.equipment.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    } catch (e) {
      console.log(`Equipment ${name} already exists or error, skipping...`)
    }
  }

  console.log("Seeding muscles...")

  for (const name of metadata.muscles || []) {
    try {
      await prisma.muscle.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    } catch (e) {
      console.log(`Muscle ${name} already exists or error, skipping...`)
    }
  }

  console.log("Seeding exercises...")

  // Quick existence check: if several representative exercises already exist,
  // skip the potentially long exercise import unless the user passed --force.
  let skipExercises = false
  if (!force) {
    try {
      const foundCount = await prisma.exercise.count({
        where: { name: { in: seedCheckExercises }, isPredefined: true },
      })
      if (foundCount >= seedSkipThreshold) {
        console.log(`Found ${foundCount} of ${seedCheckExercises.length} reference exercises; skipping exercise seeding. Use --force to override.`)
        skipExercises = true
      } else {
        console.log(`Found ${foundCount} of ${seedCheckExercises.length} reference exercises; will proceed with exercise seeding.`)
      }
    } catch (err) {
      console.log("Exercise existence check failed, proceeding with seeding.")
    }
  } else {
    console.log("Force flag detected: seeding exercises regardless of existing data")
  }

  if (!skipExercises) {

  for (const exercise of exercises) {
    try {
      const instructions = exercise.instructions ? exercise.instructions.join('\n') : null
      const description = exercise.bodyPart ? `Targets ${exercise.bodyPart}` : null

      await prisma.exercise.create({
        data: {
          name: exercise.name,
          description,
          instructions,
          isPublic: true,
          isPredefined: true,
          bodyParts: {
            create: (exercise.bodyParts || []).map((bp) => ({
              bodyPart: {
                connectOrCreate: {
                  where: { name: bp },
                  create: { name: bp },
                },
              },
            })),
          },
          equipments: {
            create: (exercise.equipments || []).map((eq) => ({
              equipment: {
                connectOrCreate: {
                  where: { name: eq },
                  create: { name: eq },
                },
              },
            })),
          },
          muscles: {
            create: [
              ...(exercise.targetMuscles || []).map((muscle) => ({
                muscle: {
                  connectOrCreate: {
                    where: { name: muscle },
                    create: { name: muscle },
                  },
                },
                isPrimary: true,
              })),
              ...(exercise.secondaryMuscles || []).map((muscle) => ({
                muscle: {
                  connectOrCreate: {
                    where: { name: muscle },
                    create: { name: muscle },
                  },
                },
                isPrimary: false,
              })),
            ],
          },
        },
      })
    } catch (e) {
      console.log(`Exercise ${exercise.name} already exists or error, skipping...`)
    }
  }

  }

  console.log("Seeding workout templates...")

  for (const template of workoutTemplates) {
    try {
      // Check if workout template already exists
      const existingTemplate = await prisma.workoutTemplate.findFirst({
        where: {
          name: template.name,
          isPredefined: true
        },
        include: {
          exercises: {
            include: {
              exercise: true
            }
          }
        }
      })

      if (existingTemplate) {
        console.log(`Workout template "${template.name}" already exists, skipping...`)
        continue
      }

      // Get exercise IDs for the template
      const exercisePromises = template.exercises.map(async (ex) => {
        const exercise = await prisma.exercise.findFirst({
          where: { name: ex.exerciseName, isPredefined: true },
        })
        return exercise ? { ...ex, exerciseId: exercise.id } : null
      })

      const exercisesWithIds = (await Promise.all(exercisePromises)).filter(Boolean)

      if (exercisesWithIds.length > 0) {
        await prisma.workoutTemplate.create({
          data: {
            name: template.name,
            description: template.description,
            estimatedDuration: template.estimatedDuration,
            category: template.category,
            difficulty: template.difficulty,
            isPredefined: template.isPredefined,
            exercises: {
              create: exercisesWithIds.map((ex, index) => ({
                exerciseId: ex.exerciseId,
                order: index,
                targetSets: ex.targetSets,
                targetReps: ex.targetReps,
                restTime: ex.restTime,
              })),
            },
          },
        })
        console.log(`Created workout template: ${template.name}`)
      } else {
        console.log(`Skipping workout template "${template.name}" - no valid exercises found`)
      }
    } catch (e) {
      console.log(`Error processing workout template ${template.name}:`, e.message)
    }
  }

  console.log("Seeding foods...")

  for (const food of foods) {
    try {
      await prisma.food.create({
        data: {
          ...food,
          userId: null,
        },
      })
    } catch (e) {
      console.log(`Food ${food.name} already exists, skipping...`)
    }
  }

  console.log("Seeding completed successfully!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
