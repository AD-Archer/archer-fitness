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
  adminNotifications: {
    enabled: boolean
    methods: ('smtp')[]
    errorAlerts: boolean
    startupAlerts: boolean
  }
  notificationPrefs: {
    workoutReminders: boolean
    weightReminders: boolean
    streakReminders: boolean
    reminderTime: string // HH:MM format
    emailNotifications: boolean // Enable email notifications
    pushNotifications: boolean // Enable push notifications
    // New preset notification types
    weighInNotifications: boolean
    weighInFrequency: 1 | 2 | 3 // times per day
    mealNotifications: boolean
    mealFrequency: 1 | 3 // times per day
    sleepNotifications: boolean
    exerciseNotifications: boolean
    workoutTime: string // HH:MM format for preferred workout time
  }
}
