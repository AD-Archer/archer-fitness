import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

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
        twoFactorEnabled: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (!user.twoFactorEnabled) {
      return NextResponse.json({ error: "Two-factor authentication is not enabled" }, { status: 400 })
    }

    // Disable 2FA and clear secrets
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
      },
    })

    return NextResponse.json({ 
      success: true,
      message: "Two-factor authentication disabled successfully" 
    })
  } catch {
    return NextResponse.json({ error: "Failed to disable two-factor authentication" }, { status: 500 })
  }
}
