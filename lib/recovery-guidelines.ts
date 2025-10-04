const REST_WINDOW_MAP: Record<string, number> = {
  chest: 48,
  back: 48,
  "upper back": 48,
  "lower back": 72,
  shoulders: 48,
  traps: 48,
  "upper arms": 48,
  "upper body": 48,
  biceps: 36,
  triceps: 36,
  forearms: 36,
  "lower arms": 36,
  core: 24,
  abs: 24,
  obliques: 24,
  waist: 24,
  glutes: 72,
  hips: 72,
  hamstrings: 72,
  quadriceps: 72,
  "upper legs": 72,
  calves: 48,
  "lower legs": 48,
  cardio: 24,
  neck: 24,
  fullbody: 72,
  mobility: 24,
  arms: 48,
  legs: 72
}

const NORMALIZATION_MAP: Record<string, string> = {
  "upper legs": "upper legs",
  "lower legs": "lower legs",
  quads: "quadriceps",
  hams: "hamstrings",
  glute: "glutes",
  abdominals: "abs",
  ab: "abs",
  "lower-body": "legs",
  "upper-body": "upper body",
  "upper body": "upper body",
  cardio: "cardio",
  waist: "waist",
  shoulders: "shoulders",
  arms: "arms",
  legs: "legs"
}

export const DEFAULT_REST_WINDOW_HOURS = 48

export function normalizeBodyPartKey(input: string): string {
  const trimmed = input.trim().toLowerCase()
  if (NORMALIZATION_MAP[trimmed]) {
    return NORMALIZATION_MAP[trimmed]
  }
  return trimmed
}

export function getRestWindowHours(bodyPart: string): number {
  const key = normalizeBodyPartKey(bodyPart)
  return REST_WINDOW_MAP[key] ?? DEFAULT_REST_WINDOW_HOURS
}

export function formatBodyPartLabel(bodyPart: string): string {
  if (!bodyPart) return "Unknown"
  return bodyPart
    .split(/\s|-/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export function getRecoveryStatusFromHours(
  hoursSinceLast: number | null,
  restWindowHours: number,
  hasPainFlag: boolean
): "ready" | "caution" | "rest" | "pain" {
  if (hasPainFlag) {
    return "pain"
  }

  if (hoursSinceLast === null) {
    return "ready"
  }

  if (hoursSinceLast < restWindowHours * 0.6) {
    return "rest"
  }

  if (hoursSinceLast < restWindowHours) {
    return "caution"
  }

  return "ready"
}
