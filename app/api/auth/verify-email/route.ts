import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { verifyEmailWithCode, resendVerificationEmail, getPendingVerification } from "@/lib/email-verification"
import { emailNotificationManager } from "@/lib/email-notifications"
import { logger } from "@/lib/logger"
import { z } from "zod"

const verifySchema = z.object({
  code: z.string().length(6),
})

// Get pending verification status
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const pending = await getPendingVerification(session.user.id)

    return NextResponse.json({ 
      hasPendingVerification: !!pending,
      ...pending
    })
  } catch (error) {
    logger.error("Failed to get verification status", error)
    return NextResponse.json({ error: "Unable to check verification status" }, { status: 500 })
  }
}

// Verify email with code
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { code } = verifySchema.parse(body)

    const result = await verifyEmailWithCode(session.user.id, code)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    // Send confirmation email
    await emailNotificationManager.sendEmailVerifiedEmail(result.email)

    logger.info(`User ${session.user.id} verified email: ${result.email}`)

    return NextResponse.json({ 
      message: "Email verified successfully",
      email: result.email
    })
  } catch (error) {
    logger.error("Failed to verify email", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid verification code format" },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: "Unable to verify email" }, { status: 500 })
  }
}

// Resend verification email
export async function PUT() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = await resendVerificationEmail(session.user.id)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    // Build verification URL
    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000"
    const verifyUrl = `${baseUrl}/auth/verify-email/${result.token}`

    // Send new verification email
    const emailSent = await emailNotificationManager.sendEmailVerificationEmail(
      result.email,
      verifyUrl,
      result.code
    )

    if (!emailSent) {
      logger.warn("Verification email could not be resent", { email: result.email })
    }

    logger.info(`Resent verification email to ${result.email} for user ${session.user.id}`)

    return NextResponse.json({ 
      message: "Verification email resent. Please check your inbox.",
      email: result.email
    })
  } catch (error) {
    logger.error("Failed to resend verification email", error)
    return NextResponse.json({ error: "Unable to resend verification email" }, { status: 500 })
  }
}
