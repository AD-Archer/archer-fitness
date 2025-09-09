export interface UserProfile {
  id: string
  name: string
  email: string
  age: number
  height: number // cm
  weight: number // kg
  activityLevel: "sedentary" | "lightly_active" | "moderately_active" | "very_active" | "extremely_active"
  fitnessGoal: "weight_loss" | "muscle_gain" | "maintenance" | "endurance" | "strength"
  createdAt: Date
  updatedAt: Date
}

export interface WorkoutExercise {
  id: string
  name: string
  sets: number
  reps: string
  weight?: number
  duration?: number
  restTime: number
  instructions: string
  muscleGroups: string[]
  equipment: string[]
}

export interface WorkoutTemplate {
  id: string
  name: string
  description: string
  difficulty: "beginner" | "intermediate" | "advanced"
  duration: number
  exercises: WorkoutExercise[]
  muscleGroups: string[]
  equipment: string[]
}

export interface WorkoutSession {
  id: string
  templateId: string
  name: string
  date: Date
  duration: number
  exercises: Array<{
    exerciseId: string
    sets: Array<{
      reps: number
      weight?: number
      completed: boolean
    }>
  }>
  status: "completed" | "in_progress" | "skipped"
  notes?: string
}

export interface FoodItem {
  id: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
  sugar?: number
  sodium?: number
  serving: string
  category: "protein" | "carbs" | "vegetables" | "fruits" | "dairy" | "fats" | "snacks"
}

export interface LoggedFood {
  id: string
  foodId: string
  quantity: number
  meal: "breakfast" | "lunch" | "dinner" | "snack"
  date: Date
}

export interface WaterEntry {
  id: string
  amount: number
  date: Date
}

export interface RecoveryMetrics {
  id: string
  date: Date
  sleepHours: number
  sleepQuality: number
  energyLevel: number
  muscleRecovery: number
  stressLevel: number
  hydration: number
  mood: number
}

export interface NutritionGoals {
  dailyCalories: number
  dailyWater: number
  protein: number
  carbs: number
  fat: number
  fiber: number
}

export interface UserSettings {
  theme: "light" | "dark" | "system"
  units: "metric" | "imperial"
  notifications: {
    workoutReminders: boolean
    mealReminders: boolean
    waterReminders: boolean
    recoveryReminders: boolean
  }
  privacy: {
    shareProgress: boolean
    publicProfile: boolean
  }
}

// Mock Data Store
class DataStore {
  private static instance: DataStore

  // User Data
  public userProfile: UserProfile = {
    id: "1",
    name: "Alex Johnson",
    email: "alex@example.com",
    age: 28,
    height: 175,
    weight: 70,
    activityLevel: "moderately_active",
    fitnessGoal: "muscle_gain",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date(),
  }

  public userSettings: UserSettings = {
    theme: "system",
    units: "metric",
    notifications: {
      workoutReminders: true,
      mealReminders: true,
      waterReminders: true,
      recoveryReminders: false,
    },
    privacy: {
      shareProgress: false,
      publicProfile: false,
    },
  }

