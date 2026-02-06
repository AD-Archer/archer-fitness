import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { logger } from "@/lib/logger"
import { buildGeneratedTemplates, normalizeGenerationCriteria, WorkoutTemplateWithExercises } from "@/lib/schedule-template-generator"
import { TemplateGenerationRequest } from "@/app/schedule/types/schedule"

const MAX_GENERATED_TEMPLATES = 4

const sanitizeArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return []
  return value
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter((entry) => entry.length > 0)
}

const extractPreferredDays = (value: unknown): number[] | undefined => {
  if (!Array.isArray(value)) return undefined
  const days = value
    .map((entry) => {
      if (typeof entry === "number") return entry
      if (typeof entry === "string" && entry.trim() !== "") {
        const parsed = Number.parseInt(entry, 10)
        if (!Number.isNaN(parsed)) return parsed
      }
      return null
    })
    .filter((entry): entry is number => entry !== null && entry >= 0 && entry <= 6)

  return days.length > 0 ? days : undefined
}

const collectEquipmentOptions = (templates: WorkoutTemplateWithExercises[]): string[] => {
  const equipment = new Set<string>()
  templates.forEach((template) => {
    template.exercises.forEach((exercise: any) => {
      exercise.exercise.equipments?.forEach((relation: any) => {
        const name = relation?.equipment?.name
        if (name) {
          equipment.add(name)
        }
      })
    })
  })
  return Array.from(equipment)
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({})) as TemplateGenerationRequest | Record<string, unknown>

    // Pull workout preference defaults from stored user preferences when available
    const userPreferences = await prisma.userPreference.findUnique({
      where: { userId: session.user.id },
      select: {
        workout: true,
        app: true
      }
    })

    const workoutPrefs = (userPreferences?.workout as Record<string, unknown> | null) ?? null
    const focusAreas = sanitizeArray(workoutPrefs?.focusAreas ?? workoutPrefs?.goalFocus ?? [])
    const preferredEquipment = sanitizeArray(workoutPrefs?.availableEquipment ?? workoutPrefs?.equipment ?? [])
    const inferredCardioPreference = typeof workoutPrefs?.includeCardio === "boolean"
      ? Boolean(workoutPrefs.includeCardio)
      : focusAreas.some((area) => {
          const normalized = area.toLowerCase()
          return normalized.includes("cardio") || normalized.includes("endurance") || normalized.includes("conditioning")
        })

    const defaultCriteria = {
      daysPerWeek: typeof workoutPrefs?.daysPerWeek === "number" ? workoutPrefs.daysPerWeek : undefined,
      preferredDays: extractPreferredDays(workoutPrefs?.preferredDays ?? workoutPrefs?.splitDays),
      difficulty: typeof workoutPrefs?.difficulty === "string"
        ? workoutPrefs.difficulty
        : typeof workoutPrefs?.difficultyLevel === "string"
          ? workoutPrefs.difficultyLevel
          : undefined,
      focus: focusAreas,
      preferredStartTime: typeof workoutPrefs?.preferredTime === "string" ? workoutPrefs.preferredTime : undefined,
      repeatIntervalWeeks: typeof workoutPrefs?.repeatIntervalWeeks === "number" ? workoutPrefs.repeatIntervalWeeks : undefined,
      timezone: typeof userPreferences?.app === "object" && userPreferences?.app !== null
        ? (userPreferences.app as Record<string, unknown>).timezone as string | undefined
        : undefined,
      allowedEquipment: preferredEquipment.length > 0 ? preferredEquipment : undefined,
      includeCardio: inferredCardioPreference
    }

    const requestedCountValue = typeof (body as TemplateGenerationRequest).count === "number"
      ? (body as TemplateGenerationRequest).count
      : 1
    const requestedCount = Number.isFinite(requestedCountValue) ? Number(requestedCountValue) : 1

    const normalizedCriteria = normalizeGenerationCriteria({
      ...defaultCriteria,
      ...body,
      preferredDays: extractPreferredDays((body as TemplateGenerationRequest).preferredDays) ?? defaultCriteria.preferredDays,
      focus: (() => {
        const incoming = sanitizeArray((body as TemplateGenerationRequest).focus ?? [])
        if (incoming.length > 0) return incoming
        return defaultCriteria.focus
      })(),
      allowedEquipment: (() => {
        const incoming = sanitizeArray((body as TemplateGenerationRequest).allowedEquipment ?? [])
        if (incoming.length > 0) {
          return incoming
        }
        return defaultCriteria.allowedEquipment
      })(),
      includeCardio: (() => {
        if (typeof (body as TemplateGenerationRequest).includeCardio === "boolean") {
          return (body as TemplateGenerationRequest).includeCardio
        }
        return defaultCriteria.includeCardio
      })()
    })

    const baseWhere = {
      OR: [
        { userId: session.user.id },
        { isPredefined: true },
        { isPublic: true }
      ]
    }

    const allEligibleTemplates = await prisma.workoutTemplate.findMany({
      where: baseWhere,
      include: {
        exercises: {
          include: {
            exercise: {
              include: {
                muscles: {
                  include: {
                    muscle: true
                  }
                },
                equipments: {
                  include: {
                    equipment: true
                  }
                }
              }
            }
          },
          orderBy: { order: "asc" }
        }
      },
      orderBy: [
        { usageCount: "desc" },
        { updatedAt: "desc" }
      ],
      take: 128
    }) as WorkoutTemplateWithExercises[]

    const availableEquipmentOptions = collectEquipmentOptions(allEligibleTemplates)

    const filteredPool = allEligibleTemplates.filter((template) => {
      const matchesDifficulty = normalizedCriteria.difficulty
        ? template.difficulty?.toLowerCase() === normalizedCriteria.difficulty.toLowerCase()
        : true

      const matchesFocus = normalizedCriteria.focus && normalizedCriteria.focus.length > 0
        ? normalizedCriteria.focus.some((category) => template.category?.toLowerCase() === category.toLowerCase())
        : true

      return matchesDifficulty && matchesFocus
    })

    const primaryPool = filteredPool.length > 0 ? filteredPool : allEligibleTemplates

    const templates = buildGeneratedTemplates({
      workoutTemplates: primaryPool,
      criteria: normalizedCriteria,
      count: Math.min(Math.max(requestedCount, 1), MAX_GENERATED_TEMPLATES),
      backupPool: allEligibleTemplates,
      allowedEquipment: normalizedCriteria.allowedEquipment
    })

    const availableCategories = Array.from(new Set(allEligibleTemplates
      .map((template) => template.category)
      .filter((category): category is string => Boolean(category))))

    const availableDifficulties = Array.from(new Set(allEligibleTemplates
      .map((template) => template.difficulty)
      .filter((difficulty): difficulty is string => Boolean(difficulty))))

    const responsePayload = {
      templates,
      criteria: normalizedCriteria,
      availableCategories,
      availableDifficulties,
      availableEquipment: availableEquipmentOptions
    }

    return NextResponse.json(responsePayload)
  } catch (error) {
    logger.error("Error generating schedule templates:", error)
    return NextResponse.json({ error: "Failed to generate templates" }, { status: 500 })
  }
}
