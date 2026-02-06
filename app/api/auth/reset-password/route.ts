import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { consumePasswordResetToken } from "@/lib/password-reset"
import { emailNotificationManager } from "@/lib/email-notifications"

const resetSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password } = resetSchema.parse(body)

    const user = await consumePasswordResetToken(token, password)

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      )
    }

    if (user.email) {
      await emailNotificationManager.sendPasswordChangedEmail(user.email)
    }

    return NextResponse.json({ message: "Password updated successfully" })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Unable to reset password" },
      { status: 500 }
    )
  }
}
