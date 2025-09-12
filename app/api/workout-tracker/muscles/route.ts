import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

export async function GET() {
  try {
    const muscles = await prisma.muscle.findMany({
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json(muscles)
  } catch (error) {
    logger.error("Error fetching muscles:", error)
    return NextResponse.json(
      { error: "Failed to fetch muscles" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name } = body

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      )
    }

    const muscle = await prisma.muscle.create({
      data: {
        name: name.trim(),
      },
    })

    return NextResponse.json(muscle, { status: 201 })
  } catch (error) {
    logger.error("Error creating muscle:", error)
    return NextResponse.json(
      { error: "Failed to create muscle" },
      { status: 500 }
    )
  }
}
