import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { logger } from "@/lib/logger"

export async function GET() {
  try {
    const bodyParts = await prisma.bodyPart.findMany({
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json(bodyParts)
  } catch (error) {
    logger.error("Error fetching body parts:", error)
    return NextResponse.json(
      { error: "Failed to fetch body parts" },
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

    const bodyPart = await prisma.bodyPart.create({
      data: {
        name: name.trim(),
      },
    })

    return NextResponse.json(bodyPart, { status: 201 })
  } catch (error) {
    logger.error("Error creating body part:", error)
    return NextResponse.json(
      { error: "Failed to create body part" },
      { status: 500 }
    )
  }
}