  // Workout Data
  public workoutTemplates: WorkoutTemplate[] = [
    {
      id: "upper-body-1",
      name: "Upper Body Strength",
      description: "Focus on chest, back, shoulders, and arms",
      difficulty: "intermediate",
      duration: 45,
      muscleGroups: ["chest", "back", "shoulders", "arms"],
      equipment: ["dumbbells", "barbell", "bench"],
      exercises: [
        {
          id: "bench-press",
          name: "Bench Press",
          sets: 4,
          reps: "8-10",
          restTime: 90,
          instructions: "Lie on bench, grip bar slightly wider than shoulders, lower to chest, press up",
          muscleGroups: ["chest", "triceps", "shoulders"],
          equipment: ["barbell", "bench"],
        },
        {
          id: "bent-over-row",
          name: "Bent Over Row",
          sets: 4,
          reps: "8-10",
          restTime: 90,
          instructions: "Hinge at hips, pull bar to lower chest, squeeze shoulder blades",
          muscleGroups: ["back", "biceps"],
          equipment: ["barbell"],
        },
        {
          id: "shoulder-press",
          name: "Overhead Press",
          sets: 3,
          reps: "10-12",
          restTime: 60,
          instructions: "Press dumbbells overhead, keep core tight",
          muscleGroups: ["shoulders", "triceps"],
          equipment: ["dumbbells"],
        },
        {
          id: "bicep-curls",
          name: "Bicep Curls",
          sets: 3,
          reps: "12-15",
          restTime: 45,
          instructions: "Curl dumbbells with controlled motion, squeeze at top",
          muscleGroups: ["biceps"],
          equipment: ["dumbbells"],
        },
      ],
    },
    {
      id: "lower-body-1",
      name: "Lower Body Power",
      description: "Legs, glutes, and core strengthening",
      difficulty: "intermediate",
      duration: 50,
      muscleGroups: ["legs", "glutes", "core"],
      equipment: ["barbell", "dumbbells"],
      exercises: [
        {
          id: "squats",
          name: "Barbell Squats",
          sets: 4,
          reps: "8-10",
          restTime: 120,
          instructions: "Feet shoulder-width apart, squat down keeping chest up, drive through heels",
          muscleGroups: ["quads", "glutes", "core"],
          equipment: ["barbell"],
        },
        {
          id: "deadlifts",
          name: "Romanian Deadlifts",
          sets: 4,
          reps: "8-10",
          restTime: 120,
          instructions: "Hinge at hips, lower bar along legs, drive hips forward",
          muscleGroups: ["hamstrings", "glutes", "back"],
          equipment: ["barbell"],
        },
        {
          id: "lunges",
          name: "Walking Lunges",
          sets: 3,
          reps: "12 each leg",
          restTime: 60,
          instructions: "Step forward into lunge, push off front foot to next lunge",
          muscleGroups: ["quads", "glutes", "calves"],
          equipment: ["dumbbells"],
        },
        {
          id: "calf-raises",
          name: "Calf Raises",
          sets: 3,
          reps: "15-20",
          restTime: 45,
          instructions: "Rise up on toes, hold briefly, lower slowly",
          muscleGroups: ["calves"],
          equipment: ["dumbbells"],
        },
      ],
    },
    {
      id: "full-body-1",
      name: "Full Body Circuit",
      description: "Complete body workout with compound movements",
      difficulty: "beginner",
      duration: 40,
      muscleGroups: ["full-body"],
      equipment: ["dumbbells", "bodyweight"],
      exercises: [
        {
          id: "burpees",
          name: "Burpees",
          sets: 3,
          reps: "10",
          restTime: 60,
          instructions: "Squat down, jump back to plank, push-up, jump forward, jump up",
          muscleGroups: ["full-body"],
          equipment: ["bodyweight"],
        },
        {
          id: "dumbbell-thrusters",
          name: "Dumbbell Thrusters",
          sets: 3,
          reps: "12",
          restTime: 60,
          instructions: "Squat with dumbbells at shoulders, stand and press overhead",
          muscleGroups: ["legs", "shoulders", "core"],
          equipment: ["dumbbells"],
        },
        {
          id: "mountain-climbers",
          name: "Mountain Climbers",
          sets: 3,
          reps: "20",
          restTime: 45,
          instructions: "Plank position, alternate bringing knees to chest rapidly",
          muscleGroups: ["core", "cardio"],
          equipment: ["bodyweight"],
        },
        {
          id: "plank",
          name: "Plank Hold",
          sets: 3,
          reps: "30-60 seconds",
          restTime: 45,
          instructions: "Hold plank position, keep body straight, engage core",
          muscleGroups: ["core"],
          equipment: ["bodyweight"],
        },
      ],
    },
  ]

