// Shared types for settings components
export interface UserProfile {
  name: string
  email: string
  age: string
  weight: string
  heightFeet: string
  heightInches: string
  heightCm: string
  gender: string
  fitnessGoals: string
  activityLevel: string
}

export interface WorkoutPrefs {
  defaultDuration: string
  difficultyLevel: string
  preferredTime: string
  availableEquipment: string[]
  restDayReminders: boolean
}

export interface NutritionPrefs {
  dailyCalories: string
  proteinTarget: string
  carbTarget: string
  fatTarget: string
  dietaryRestrictions: string[]
  trackWater: boolean
  waterTarget: string
  useSmartCalculations: boolean
}

export interface AppPrefs {
  theme: string
  units: string
  notifications: boolean
  weeklyReports: boolean
  dataSharing: boolean
  notificationPrefs: {
    workoutReminders: boolean
    weightReminders: boolean
    nutritionReminders: boolean
    streakReminders: boolean
    reminderTime: string // HH:MM format
  }
}
