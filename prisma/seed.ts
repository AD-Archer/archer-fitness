import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const exercises = [
  // Chest exercises
  { name: "Dumbbell Bench Press", category: "chest", muscleGroup: "chest", equipment: "dumbbells", instructions: "Lower weights to chest, press up explosively", isPredefined: true },
  { name: "Push-ups", category: "chest", muscleGroup: "chest", equipment: "bodyweight", instructions: "Lower chest to ground, push back up", isPredefined: true },
  { name: "Incline Dumbbell Press", category: "chest", muscleGroup: "chest", equipment: "dumbbells", instructions: "Press weights up at an incline", isPredefined: true },

  // Back exercises
  { name: "Bent-over Rows", category: "back", muscleGroup: "back", equipment: "dumbbells", instructions: "Hinge at hips, pull weights to lower chest", isPredefined: true },
  { name: "Pull-ups", category: "back", muscleGroup: "back", equipment: "bodyweight", instructions: "Hang from bar, pull body up", isPredefined: true },
  { name: "Lat Pulldowns", category: "back", muscleGroup: "back", equipment: "machine", instructions: "Pull bar down to chest", isPredefined: true },

  // Legs exercises
  { name: "Goblet Squats", category: "legs", muscleGroup: "quadriceps", equipment: "dumbbells", instructions: "Hold dumbbell at chest, squat down keeping chest up", isPredefined: true },
  { name: "Romanian Deadlifts", category: "legs", muscleGroup: "hamstrings", equipment: "dumbbells", instructions: "Hinge at hips, lower weights while keeping back straight", isPredefined: true },
  { name: "Bulgarian Split Squats", category: "legs", muscleGroup: "quadriceps", equipment: "dumbbells", instructions: "Rear foot elevated, lunge down on front leg", isPredefined: true },
  { name: "Calf Raises", category: "legs", muscleGroup: "calves", equipment: "bodyweight", instructions: "Rise up on toes, squeeze calves at the top", isPredefined: true },

  // Shoulders exercises
  { name: "Overhead Press", category: "shoulders", muscleGroup: "shoulders", equipment: "dumbbells", instructions: "Press weights overhead, keep core tight", isPredefined: true },
  { name: "Lateral Raises", category: "shoulders", muscleGroup: "shoulders", equipment: "dumbbells", instructions: "Raise arms out to sides to shoulder height", isPredefined: true },

  // Arms exercises
  { name: "Bicep Curls", category: "arms", muscleGroup: "biceps", equipment: "dumbbells", instructions: "Curl weights up, control the descent", isPredefined: true },
  { name: "Tricep Extensions", category: "arms", muscleGroup: "triceps", equipment: "dumbbells", instructions: "Extend arms overhead, lower behind head", isPredefined: true },

  // Core exercises
  { name: "Plank", category: "core", muscleGroup: "core", equipment: "bodyweight", instructions: "Hold plank position, keep core tight and body straight", isPredefined: true },
  { name: "Mountain Climbers", category: "core", muscleGroup: "core", equipment: "bodyweight", instructions: "Plank position, alternate bringing knees to chest", isPredefined: true },
  { name: "Russian Twists", category: "core", muscleGroup: "core", equipment: "bodyweight", instructions: "Sit with knees bent, twist torso side to side", isPredefined: true },

  // Full body exercises
  { name: "Burpees", category: "full-body", muscleGroup: "full-body", equipment: "bodyweight", instructions: "Drop down, jump back, push-up, jump forward, jump up", isPredefined: true },
  { name: "Dumbbell Thrusters", category: "full-body", muscleGroup: "full-body", equipment: "dumbbells", instructions: "Squat with weights at shoulders, stand and press overhead", isPredefined: true },
  { name: "Kettlebell Swings", category: "full-body", muscleGroup: "full-body", equipment: "kettlebell", instructions: "Swing kettlebell from between knees to chest height", isPredefined: true },
]

