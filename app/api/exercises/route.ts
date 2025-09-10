import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const muscleGroup = searchParams.get("muscleGroup")
    const equipment = searchParams.get("equipment")
    const limit = parseInt(searchParams.get("limit") || "50")

    // Get user's custom exercises
    const userExercises = await prisma.exercise.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        updatedAt: "desc",
      },
    })

    // Get predefined exercises
    const predefinedExercises = await prisma.exercise.findMany({
      where: {
        isPredefined: true,
        ...(category && { category }),
        ...(muscleGroup && { muscleGroup }),
        ...(equipment && { equipment }),
      },
      orderBy: {
        name: "asc",
      },
      take: limit,
    })

    return NextResponse.json({
      userExercises,
      predefinedExercises,
    })
  } catch (error) {
    console.error("Error fetching exercises:", error)
    return NextResponse.json(
      { error: "Failed to fetch exercises" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, category, muscleGroup, equipment, instructions } = body

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      )
    }

    const exercise = await prisma.exercise.create({
      data: {
        userId: session.user.id,
        name,
        description,
        category,
        muscleGroup,
        equipment,
        instructions,
      },
    })

    return NextResponse.json(exercise, { status: 201 })
  } catch (error) {
    console.error("Error creating exercise:", error)
    return NextResponse.json(
      { error: "Failed to create exercise" },
      { status: 500 }
    )
  }
}
