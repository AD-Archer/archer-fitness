import { NextResponse, NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import * as OTPAuth from "otpauth"
import { z } from "zod"

const authenticateSchema = z.object({
  email: z.string().email(),
  code: z.string().min(6),
  isBackupCode: z.boolean().optional().default(false),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, code, isBackupCode } = authenticateSchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { email },
      select: { 
        id: true, 
        email: true,
        twoFactorSecret: true,
        twoFactorEnabled: true,
        twoFactorBackupCodes: true,
      },
    })

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    let isValid = false

    if (isBackupCode) {
      // Check if code is a valid backup code
      const codeIndex = user.twoFactorBackupCodes.indexOf(code.toUpperCase())
      if (codeIndex !== -1) {
        isValid = true
        // Remove used backup code
        const updatedCodes = [...user.twoFactorBackupCodes]
        updatedCodes.splice(codeIndex, 1)
        await prisma.user.update({
          where: { id: user.id },
          data: { twoFactorBackupCodes: updatedCodes },
        })
      }
    } else {
      // Verify TOTP code
      const totp = new OTPAuth.TOTP({
        algorithm: "SHA1",
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(user.twoFactorSecret),
      })

      const delta = totp.validate({ token: code, window: 1 })
      isValid = delta !== null
    }

    if (!isValid) {
      return NextResponse.json({ error: "Invalid code" }, { status: 401 })
    }

    return NextResponse.json({ 
      success: true,
      userId: user.id,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: "Authentication failed" }, { status: 500 })
  }
}