const workoutTemplates = [
  {
    name: "Upper Body Strength",
    description: "Focus on chest, shoulders, and arms",
    estimatedDuration: 45,
    category: "upper-body",
    difficulty: "intermediate",
    isPredefined: true,
    exercises: [
      { exerciseName: "Dumbbell Bench Press", targetSets: 4, targetReps: "8-12", restTime: 90 },
      { exerciseName: "Bent-over Rows", targetSets: 4, targetReps: "10-12", restTime: 90 },
      { exerciseName: "Overhead Press", targetSets: 3, targetReps: "8-10", restTime: 90 },
      { exerciseName: "Bicep Curls", targetSets: 3, targetReps: "12-15", restTime: 60 },
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
      { exerciseName: "Goblet Squats", targetSets: 4, targetReps: "12-15", restTime: 90 },
      { exerciseName: "Romanian Deadlifts", targetSets: 4, targetReps: "10-12", restTime: 90 },
      { exerciseName: "Bulgarian Split Squats", targetSets: 3, targetReps: "10-12", restTime: 90 },
      { exerciseName: "Calf Raises", targetSets: 3, targetReps: "15-20", restTime: 60 },
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
      { exerciseName: "Burpees", targetSets: 3, targetReps: "8-10", restTime: 60 },
      { exerciseName: "Mountain Climbers", targetSets: 3, targetReps: "20-30", restTime: 60 },
      { exerciseName: "Dumbbell Thrusters", targetSets: 3, targetReps: "10-12", restTime: 60 },
      { exerciseName: "Plank", targetSets: 3, targetReps: "30-60", restTime: 60 },
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
      { exerciseName: "Push-ups", targetSets: 3, targetReps: "8-12", restTime: 60 },
      { exerciseName: "Goblet Squats", targetSets: 3, targetReps: "10-15", restTime: 60 },
      { exerciseName: "Bent-over Rows", targetSets: 3, targetReps: "10-12", restTime: 60 },
      { exerciseName: "Plank", targetSets: 3, targetReps: "20-30", restTime: 45 },
    ],
  },
]

