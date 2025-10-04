import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { logger } from "@/lib/logger"
import { buildGeneratedTemplates, normalizeGenerationCriteria, WorkoutTemplateWithExercises } from "@/lib/schedule-template-generator"
import { ScheduleTemplate, ScheduleTemplateMetadata } from "@/app/schedule/types/schedule"

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const sanitizeArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return []
  return value
    .map((entry) => typeof entry === "string" ? entry.trim() : "")
    .filter((entry) => entry.length > 0)
}

const extractPreferredDays = (value: unknown): number[] | undefined => {
  if (!Array.isArray(value)) return undefined
  const days = value
    .map((entry) => {
      if (typeof entry === "number") return entry
      if (typeof entry === "string" && entry.trim() !== "") {
        const parsed = Number.parseInt(entry, 10)
        if (!Number.isNaN(parsed)) {
          return parsed
        }
      }
      return null
    })
    .filter((entry): entry is number => entry !== null && entry >= 0 && entry <= 6)

  return days.length > 0 ? days : undefined
}

const toScheduleTemplate = (template: any): ScheduleTemplate => {
  const items: Array<{
    type: "workout"
    title: string
    description?: string
    day: number
    startTime: string
    endTime: string
    category?: string
    difficulty?: string
    calories?: number
    duration?: number
    isFromGenerator?: boolean
  }> = (template.items ?? []).map((item: {
    type?: string
    title: string
    description?: string | null
    day: number
    startTime: string
    endTime: string
    category?: string | null
    difficulty?: string | null
    calories?: number | null
    duration?: number | null
    isFromGenerator?: boolean | null
  }) => ({
  type: "workout",
    title: item.title,
    description: item.description ?? undefined,
    day: item.day,
    startTime: item.startTime,
    endTime: item.endTime,
    category: item.category ?? undefined,
    difficulty: item.difficulty ?? undefined,
    calories: item.calories ?? undefined,
    duration: item.duration ?? undefined,
    isFromGenerator: Boolean(item.isFromGenerator)
  }))

  const metadata: ScheduleTemplateMetadata = {
    source: template.isDefault ? "default" : "recommended",
    generatedAt: template.createdAt instanceof Date ? template.createdAt.toISOString() : undefined,
    tags: Array.from(new Set(items
      .map((item: { category?: string }) => item.category)
      .filter((category: string | undefined): category is string => Boolean(category))
    ))
  }

  return {
    id: template.id,
    name: template.name,
    description: template.description ?? undefined,
    items,
    isDefault: template.isDefault ?? false,
    usageCount: template.usageCount ?? 0,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
    metadata
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const countParam = Number.parseInt(request.nextUrl.searchParams.get("count") ?? "3", 10)
    const desiredCount = clamp(Number.isFinite(countParam) ? countParam : 3, 1, 6)

    const defaultTemplates = await prisma.scheduleTemplate.findMany({
      where: {
        OR: [
          { isDefault: true },
          { isPublic: true }
        ]
      },
      include: {
        items: {
          orderBy: [
            { day: "asc" },
            { startTime: "asc" }
          ]
        }
      },
      orderBy: [
        { isDefault: "desc" },
        { usageCount: "desc" },
        { updatedAt: "desc" }
      ],
      take: desiredCount
    })

    const sanitizedDefaults = defaultTemplates.map(toScheduleTemplate)

    if (sanitizedDefaults.length >= desiredCount) {
      return NextResponse.json({ templates: sanitizedDefaults })
    }

    const remainingNeeded = desiredCount - sanitizedDefaults.length

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

    const normalizedCriteria = normalizeGenerationCriteria(defaultCriteria)

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

    const generated = buildGeneratedTemplates({
      workoutTemplates: allEligibleTemplates,
      criteria: normalizedCriteria,
      count: remainingNeeded,
      backupPool: allEligibleTemplates,
      allowedEquipment: normalizedCriteria.allowedEquipment
    }).map((template) => ({
      ...template,
      metadata: {
        ...(template.metadata ?? {}),
        source: "recommended" as const
      }
    }))

    const templates: ScheduleTemplate[] = [...sanitizedDefaults, ...generated]

    return NextResponse.json({ templates })
  } catch (error) {
    logger.error("Error fetching recommended schedule templates:", error)
    return NextResponse.json({ error: "Failed to load recommended templates" }, { status: 500 })
  }
}
