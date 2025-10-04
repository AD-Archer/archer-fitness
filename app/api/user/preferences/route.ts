import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { logger } from "@/lib/logger"

export const dynamic = 'force-dynamic';

const workoutPrefsSchema = z.object({
  defaultDuration: z.string().default("45"),
  difficultyLevel: z.string().default("intermediate"),
  preferredTime: z.string().default("morning"),
  availableEquipment: z.array(z.string()).default(["dumbbells", "barbell", "bodyweight"]),
  restDayReminders: z.boolean().default(true),
}).default({
  defaultDuration: "45",
  difficultyLevel: "intermediate",
  preferredTime: "morning",
  availableEquipment: ["dumbbells", "barbell", "bodyweight"],
  restDayReminders: true,
})

const nutritionPrefsSchema = z.object({
  dailyCalories: z.string().default("2200"),
  proteinTarget: z.string().default("150"),
  carbTarget: z.string().default("250"),
  fatTarget: z.string().default("80"),
  dietaryRestrictions: z.array(z.string()).default([]),
  trackWater: z.boolean().default(true),
  waterTarget: z.string().default("2500"),
  useSmartCalculations: z.boolean().default(true),
}).default({
  dailyCalories: "2200",
  proteinTarget: "150",
  carbTarget: "250",
  fatTarget: "80",
  dietaryRestrictions: [],
  trackWater: true,
  waterTarget: "2500",
  useSmartCalculations: true,
})

const appPrefsSchema = z.object({
  theme: z.string().default("system"),
  units: z.string().default("imperial"),
  notifications: z.boolean().default(true),
  weeklyReports: z.boolean().default(true),
  dataSharing: z.boolean().default(false),
  timezone: z.string().default("UTC"),
  timeFormat: z.enum(["12h", "24h"]).default("24h"),
  adminNotifications: z.object({
    enabled: z.boolean().default(true),
    methods: z.array(z.enum(['smtp'])).default(['smtp']),
    errorAlerts: z.boolean().default(true),
    startupAlerts: z.boolean().default(true),
  }).optional().default({
    enabled: true,
    methods: ['smtp'],
    errorAlerts: true,
    startupAlerts: true
  }),
  notificationPrefs: z.object({
    workoutReminders: z.boolean().default(true),
    weightReminders: z.boolean().default(true),
    streakReminders: z.boolean().default(true),
    reminderTime: z.string().default("09:00"),
    emailNotifications: z.boolean().default(true),
    pushNotifications: z.boolean().default(true),
    weighInNotifications: z.boolean().default(true),
    weighInFrequency: z.union([z.literal(1), z.literal(2), z.literal(3), z.string()]).transform(val => {
      if (typeof val === 'string') return parseInt(val) as 1 | 2 | 3
      return val
    }).default(3),
    mealNotifications: z.boolean().default(true),
    mealFrequency: z.union([z.literal(1), z.literal(3), z.string()]).transform(val => {
      if (typeof val === 'string') return parseInt(val) as 1 | 3
      return val
    }).default(3),
    sleepNotifications: z.boolean().default(true),
    exerciseNotifications: z.boolean().default(true),
    workoutTime: z.string().default("18:00"),
  }).optional().default({
    workoutReminders: true,
    weightReminders: true,
    streakReminders: true,
    reminderTime: "09:00",
    emailNotifications: true,
    pushNotifications: true,
    weighInNotifications: true,
    weighInFrequency: 3,
    mealNotifications: true,
    mealFrequency: 3,
    sleepNotifications: true,
    exerciseNotifications: true,
    workoutTime: "18:00"
  }),
}).default({
  theme: "system",
  units: "imperial",
  notifications: true,
  weeklyReports: true,
  dataSharing: false,
  timezone: "UTC",
  timeFormat: "24h",
  adminNotifications: {
    enabled: true,
    methods: ['smtp'],
    errorAlerts: true,
    startupAlerts: true
  },
  notificationPrefs: {
    workoutReminders: true,
    weightReminders: true,
    streakReminders: true,
    reminderTime: "09:00",
    emailNotifications: true,
    pushNotifications: true,
    weighInNotifications: true,
    weighInFrequency: 1,
    mealNotifications: true,
    mealFrequency: 3,
    sleepNotifications: true,
    exerciseNotifications: true,
    workoutTime: "18:00"
  }
})

const preferencesSchema = z.object({
  workoutPrefs: workoutPrefsSchema.optional(),
  nutritionPrefs: nutritionPrefsSchema.optional(),
  appPrefs: appPrefsSchema.optional(),
}).optional().transform((data) => {
  return {
    workoutPrefs: data?.workoutPrefs || {
      defaultDuration: "45",
      difficultyLevel: "intermediate",
      preferredTime: "morning",
      availableEquipment: ["dumbbells", "barbell", "bodyweight"],
      restDayReminders: true,
    },
    nutritionPrefs: data?.nutritionPrefs || {
      dailyCalories: "2200",
      proteinTarget: "150",
      carbTarget: "250",
      fatTarget: "80",
      dietaryRestrictions: [],
      trackWater: true,
      waterTarget: "2500",
      useSmartCalculations: true,
    },
    appPrefs: data?.appPrefs || {
      theme: "system",
      units: "imperial",
      notifications: true,
      weeklyReports: true,
      dataSharing: false,
      timezone: "UTC",
      timeFormat: "24h",
      adminNotifications: {
        enabled: true,
        methods: ['smtp'],
        errorAlerts: true,
        startupAlerts: true
      },
      notificationPrefs: {
        workoutReminders: true,
        weightReminders: true,
        streakReminders: true,
        reminderTime: "09:00",
        emailNotifications: true,
        pushNotifications: true,
        weighInNotifications: true,
        weighInFrequency: 1,
        mealNotifications: true,
        mealFrequency: 3,
        sleepNotifications: true,
        exerciseNotifications: true,
        workoutTime: "18:00"
      }
    }
  }
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

  const delegate = prisma.userPreference
  if (!delegate) {
    return NextResponse.json(
      { error: "Preferences storage not initialized. Run database migrations." },
      { status: 503 }
    )
  }
  const prefs = await delegate.findUnique({
      where: { userId: session.user.id },
    })

    if (!prefs) {
      return NextResponse.json({ preferences: null })
    }

    return NextResponse.json({
      preferences: {
        workoutPrefs: prefs.workout,
        nutritionPrefs: prefs.nutrition,
        appPrefs: prefs.app,
      },
    })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    // Parse with defaults to ensure all required fields are present
    const parsed = preferencesSchema.parse(body)

    const delegate = prisma.userPreference
    if (!delegate) {
      return NextResponse.json(
        { error: "Preferences storage not initialized. Run database migrations." },
        { status: 503 }
      )
    }

    const updated = await delegate.upsert({
      where: { userId: session.user.id },
      update: {
        workout: parsed.workoutPrefs,
        nutrition: parsed.nutritionPrefs,
        app: parsed.appPrefs,
      },
      create: {
        userId: session.user.id,
        workout: parsed.workoutPrefs,
        nutrition: parsed.nutritionPrefs,
        app: parsed.appPrefs,
      },
      select: {
        workout: true,
        nutrition: true,
        app: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({
      preferences: {
        workoutPrefs: updated.workout,
        nutritionPrefs: updated.nutrition,
        appPrefs: updated.app,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error("Zod validation error:", error.errors)
      return NextResponse.json(
        {
          error: "Invalid input",
          details: error.errors,
          message: "Please check that all required fields are provided with correct types"
        },
        { status: 400 }
      )
    }
    logger.error("Preferences PUT error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
