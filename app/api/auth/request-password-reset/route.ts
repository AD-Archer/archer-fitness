import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import prisma from "@/lib/prisma"
import { createPasswordResetToken } from "@/lib/password-reset"
import { emailNotificationManager } from "@/lib/email-notifications"
import { logger } from "@/lib/logger"

const requestSchema = z.object({
  email: z.string().email(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = requestSchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    })

    if (!user) {
      return NextResponse.json({ message: "If an account exists, a reset email was sent" })
    }

    const { token } = await createPasswordResetToken(user.id)
    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000"
    const resetUrl = `${baseUrl}/auth/reset/${token}`

    const emailSent = await emailNotificationManager.sendPasswordResetEmail(user.email, resetUrl)

    if (!emailSent) {
      logger.warn("Password reset email could not be sent", { email })
    }

    return NextResponse.json({ message: "If an account exists, a reset email was sent" })
  } catch (error) {
    logger.error("Password reset request failed", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Unable to process request" },
      { status: 500 }
    )
  }
}
