import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const body = await req.json()
    const { date, energyLevel, bodyParts, notes } = body

    // Create the daily check-in
    const checkIn = await prisma.dailyCheckIn.create({
      data: {
        userId: user.id,
        date: new Date(date),
        energyLevel,
        notes,
        bodyPartChecks: {
          create: bodyParts.map((bp: { bodyPart: string; soreness: number }) => ({
            bodyPart: bp.bodyPart,
            sorenessLevel: bp.soreness,
          })),
        },
      },
      include: {
        bodyPartChecks: true,
      },
    })

    return NextResponse.json(checkIn)
  } catch (error) {
    console.error("Error creating daily check-in:", error)
    return NextResponse.json(
      { error: "Failed to create check-in" },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { searchParams } = new URL(req.url)
    const days = parseInt(searchParams.get("days") || "30")

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const checkIns = await prisma.dailyCheckIn.findMany({
      where: {
        userId: user.id,
        date: {
          gte: startDate,
        },
      },
      include: {
        bodyPartChecks: true,
      },
      orderBy: {
        date: "desc",
      },
    })

    return NextResponse.json(checkIns)
  } catch (error) {
    console.error("Error fetching daily check-ins:", error)
    return NextResponse.json(
      { error: "Failed to fetch check-ins" },
      { status: 500 }
    )
  }
}
