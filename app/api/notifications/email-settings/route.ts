import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { logger } from "@/lib/logger"

const emailSettingsSchema = z.object({
  emailNotifications: z.boolean(),
  weighInNotifications: z.boolean(),
  weighInFrequency: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  mealNotifications: z.boolean(),
  mealFrequency: z.union([z.literal(1), z.literal(3)]),
  sleepNotifications: z.boolean(),
  exerciseNotifications: z.boolean(),
  workoutReminders: z.boolean(),
  weightReminders: z.boolean(),
  nutritionReminders: z.boolean(),
  streakReminders: z.boolean(),
  reminderTime: z.string(),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const prefs = await prisma.userPreference.findUnique({
      where: { userId: session.user.id },
      select: { app: true }
    })

    if (!prefs?.app) {
      return NextResponse.json({
        emailSettings: {
          emailNotifications: true,
          weighInNotifications: true,
          weighInFrequency: 1,
          mealNotifications: true,
          mealFrequency: 3,
          sleepNotifications: true,
          exerciseNotifications: true,
          workoutReminders: true,
          weightReminders: true,
          nutritionReminders: true,
          streakReminders: true,
          reminderTime: "09:00",
        }
      })
    }

    const appPrefs = prefs.app as any
    const notificationPrefs = appPrefs.notificationPrefs || {}

    return NextResponse.json({
      emailSettings: {
        emailNotifications: notificationPrefs.emailNotifications ?? true,
        weighInNotifications: notificationPrefs.weighInNotifications ?? true,
        weighInFrequency: notificationPrefs.weighInFrequency ?? 1,
        mealNotifications: notificationPrefs.mealNotifications ?? true,
        mealFrequency: notificationPrefs.mealFrequency ?? 3,
        sleepNotifications: notificationPrefs.sleepNotifications ?? true,
        exerciseNotifications: notificationPrefs.exerciseNotifications ?? true,
        workoutReminders: notificationPrefs.workoutReminders ?? true,
        weightReminders: notificationPrefs.weightReminders ?? true,
        nutritionReminders: notificationPrefs.nutritionReminders ?? true,
        streakReminders: notificationPrefs.streakReminders ?? true,
        reminderTime: notificationPrefs.reminderTime ?? "09:00",
      }
    })
  } catch (error) {
    logger.error("Error fetching email settings:", error)
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
    const validatedSettings = emailSettingsSchema.parse(body)

    // Get current preferences
    const currentPrefs = await prisma.userPreference.findUnique({
      where: { userId: session.user.id },
      select: { app: true }
    })

    const appPrefs = (currentPrefs?.app as any) || {}
    const updatedAppPrefs = {
      ...appPrefs,
      notificationPrefs: {
        ...appPrefs.notificationPrefs,
        ...validatedSettings
      }
    }

    // Update preferences
    await prisma.userPreference.upsert({
      where: { userId: session.user.id },
      update: { app: updatedAppPrefs },
      create: {
        userId: session.user.id,
        workout: {},
        nutrition: {},
        app: updatedAppPrefs
      }
    })

    return NextResponse.json({
      success: true,
      emailSettings: validatedSettings
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }
    logger.error("Error updating email settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}