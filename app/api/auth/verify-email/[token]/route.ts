import { NextRequest, NextResponse } from "next/server"
import { verifyEmailWithToken } from "@/lib/email-verification"
import { emailNotificationManager } from "@/lib/email-notifications"
import { logger } from "@/lib/logger"

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token

    if (!token) {
      return NextResponse.redirect(new URL("/auth/signin?error=InvalidToken", request.url))
    }

    const result = await verifyEmailWithToken(token)

    if (!result.success) {
      const errorParam = encodeURIComponent(result.error || "Verification failed")
      return NextResponse.redirect(new URL(`/auth/signin?error=${errorParam}`, request.url))
    }

    // Send confirmation email
    await emailNotificationManager.sendEmailVerifiedEmail(result.email)

    logger.info(`Email verified via link: ${result.email}`)

    // Redirect to success page
    return NextResponse.redirect(new URL("/auth/signin?verified=true", request.url))
  } catch (error) {
    logger.error("Failed to verify email via link", error)
    return NextResponse.redirect(new URL("/auth/signin?error=VerificationFailed", request.url))
  }
}
