import { UserProfile } from "./types"

// Helper function to calculate age from birthdate
export const calculateAge = (birthdate: string): number => {
  if (!birthdate) return 0
  const birth = new Date(birthdate)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

// Unit conversion utilities
export const convertWeightToKg = (weight: number, units: string) => {
  return units === "imperial" ? weight * 0.453592 : weight
}

export const convertHeightToCm = (heightFeet: number, heightInches: number) => {
  const totalInches = (heightFeet * 12) + heightInches
  return totalInches * 2.54
}

export const convertCmToFeetInches = (heightCm: number) => {
  const totalInches = heightCm / 2.54
  const feet = Math.floor(totalInches / 12)
  const inches = Math.round(totalInches % 12)
  return { feet, inches }
}

export const convertHeightToInches = (heightCm: number) => {
  return heightCm / 2.54
}

// Calculation utilities for metabolic data
export const calculateBMR = (profile: UserProfile, units: string = "metric") => {
  const weight = Number.parseFloat(profile.weight)
  const age = calculateAge(profile.birthdate)

  if (!weight || !age) return 0

  let heightCm: number

  if (units === "imperial") {
    const heightFeet = Number.parseFloat(profile.heightFeet)
    const heightInches = Number.parseFloat(profile.heightInches)
    if (!heightFeet && !heightInches) return 0
    heightCm = convertHeightToCm(heightFeet, heightInches)
  } else {
    const heightCmValue = Number.parseFloat(profile.heightCm)
    if (!heightCmValue) return 0
    heightCm = heightCmValue
  }

  // Convert weight to kg for calculations
  const weightKg = convertWeightToKg(weight, units)

  // Mifflin-St Jeor Equation
  if (profile.gender === "male") {
    return 10 * weightKg + 6.25 * heightCm - 5 * age + 5
  } else {
    return 10 * weightKg + 6.25 * heightCm - 5 * age - 161
  }
}

export const calculateTDEE = (profile: UserProfile, units: string = "metric") => {
  const bmr = calculateBMR(profile, units)
  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    extreme: 1.9,
  }
  return Math.round(bmr * activityMultipliers[profile.activityLevel as keyof typeof activityMultipliers])
}

export const calculateGoalCalories = (profile: UserProfile, units: string = "metric") => {
  const tdee = calculateTDEE(profile, units)
  const goalAdjustments = {
    weight_loss_0_5: -250, // 0.5 lbs/week = 250 calorie deficit
    weight_loss_1: -500,   // 1 lb/week = 500 calorie deficit
    muscle_gain_0_5: +250, // 0.5 lbs/week = 250 calorie surplus
    muscle_gain_1: +500,   // 1 lb/week = 500 calorie surplus
    maintenance: 0,
    endurance: +200,
    strength: +250,
  }
  const adjustment = goalAdjustments[profile.fitnessGoals as keyof typeof goalAdjustments] || 0
  return Math.round(tdee + adjustment)
}

export const calculateMacros = (profile: UserProfile, units: string = "metric") => {
  const calories = calculateGoalCalories(profile, units)

  let proteinRatio = 0.25
  let fatRatio = 0.25
  let carbRatio = 0.5

  if (profile.fitnessGoals.startsWith("muscle_gain")) {
    proteinRatio = 0.3
    fatRatio = 0.25
    carbRatio = 0.45
  } else if (profile.fitnessGoals.startsWith("weight_loss")) {
    proteinRatio = 0.35
    fatRatio = 0.3
    carbRatio = 0.35
  } else if (profile.fitnessGoals === "strength") {
    proteinRatio = 0.3
    fatRatio = 0.25
    carbRatio = 0.45
  }

  return {
    protein: Math.round((calories * proteinRatio) / 4),
    carbs: Math.round((calories * carbRatio) / 4),
    fat: Math.round((calories * fatRatio) / 9),
  }
}

export const calculateWaterTarget = (profile: UserProfile, units: string = "metric") => {
  const weight = Number.parseFloat(profile.weight)
  const weightKg = convertWeightToKg(weight, units)
  const baseWater = weightKg * 35 // ml
  const activityBonus =
    profile.activityLevel === "extreme"
      ? 500
      : profile.activityLevel === "active"
        ? 300
        : profile.activityLevel === "moderate"
          ? 200
          : 100
  const totalWaterMl = baseWater + activityBonus
  
  // Convert to ounces if imperial
  return units === "imperial" ? Math.round(totalWaterMl * 0.033814) : Math.round(totalWaterMl)
}

export const getAIRecommendation = (profile: UserProfile, units: string = "metric") => {
  const tdee = calculateTDEE(profile, units)
  const goalCalories = calculateGoalCalories(profile, units)

  let recommendation = ""
  if (profile.fitnessGoals.startsWith("weight_loss")) {
    const rate = profile.fitnessGoals.includes("_0_5") ? "0.5" : "1"
    recommendation = `For healthy weight loss at ${rate} lbs per week, aim for a ${rate === "0.5" ? "250" : "500"}-calorie deficit. Your TDEE is ${tdee} calories, so targeting ${goalCalories} calories will help you lose ${rate} pound${rate === "1" ? "" : "s"} per week.`
  } else if (profile.fitnessGoals.startsWith("muscle_gain")) {
    const rate = profile.fitnessGoals.includes("_0_5") ? "0.5" : "1"
    recommendation = `For muscle gain at ${rate} lbs per week, you need a slight caloric surplus. Your TDEE is ${tdee} calories, so ${goalCalories} calories with adequate protein will support muscle growth at ${rate} pound${rate === "1" ? "" : "s"} per week.`
  } else {
    recommendation = `For maintenance, your TDEE of ${tdee} calories is your target. This will help you maintain your current weight while supporting your fitness goals.`
  }

  return recommendation
}