  public workoutHistory: WorkoutSession[] = [
    {
      id: "session-1",
      templateId: "upper-body-1",
      name: "Upper Body Strength",
      date: new Date(),
      duration: 45,
      status: "completed",
      exercises: [
        {
          exerciseId: "bench-press",
          sets: [
            { reps: 10, weight: 60, completed: true },
            { reps: 8, weight: 65, completed: true },
            { reps: 8, weight: 65, completed: true },
            { reps: 6, weight: 70, completed: true },
          ],
        },
      ],
    },
    {
      id: "session-2",
      templateId: "lower-body-1",
      name: "Lower Body Power",
      date: new Date(Date.now() - 86400000),
      duration: 50,
      status: "completed",
      exercises: [],
    },
  ]

  // Nutrition Data
  public foodDatabase: FoodItem[] = [
    {
      id: "1",
      name: "Chicken Breast",
      calories: 165,
      protein: 31,
      carbs: 0,
      fat: 3.6,
      fiber: 0,
      serving: "100g",
      category: "protein",
    },
    {
      id: "2",
      name: "Brown Rice",
      calories: 111,
      protein: 2.6,
      carbs: 23,
      fat: 0.9,
      fiber: 1.8,
      serving: "100g",
      category: "carbs",
    },
    {
      id: "3",
      name: "Broccoli",
      calories: 34,
      protein: 2.8,
      carbs: 7,
      fat: 0.4,
      fiber: 2.6,
      serving: "100g",
      category: "vegetables",
    },
    {
      id: "4",
      name: "Banana",
      calories: 89,
      protein: 1.1,
      carbs: 23,
      fat: 0.3,
      fiber: 2.6,
      serving: "1 medium",
      category: "fruits",
    },
    {
      id: "5",
      name: "Greek Yogurt",
      calories: 59,
      protein: 10,
      carbs: 3.6,
      fat: 0.4,
      fiber: 0,
      serving: "100g",
      category: "dairy",
    },
    {
      id: "6",
      name: "Almonds",
      calories: 579,
      protein: 21,
      carbs: 22,
      fat: 50,
      fiber: 12,
      serving: "100g",
      category: "fats",
    },
    {
      id: "7",
      name: "Salmon",
      calories: 208,
      protein: 20,
      carbs: 0,
      fat: 13,
      fiber: 0,
      serving: "100g",
      category: "protein",
    },
    {
      id: "8",
      name: "Sweet Potato",
      calories: 86,
      protein: 1.6,
      carbs: 20,
      fat: 0.1,
      fiber: 3,
      serving: "100g",
      category: "carbs",
    },
    {
      id: "9",
      name: "Eggs",
      calories: 155,
      protein: 13,
      carbs: 1.1,
      fat: 11,
      fiber: 0,
      serving: "2 large",
      category: "protein",
    },
    {
      id: "10",
      name: "Avocado",
      calories: 160,
      protein: 2,
      carbs: 9,
      fat: 15,
      fiber: 7,
      serving: "1/2 medium",
      category: "fats",
    },
  ]

  public loggedFoods: LoggedFood[] = [
    { id: "1", foodId: "1", quantity: 1.5, meal: "lunch", date: new Date() },
    { id: "2", foodId: "2", quantity: 0.8, meal: "lunch", date: new Date() },
    { id: "3", foodId: "5", quantity: 1, meal: "breakfast", date: new Date() },
    { id: "4", foodId: "4", quantity: 1, meal: "breakfast", date: new Date() },
  ]

  public waterEntries: WaterEntry[] = [
    { id: "1", amount: 500, date: new Date() },
    { id: "2", amount: 250, date: new Date() },
    { id: "3", amount: 750, date: new Date() },
  ]

  // Recovery Data
  public recoveryHistory: RecoveryMetrics[] = [
    {
      id: "1",
      date: new Date(),
      sleepHours: 7.5,
      sleepQuality: 8,
      energyLevel: 7,
      muscleRecovery: 6,
      stressLevel: 4,
      hydration: 8,
      mood: 7,
    },
    {
      id: "2",
      date: new Date(Date.now() - 86400000),
      sleepHours: 6.5,
      sleepQuality: 6,
      energyLevel: 6,
      muscleRecovery: 5,
      stressLevel: 6,
      hydration: 7,
      mood: 6,
    },
    {
      id: "3",
      date: new Date(Date.now() - 172800000),
      sleepHours: 8,
      sleepQuality: 9,
      energyLevel: 9,
      muscleRecovery: 8,
      stressLevel: 2,
      hydration: 9,
      mood: 8,
    },
  ]

