import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

// GET /api/schedule - Get schedules for a user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const weekStart = searchParams.get('weekStart')

    if (!weekStart) {
      return NextResponse.json({ error: "weekStart parameter is required" }, { status: 400 })
    }

    const weekStartDate = new Date(weekStart)
    
    // Get or create schedule for the week
    let schedule = await prisma.schedule.findUnique({
      where: {
        userId_weekStart: {
          userId: session.user.id,
          weekStart: weekStartDate
        }
      },
      include: {
        items: {
          orderBy: [
            { day: 'asc' },
            { startTime: 'asc' }
          ]
        }
      }
    })

    if (!schedule) {
      // Create empty schedule for the week
      schedule = await prisma.schedule.create({
        data: {
          userId: session.user.id,
          weekStart: weekStartDate
        },
        include: {
          items: true
        }
      })
    }

    return NextResponse.json({ schedule })

  } catch (error) {
    console.error('Error fetching schedule:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/schedule - Create or update a schedule
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { weekStart, items } = body

    if (!weekStart) {
      return NextResponse.json({ error: "weekStart is required" }, { status: 400 })
    }

    const weekStartDate = new Date(weekStart)

    // Get or create schedule
    let schedule = await prisma.schedule.findUnique({
      where: {
        userId_weekStart: {
          userId: session.user.id,
          weekStart: weekStartDate
        }
      }
    })

    if (!schedule) {
      schedule = await prisma.schedule.create({
        data: {
          userId: session.user.id,
          weekStart: weekStartDate
        }
      })
    }

    // Update schedule items
    if (items && Array.isArray(items)) {
      // Delete existing items
      await prisma.scheduleItem.deleteMany({
        where: { scheduleId: schedule.id }
      })

      // Create new items
      if (items.length > 0) {
        await prisma.scheduleItem.createMany({
          data: items.map((item: {
            type: string;
            title: string;
            description?: string;
            startTime: string;
            endTime: string;
            day: number;
            category?: string;
            calories?: number;
            difficulty?: string;
            duration?: number;
            isFromGenerator?: boolean;
            generatorData?: object;
          }) => ({
            scheduleId: schedule.id,
            type: item.type,
            title: item.title,
            description: item.description,
            startTime: item.startTime,
            endTime: item.endTime,
            day: item.day,
            category: item.category,
            calories: item.calories,
            difficulty: item.difficulty,
            duration: item.duration,
            isFromGenerator: item.isFromGenerator || false,
            generatorData: item.generatorData
          }))
        })
      }
    }

    // Return updated schedule with items
    const updatedSchedule = await prisma.schedule.findUnique({
      where: { id: schedule.id },
      include: {
        items: {
          orderBy: [
            { day: 'asc' },
            { startTime: 'asc' }
          ]
        }
      }
    })

    return NextResponse.json({ schedule: updatedSchedule })

  } catch (error) {
    console.error('Error saving schedule:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/schedule - Clear a week's schedule
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const weekStart = searchParams.get('weekStart')

    if (!weekStart) {
      return NextResponse.json({ error: "weekStart parameter is required" }, { status: 400 })
    }

    const weekStartDate = new Date(weekStart)
    
    // Find and delete schedule items
    const schedule = await prisma.schedule.findUnique({
      where: {
        userId_weekStart: {
          userId: session.user.id,
          weekStart: weekStartDate
        }
      }
    })

    if (schedule) {
      await prisma.scheduleItem.deleteMany({
        where: { scheduleId: schedule.id }
      })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error clearing schedule:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}