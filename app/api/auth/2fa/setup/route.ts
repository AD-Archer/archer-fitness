import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import * as OTPAuth from "otpauth"
import QRCode from "qrcode"
import crypto from "crypto"

export async function POST() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        id: true, 
        email: true, 
        name: true,
        twoFactorEnabled: true,
        twoFactorSecret: true 
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // If 2FA is already enabled, don't allow re-setup
    if (user.twoFactorEnabled) {
      return NextResponse.json({ 
        error: "Two-factor authentication is already enabled. Disable it first to reset." 
      }, { status: 400 })
    }

    // Generate a new secret
    const secret = new OTPAuth.Secret({ size: 20 })
    const totp = new OTPAuth.TOTP({
      issuer: "Archer Fitness",
      label: user.email || user.name || "User",
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: secret,
    })

    const otpauthUrl = totp.toString()

    // Generate QR code
    const qrCode = await QRCode.toDataURL(otpauthUrl)

    // Generate backup codes (10 codes)
    const backupCodes = Array.from({ length: 10 }, () => 
      crypto.randomBytes(4).toString("hex").toUpperCase()
    )

    // Store the secret temporarily (it will be confirmed when user verifies the code)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorSecret: secret.base32,
        twoFactorBackupCodes: backupCodes,
        twoFactorEnabled: false, // Not enabled until verified
      },
    })

    return NextResponse.json({
      secret: secret.base32,
      qrCode,
      backupCodes,
    })
  } catch (error) {
    console.error("2FA setup error:", error)
    return NextResponse.json({ error: "Failed to setup two-factor authentication" }, { status: 500 })
  }
}
