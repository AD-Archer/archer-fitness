import { NextResponse, NextRequest } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { logger } from "@/lib/logger"
import { createEmailVerificationToken } from "@/lib/email-verification"
import { emailNotificationManager } from "@/lib/email-notifications"

const emailSchema = z.object({
  email: z.string().email(),
})

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { email } = emailSchema.parse(body)

    // Check if user has any OAuth accounts linked
    const accounts = await prisma.account.findMany({
      where: { userId: session.user.id },
      select: { provider: true },
    })

    if (accounts.length > 0) {
      return NextResponse.json(
        { error: "Cannot change email while OAuth providers are linked. Please unlink them first." },
        { status: 400 }
      )
    }

    // Check if email is already in use
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })

    if (existingUser && existingUser.id !== session.user.id) {
      return NextResponse.json(
        { error: "This email is already in use by another account" },
        { status: 400 }
      )
    }

    // Create verification token
    const { token, code } = await createEmailVerificationToken(session.user.id, email)
    
    // Build verification URL
    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000"
    const verifyUrl = `${baseUrl}/auth/verify-email/${token}`

    // Send verification email
    const emailSent = await emailNotificationManager.sendEmailVerificationEmail(
      email, 
      verifyUrl, 
      code
    )

    if (!emailSent) {
      logger.warn("Email verification email could not be sent", { email })
    }

    logger.info(`User ${session.user.id} requested email change to ${email}`)

    return NextResponse.json({ 
      message: "Verification email sent. Please check your inbox and verify your new email address.",
      requiresVerification: true,
      email
    })
  } catch (error) {
    logger.error("Failed to update email", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: "Unable to update email" }, { status: 500 })
  }
}