const foods = [
  // Proteins
  { name: "Chicken Breast", brand: null, calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, sugar: 0, sodium: 74, servingSize: 100, servingUnit: "g", category: "protein", verified: true },
  { name: "Salmon", brand: null, calories: 208, protein: 20, carbs: 0, fat: 13, fiber: 0, sugar: 0, sodium: 59, servingSize: 100, servingUnit: "g", category: "protein", verified: true },
  { name: "Greek Yogurt", brand: null, calories: 59, protein: 10, carbs: 3.6, fat: 0.4, fiber: 0, sugar: 3.6, sodium: 36, servingSize: 100, servingUnit: "g", category: "dairy", verified: true },
  { name: "Eggs", brand: null, calories: 155, protein: 13, carbs: 1.1, fat: 11, fiber: 0, sugar: 0.6, sodium: 124, servingSize: 100, servingUnit: "g", category: "protein", verified: true },
  { name: "Tuna", brand: null, calories: 128, protein: 29, carbs: 0, fat: 1.3, fiber: 0, sugar: 0, sodium: 50, servingSize: 100, servingUnit: "g", category: "protein", verified: true },

  // Vegetables
  { name: "Broccoli", brand: null, calories: 34, protein: 2.8, carbs: 7, fat: 0.4, fiber: 2.6, sugar: 1.7, sodium: 33, servingSize: 100, servingUnit: "g", category: "vegetable", verified: true },
  { name: "Spinach", brand: null, calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2, sugar: 0.4, sodium: 79, servingSize: 100, servingUnit: "g", category: "vegetable", verified: true },
  { name: "Sweet Potato", brand: null, calories: 86, protein: 1.6, carbs: 20, fat: 0.1, fiber: 3, sugar: 4.2, sodium: 55, servingSize: 100, servingUnit: "g", category: "vegetable", verified: true },
  { name: "Carrots", brand: null, calories: 41, protein: 0.9, carbs: 10, fat: 0.2, fiber: 2.8, sugar: 4.9, sodium: 69, servingSize: 100, servingUnit: "g", category: "vegetable", verified: true },

  // Fruits
  { name: "Banana", brand: null, calories: 89, protein: 1.1, carbs: 23, fat: 0.3, fiber: 2.6, sugar: 12, sodium: 1, servingSize: 118, servingUnit: "g", category: "fruit", verified: true },
  { name: "Apple", brand: null, calories: 52, protein: 0.3, carbs: 14, fat: 0.2, fiber: 2.4, sugar: 10, sodium: 1, servingSize: 182, servingUnit: "g", category: "fruit", verified: true },
  { name: "Strawberries", brand: null, calories: 32, protein: 0.7, carbs: 7.7, fat: 0.3, fiber: 2, sugar: 4.9, sodium: 1, servingSize: 100, servingUnit: "g", category: "fruit", verified: true },

  // Grains
  { name: "Brown Rice", brand: null, calories: 111, protein: 2.6, carbs: 23, fat: 0.9, fiber: 1.8, sugar: 0.4, sodium: 10, servingSize: 100, servingUnit: "g", category: "grain", verified: true },
  { name: "Oats", brand: null, calories: 379, protein: 13, carbs: 67, fat: 6.9, fiber: 10, sugar: 1, sodium: 2, servingSize: 100, servingUnit: "g", category: "grain", verified: true },
  { name: "Quinoa", brand: null, calories: 120, protein: 4.4, carbs: 21, fat: 1.9, fiber: 2.8, sugar: 0.9, sodium: 13, servingSize: 100, servingUnit: "g", category: "grain", verified: true },

  // Nuts & Seeds
  { name: "Almonds", brand: null, calories: 579, protein: 21, carbs: 22, fat: 50, fiber: 12, sugar: 4.2, sodium: 1, servingSize: 100, servingUnit: "g", category: "nuts", verified: true },
  { name: "Peanut Butter", brand: null, calories: 588, protein: 25, carbs: 20, fat: 50, fiber: 6, sugar: 9, sodium: 17, servingSize: 100, servingUnit: "g", category: "nuts", verified: true },
  { name: "Chia Seeds", brand: null, calories: 486, protein: 17, carbs: 42, fat: 31, fiber: 34, sugar: 0, sodium: 16, servingSize: 100, servingUnit: "g", category: "seeds", verified: true },
]

async function main() {
  console.log("Seeding exercises...")

  for (const exercise of exercises) {
    try {
      await prisma.exercise.create({
        data: exercise,
      })
    } catch (error: any) {
      // Skip if exercise already exists
      console.log(`Exercise ${exercise.name} already exists, skipping...`)
    }
  }

  console.log("Seeding workout templates...")

  for (const template of workoutTemplates) {
    // First, find the exercises by name
    const exercisePromises = template.exercises.map(async (ex) => {
      const exercise = await prisma.exercise.findFirst({
        where: { name: ex.exerciseName, isPredefined: true },
      })
      return exercise ? { ...ex, exerciseId: exercise.id } : null
    })

    const exercisesWithIds = (await Promise.all(exercisePromises)).filter(Boolean)

    if (exercisesWithIds.length > 0) {
      try {
        await prisma.workoutTemplate.create({
          data: {
            ...template,
            exercises: {
              create: exercisesWithIds.map((ex, index) => ({
                exerciseId: ex!.exerciseId,
                order: index,
                targetSets: ex!.targetSets,
                targetReps: ex!.targetReps,
                restTime: ex!.restTime,
              })),
            },
          },
        })
      } catch (error: any) {
        console.log(`Workout template ${template.name} already exists, skipping...`)
      }
    }
  }

  console.log("Seeding foods...")

  for (const food of foods) {
    try {
      await prisma.food.create({
        data: {
          ...food,
          userId: null, // Global foods
        },
      })
    } catch (error: any) {
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
