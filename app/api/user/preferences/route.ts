import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

export const dynamic = 'force-dynamic';

const workoutPrefsSchema = z.object({
  defaultDuration: z.string(),
  difficultyLevel: z.string(),
  preferredTime: z.string(),
  availableEquipment: z.array(z.string()),
  restDayReminders: z.boolean(),
})

const nutritionPrefsSchema = z.object({
  dailyCalories: z.string(),
  proteinTarget: z.string(),
  carbTarget: z.string(),
  fatTarget: z.string(),
  dietaryRestrictions: z.array(z.string()),
  trackWater: z.boolean(),
  waterTarget: z.string(),
  useSmartCalculations: z.boolean(),
})

const appPrefsSchema = z.object({
  theme: z.string(),
  units: z.string(),
  notifications: z.boolean(),
  weeklyReports: z.boolean(),
  dataSharing: z.boolean(),
})

const preferencesSchema = z.object({
  workoutPrefs: workoutPrefsSchema,
  nutritionPrefs: nutritionPrefsSchema,
  appPrefs: appPrefsSchema,
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
  } catch (error) {
    console.error("Preferences fetch error:", error)
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
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Preferences update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
