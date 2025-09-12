/**
 * Weight conversion and formatting utilities
 * 
 * This utility provides centralized weight conversion functions and formatting
 * for consistent unit handling across the application.
 * 
 * All weights are stored in pounds (lbs) in the database for consistency,
 * and converted to the user's preferred units for display.
 */

export type WeightUnit = 'imperial' | 'metric'

// Conversion constants
const LBS_TO_KG_RATIO = 0.453592
const KG_TO_LBS_RATIO = 1 / LBS_TO_KG_RATIO

/**
 * Convert pounds to kilograms
 */
export function lbsToKg(lbs: number): number {
  return lbs * LBS_TO_KG_RATIO
}

/**
 * Convert kilograms to pounds
 */
export function kgToLbs(kg: number): number {
  return kg * KG_TO_LBS_RATIO
}

/**
 * Format weight for display based on user's unit preference
 * @param weightInLbs - Weight value in pounds (database storage format)
 * @param units - User's preferred unit system
 * @param includeUnit - Whether to include the unit suffix (default: true)
 * @param precision - Number of decimal places (default: 2)
 */
export function formatWeight(
  weightInLbs: number, 
  units: WeightUnit, 
  includeUnit: boolean = true,
  precision: number = 2
): string {
  if (units === 'imperial') {
    const formatted = weightInLbs.toFixed(precision)
    return includeUnit ? `${formatted} lbs` : formatted
  } else {
    const kg = lbsToKg(weightInLbs)
    const formatted = kg.toFixed(precision)
    return includeUnit ? `${formatted} kg` : formatted
  }
}

/**
 * Format weight change for display (with +/- prefix)
 * @param changeInLbs - Weight change in pounds (database storage format)
 * @param units - User's preferred unit system
 * @param precision - Number of decimal places (default: 2)
 */
export function formatWeightChange(
  changeInLbs: number, 
  units: WeightUnit,
  precision: number = 2
): string {
  const absChange = Math.abs(changeInLbs)
  let formatted: string
  
  if (units === 'imperial') {
    formatted = `${absChange.toFixed(precision)} lbs`
  } else {
    const kgChange = lbsToKg(absChange)
    formatted = `${kgChange.toFixed(precision)} kg`
  }
  
  if (changeInLbs > 0) {
    return `+${formatted}`
  } else if (changeInLbs < 0) {
    return `-${formatted}`
  } else {
    return formatted
  }
}

/**
 * Get the weight unit label for the current unit system
 */
export function getWeightUnitLabel(units: WeightUnit): string {
  return units === 'imperial' ? 'lbs' : 'kg'
}

/**
 * Get the weight unit abbreviation for forms and inputs
 */
export function getWeightUnitAbbr(units: WeightUnit): string {
  return units === 'imperial' ? 'lbs' : 'kg'
}

/**
 * Convert user input weight to pounds for database storage
 * @param weight - Weight value in user's preferred units
 * @param units - User's unit system
 */
export function weightToLbs(weight: number, units: WeightUnit): number {
  return units === 'imperial' ? weight : kgToLbs(weight)
}

/**
 * Convert weight from pounds to user's preferred units for display in forms
 * @param weightInLbs - Weight value in pounds (database format)
 * @param units - User's preferred unit system
 */
export function weightFromLbs(weightInLbs: number, units: WeightUnit): number {
  return units === 'imperial' ? weightInLbs : lbsToKg(weightInLbs)
}

/**
 * Format volume (weight × reps) for display
 * @param volumeInLbs - Total volume in pounds
 * @param units - User's preferred unit system
 * @param includeUnit - Whether to include the unit suffix (default: true)
 */
export function formatVolume(
  volumeInLbs: number, 
  units: WeightUnit,
  includeUnit: boolean = true
): string {
  let value: number
  let unit: string
  
  if (units === 'imperial') {
    value = volumeInLbs
    unit = 'lbs'
  } else {
    value = lbsToKg(volumeInLbs)
    unit = 'kg'
  }
  
  // Format large numbers with K suffix
  let formatted: string
  if (value >= 10000) {
    formatted = `${(value / 1000).toFixed(1)}K`
  } else {
    formatted = value.toLocaleString()
  }
  
  return includeUnit ? `${formatted} ${unit}` : formatted
}

/**
 * Hook to get user's preferred weight units from API
 * This can be used in components that need to fetch user preferences
 */
export async function getUserWeightUnits(): Promise<WeightUnit> {
  try {
    const response = await fetch('/api/user/preferences')
    if (response.ok) {
      const data = await response.json()
      return data?.preferences?.app?.units || 'imperial'
    }
  } catch (error) {
    console.error('Error loading user preferences:', error)
  }
  return 'imperial' // Default fallback
}