  // Progress Data
  public progressData = {
    strengthProgress: [
      { date: "Jan 1", benchPress: 60, squat: 80, deadlift: 100 },
      { date: "Jan 8", benchPress: 62, squat: 85, deadlift: 105 },
      { date: "Jan 15", benchPress: 65, squat: 87, deadlift: 110 },
      { date: "Jan 22", benchPress: 67, squat: 90, deadlift: 115 },
      { date: "Jan 29", benchPress: 70, squat: 92, deadlift: 120 },
    ],
    workoutVolume: [
      { week: "Week 1", volume: 12500, sessions: 4 },
      { week: "Week 2", volume: 13200, sessions: 4 },
      { week: "Week 3", volume: 13800, sessions: 5 },
      { week: "Week 4", volume: 14500, sessions: 5 },
    ],
    bodyComposition: [
      { date: "Jan 1", weight: 72, bodyFat: 15, muscle: 61 },
      { date: "Jan 8", weight: 71.8, bodyFat: 14.5, muscle: 61.3 },
      { date: "Jan 15", weight: 71.5, bodyFat: 14, muscle: 61.5 },
      { date: "Jan 22", weight: 71.2, bodyFat: 13.5, muscle: 61.8 },
      { date: "Jan 29", weight: 71, bodyFat: 13, muscle: 62 },
    ],
    nutritionProgress: [
      { date: "Jan 1", calories: 2100, protein: 140, carbs: 220, fat: 75 },
      { date: "Jan 2", calories: 2250, protein: 150, carbs: 240, fat: 80 },
      { date: "Jan 3", calories: 2180, protein: 145, carbs: 230, fat: 78 },
      { date: "Jan 4", calories: 2300, protein: 155, carbs: 250, fat: 82 },
      { date: "Jan 5", calories: 2200, protein: 148, carbs: 235, fat: 79 },
    ],
  }

  // Calculated Nutrition Goals
  public getNutritionGoals(): NutritionGoals {
    const { weight, height, age, activityLevel, fitnessGoal } = this.userProfile

    // Calculate BMR using Mifflin-St Jeor equation
    const bmr = 10 * weight + 6.25 * height - 5 * age + 5 // Male formula

    // Activity multipliers
    const activityMultipliers = {
      sedentary: 1.2,
      lightly_active: 1.375,
      moderately_active: 1.55,
      very_active: 1.725,
      extremely_active: 1.9,
    }

    const tdee = bmr * activityMultipliers[activityLevel]

    // Goal adjustments
    const goalAdjustments = {
      weight_loss: -500,
      muscle_gain: 300,
      maintenance: 0,
      endurance: 200,
      strength: 250,
    }

    const dailyCalories = Math.round(tdee + goalAdjustments[fitnessGoal])

    // Macro calculations based on goal
    let proteinRatio = 0.25
    let carbRatio = 0.45
    let fatRatio = 0.3

    if (fitnessGoal === "muscle_gain") {
      proteinRatio = 0.3
      carbRatio = 0.4
      fatRatio = 0.3
    } else if (fitnessGoal === "weight_loss") {
      proteinRatio = 0.35
      carbRatio = 0.35
      fatRatio = 0.3
    }

    return {
      dailyCalories,
      dailyWater: 2500, // ml
      protein: Math.round((dailyCalories * proteinRatio) / 4), // grams
      carbs: Math.round((dailyCalories * carbRatio) / 4), // grams
      fat: Math.round((dailyCalories * fatRatio) / 9), // grams
      fiber: Math.round(weight * 0.5), // grams
    }
  }

  // Singleton pattern
  public static getInstance(): DataStore {
    if (!DataStore.instance) {
      DataStore.instance = new DataStore()
    }
    return DataStore.instance
  }

