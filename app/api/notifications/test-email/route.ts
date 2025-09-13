import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { emailNotificationManager } from "@/lib/email-notifications"
import { logger } from "@/lib/logger"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { type = "test" } = await request.json()

    let success = false
    const email = session.user.email

    switch (type) {
      case "workout":
        success = await emailNotificationManager.sendWorkoutReminder(
          email,
          "Test Workout",
          new Date().toISOString()
        )
        break

      case "weight":
        success = await emailNotificationManager.sendWeightReminder(email)
        break

      case "weigh-in":
        success = await emailNotificationManager.sendWeighInReminder(email)
        break

      case "meal":
        success = await emailNotificationManager.sendMealReminder(email, "lunch")
        break

      case "sleep":
        success = await emailNotificationManager.sendSleepReminder(email)
        break

      case "exercise":
        success = await emailNotificationManager.sendExerciseReminder(email, "Test Exercise")
        break

      default:
        success = await emailNotificationManager.sendTestNotification(
          `This is a test ${type} notification from Archer Fitness. Sent at ${new Date().toISOString()}`
        )
    }

    return NextResponse.json({
      success,
      message: success ? `Test ${type} email sent successfully` : `Failed to send test ${type} email`
    })
  } catch (error) {
    logger.error("Error sending test email:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}