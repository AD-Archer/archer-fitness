import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { logger } from "@/lib/logger"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify that the user still exists in the database
    const userExists = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true }
    })
    
    if (!userExists) {
      return NextResponse.json(
        { error: "User session is invalid. Please sign in again." },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const muscleId = searchParams.get("muscleId")
    const equipmentId = searchParams.get("equipmentId")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    // Get user's custom exercises
    const userExercises = await prisma.exercise.findMany({
      where: {
        userId: session.user.id,
        ...(search && {
          name: {
            contains: search,
            mode: 'insensitive'
          }
        }),
      },
      select: {
        id: true,
        name: true,
        description: true,
        instructions: true,
        gifUrl: true,
        bodyParts: {
          include: {
            bodyPart: true
          }
        },
        muscles: {
          include: {
            muscle: true
          }
        },
        equipments: {
          include: {
            equipment: true
          }
        }
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: limit,
      skip: offset,
    })

    // Build where clause for predefined exercises
    const whereClause: Prisma.ExerciseFindManyArgs['where'] = {
      isPredefined: true,
      ...(search && {
        name: {
          contains: search,
          mode: 'insensitive'
        }
      }),
    }

    // Add filters based on the new schema relationships
    if (muscleId) {
      whereClause.muscles = {
        some: {
          muscleId: muscleId
        }
      }
    }

    if (equipmentId) {
      whereClause.equipments = {
        some: {
          equipmentId: equipmentId
        }
      }
    }

    // Get predefined exercises with relationships
    const predefinedExercises = await prisma.exercise.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        description: true,
        instructions: true,
        gifUrl: true,
        bodyParts: {
          include: {
            bodyPart: true
          }
        },
        muscles: {
          include: {
            muscle: true
          }
        },
        equipments: {
          include: {
            equipment: true
          }
        }
      },
      orderBy: {
        name: "asc",
      },
      take: limit,
      skip: offset,
    })

    return NextResponse.json({
      userExercises,
      predefinedExercises,
    })
  } catch (error) {
    logger.error("Error fetching exercises:", error)
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

    // Verify that the user still exists in the database
    const userExists = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true }
    })
    
    if (!userExists) {
      return NextResponse.json(
        { error: "User session is invalid. Please sign in again." },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, description, instructions, muscles, equipments } = body

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      )
    }

    // Create exercise with relationships
    const exercise = await prisma.exercise.create({
      data: {
        userId: session.user.id,
        name,
        description,
        instructions,
        // Create relationships if provided
        ...(muscles && muscles.length > 0 && {
          muscles: {
            create: muscles.map((muscle: { muscleId: string, isPrimary?: boolean }) => ({
              muscleId: muscle.muscleId,
              isPrimary: muscle.isPrimary || false
            }))
          }
        }),
        ...(equipments && equipments.length > 0 && {
          equipments: {
            create: equipments.map((equipmentId: string) => ({
              equipmentId
            }))
          }
        })
      },
      include: {
        muscles: {
          include: {
            muscle: true
          }
        },
        equipments: {
          include: {
            equipment: true
          }
        }
      }
    })

    return NextResponse.json(exercise, { status: 201 })
  } catch (error) {
    logger.error("Error creating exercise:", error)
    return NextResponse.json(
      { error: "Failed to create exercise" },
      { status: 500 }
    )
  }
}
