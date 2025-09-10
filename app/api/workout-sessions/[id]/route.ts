import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const workoutSession = await prisma.workoutSession.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        workoutTemplate: true,
        exercises: {
          include: {
            exercise: true,
            sets: {
              orderBy: {
                setNumber: "asc",
              },
            },
          },
          orderBy: {
            order: "asc",
          },
        },
      },
    })

    if (!workoutSession) {
      return NextResponse.json({ error: "Workout session not found" }, { status: 404 })
    }

    return NextResponse.json(workoutSession)
  } catch (error) {
    console.error("Error fetching workout session:", error)
    return NextResponse.json(
      { error: "Failed to fetch workout session" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { status, endTime, duration, notes } = body

    const workoutSession = await prisma.workoutSession.update({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      data: {
        status,
        endTime: endTime ? new Date(endTime) : undefined,
        duration,
        notes,
        updatedAt: new Date(),
      },
      include: {
        workoutTemplate: true,
        exercises: {
          include: {
            exercise: true,
            sets: {
              orderBy: {
                setNumber: "asc",
              },
            },
          },
          orderBy: {
            order: "asc",
          },
        },
      },
    })

    return NextResponse.json(workoutSession)
  } catch (error) {
    console.error("Error updating workout session:", error)
    return NextResponse.json(
      { error: "Failed to update workout session" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await prisma.workoutSession.delete({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    return NextResponse.json({ message: "Workout session deleted successfully" })
  } catch (error) {
    console.error("Error deleting workout session:", error)
    return NextResponse.json(
      { error: "Failed to delete workout session" },
      { status: 500 }
    )
  }
}
