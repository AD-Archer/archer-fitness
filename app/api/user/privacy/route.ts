"use server"

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { logger } from "@/lib/logger"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        privacyAccepted: true,
        privacyAcceptedAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      privacyAccepted: (user as any).privacyAccepted,
      privacyAcceptedAt: (user as any).privacyAcceptedAt,
    })
  } catch (error) {
    logger.error("Error checking privacy acceptance:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { accepted } = await request.json()

    if (typeof accepted !== "boolean") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        privacyAccepted: accepted,
        privacyAcceptedAt: accepted ? new Date() : null,
      },
      select: {
        privacyAccepted: true,
        privacyAcceptedAt: true,
      },
    })

    return NextResponse.json({
      privacyAccepted: (user as any).privacyAccepted,
      privacyAcceptedAt: (user as any).privacyAcceptedAt,
    })
  } catch (error) {
    logger.error("Error updating privacy acceptance:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}