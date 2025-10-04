import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { verifyEmailWithToken } from "@/lib/email-verification"
import { emailNotificationManager } from "@/lib/email-notifications"
import { logger } from "@/lib/logger"
import { z } from "zod"

const tokenSchema = z.object({
  token: z.string().min(1),
})

// Verify email with token (from email link)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { token } = tokenSchema.parse(body)

    const result = await verifyEmailWithToken(token)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    // Send confirmation email
    await emailNotificationManager.sendEmailVerifiedEmail(result.email)

    logger.info(`User ${session.user.id} verified email via token: ${result.email}`)

    return NextResponse.json({ 
      message: "Email verified successfully",
      email: result.email
    })
  } catch (error) {
    logger.error("Failed to verify email with token", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid token format" },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: "Unable to verify email" }, { status: 500 })
  }
}