  // Helper methods for data manipulation
  public addWorkoutSession(session: Omit<WorkoutSession, "id">): WorkoutSession {
    const newSession = { ...session, id: Date.now().toString() }
    this.workoutHistory.push(newSession)
    return newSession
  }

  public addLoggedFood(food: Omit<LoggedFood, "id">): LoggedFood {
    const newFood = { ...food, id: Date.now().toString() }
    this.loggedFoods.push(newFood)
    return newFood
  }

  public addWaterEntry(entry: Omit<WaterEntry, "id">): WaterEntry {
    const newEntry = { ...entry, id: Date.now().toString() }
    this.waterEntries.push(newEntry)
    return newEntry
  }

  public addRecoveryMetrics(metrics: Omit<RecoveryMetrics, "id">): RecoveryMetrics {
    const newMetrics = { ...metrics, id: Date.now().toString() }
    this.recoveryHistory.push(newMetrics)
    return newMetrics
  }

  public updateUserProfile(updates: Partial<UserProfile>): UserProfile {
    this.userProfile = { ...this.userProfile, ...updates, updatedAt: new Date() }
    return this.userProfile
  }

  public updateUserSettings(updates: Partial<UserSettings>): UserSettings {
    this.userSettings = { ...this.userSettings, ...updates }
    return this.userSettings
  }

  // Data retrieval helpers
  public getTodaysLoggedFoods(): LoggedFood[] {
    const today = new Date().toDateString()
    return this.loggedFoods.filter((food) => food.date.toDateString() === today)
  }

  public getTodaysWaterIntake(): number {
    const today = new Date().toDateString()
    return this.waterEntries
      .filter((entry) => entry.date.toDateString() === today)
      .reduce((total, entry) => total + entry.amount, 0)
  }

  public getRecentWorkouts(limit = 5): WorkoutSession[] {
    return this.workoutHistory.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, limit)
  }

  public getLatestRecoveryMetrics(): RecoveryMetrics | null {
    if (this.recoveryHistory.length === 0) return null
    return this.recoveryHistory.sort((a, b) => b.date.getTime() - a.date.getTime())[0]
  }
}

// Export singleton instance
export const dataStore = DataStore.getInstance()

// Export helper functions for easy access
export const getUserProfile = () => dataStore.userProfile
export const getUserSettings = () => dataStore.userSettings
export const getWorkoutTemplates = () => dataStore.workoutTemplates
export const getWorkoutHistory = () => dataStore.workoutHistory
export const getFoodDatabase = () => dataStore.foodDatabase
export const getLoggedFoods = () => dataStore.loggedFoods
export const getWaterEntries = () => dataStore.waterEntries
export const getRecoveryHistory = () => dataStore.recoveryHistory
export const getProgressData = () => dataStore.progressData
export const getNutritionGoals = () => dataStore.getNutritionGoals()

// Export data manipulation functions
export const addWorkoutSession = (session: Omit<WorkoutSession, "id">) => dataStore.addWorkoutSession(session)
export const addLoggedFood = (food: Omit<LoggedFood, "id">) => dataStore.addLoggedFood(food)
export const addWaterEntry = (entry: Omit<WaterEntry, "id">) => dataStore.addWaterEntry(entry)
export const addRecoveryMetrics = (metrics: Omit<RecoveryMetrics, "id">) => dataStore.addRecoveryMetrics(metrics)
export const updateUserProfile = (updates: Partial<UserProfile>) => dataStore.updateUserProfile(updates)
export const updateUserSettings = (updates: Partial<UserSettings>) => dataStore.updateUserSettings(updates)

// Export data retrieval helpers
export const getTodaysLoggedFoods = () => dataStore.getTodaysLoggedFoods()
export const getTodaysWaterIntake = () => dataStore.getTodaysWaterIntake()
export const getRecentWorkouts = (limit?: number) => dataStore.getRecentWorkouts(limit)
export const getLatestRecoveryMetrics = () => dataStore.getLatestRecoveryMetrics()
