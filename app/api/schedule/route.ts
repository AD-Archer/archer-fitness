import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { Prisma } from "@prisma/client"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { logger } from "@/lib/logger"

const MS_IN_DAY = 24 * 60 * 60 * 1000

const startOfDay = (date: Date) => {
  const normalized = new Date(date)
  normalized.setHours(0, 0, 0, 0)
  return normalized
}

const calculateDiffInDays = (target: Date, baseline: Date) => {
  return Math.floor((startOfDay(target).getTime() - startOfDay(baseline).getTime()) / MS_IN_DAY)
}

type PrismaRecurringItem = any

const expandRecurringItemForWeek = (
  item: PrismaRecurringItem,
  targetWeekStart: Date,
  weekKey: string
) => {
  const occurrences: Array<Omit<PrismaRecurringItem, "schedule"> & { id: string; originId: string; day: number; isVirtual: boolean }> = []

  const pattern = (item.repeatPattern || "weekly") as "daily" | "weekly" | "yearly"
  const interval = item.repeatInterval && item.repeatInterval > 0 ? item.repeatInterval : 1
  const originWeekStart = startOfDay(item.schedule.weekStart)
  const originOccurrenceDate = startOfDay(new Date(originWeekStart.getTime() + item.day * MS_IN_DAY))
  const targetWeekDayZero = startOfDay(targetWeekStart)

  if (targetWeekDayZero < originWeekStart) {
    return occurrences
  }

  const repeatEndsOn = item.repeatEndsOn ? startOfDay(item.repeatEndsOn) : null

  const createVirtual = (dayOfWeek: number, occurrenceDate: Date) => {
    if (repeatEndsOn && occurrenceDate > repeatEndsOn) {
      return
    }

    occurrences.push({
      ...item,
      id: `${item.id}-${weekKey}-${dayOfWeek}`,
      originId: item.id,
      day: dayOfWeek,
      isVirtual: true,
      isRecurring: true,
      repeatPattern: item.repeatPattern || null,
      repeatInterval: item.repeatInterval || null,
      repeatEndsOn: item.repeatEndsOn || null,
      repeatDaysOfWeek: item.repeatDaysOfWeek || null,
      recurrenceRule: item.recurrenceRule || null,
      scheduleId: item.scheduleId,
      schedule: undefined as unknown as never
    })
  }

  if (pattern === "weekly") {
    const diffDays = calculateDiffInDays(targetWeekDayZero, originWeekStart)
    const diffWeeks = Math.floor(diffDays / 7)
    if (diffWeeks < 0 || diffWeeks % interval !== 0) {
      return occurrences
    }

    const daysOfWeek = item.repeatDaysOfWeek && item.repeatDaysOfWeek.length > 0
      ? item.repeatDaysOfWeek
      : [item.day]

    daysOfWeek.forEach((dayOfWeek: number) => {
      const occurrenceDate = new Date(targetWeekDayZero)
      occurrenceDate.setDate(targetWeekDayZero.getDate() + dayOfWeek)
      createVirtual(dayOfWeek, occurrenceDate)
    })
  } else if (pattern === "daily") {
    for (let index = 0; index < 7; index++) {
      const occurrenceDate = new Date(targetWeekDayZero)
      occurrenceDate.setDate(targetWeekDayZero.getDate() + index)
      const totalDiffDays = calculateDiffInDays(occurrenceDate, originOccurrenceDate)
      if (totalDiffDays >= 0 && totalDiffDays % interval === 0) {
        createVirtual(index, occurrenceDate)
      }
    }
  } else if (pattern === "yearly") {
    for (let index = 0; index < 7; index++) {
      const occurrenceDate = new Date(targetWeekDayZero)
      occurrenceDate.setDate(targetWeekDayZero.getDate() + index)

      const yearsDiff = occurrenceDate.getFullYear() - originOccurrenceDate.getFullYear()
      if (yearsDiff < 0 || yearsDiff % interval !== 0) {
        continue
      }

      if (
        occurrenceDate.getMonth() === originOccurrenceDate.getMonth() &&
        occurrenceDate.getDate() === originOccurrenceDate.getDate()
      ) {
        createVirtual(index, occurrenceDate)
      }
    }
  }

  return occurrences
}

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
    
    logger.info('GET /api/schedule called:', { 
      userId: session.user.id,
      weekStart: weekStartDate.toISOString()
    })
    
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
      logger.info('No schedule found, creating empty schedule:', { userId: session.user.id, weekStart: weekStartDate })
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

    logger.info('Schedule retrieved:', { 
      scheduleId: schedule.id, 
      itemCount: schedule.items?.length 
    })

    const weekKey = weekStartDate.toISOString().split('T')[0]

    const normalizedBaseItems = (schedule.items || []).map((item) => ({
      ...item,
      originId: (item as any).originId || item.id,
      isVirtual: false,
      isRecurring: (item as any).isRecurring ?? false,
      repeatPattern: (item as any).repeatPattern || null,
      repeatInterval: (item as any).repeatInterval || null,
      repeatEndsOn: (item as any).repeatEndsOn || null,
      repeatDaysOfWeek: (item as any).repeatDaysOfWeek || null,
      recurrenceRule: (item as any).recurrenceRule || null,
    }))

    const existingSignatures = new Set(
      normalizedBaseItems.map((item) => `${item.title}-${item.startTime}-${item.day}`.toLowerCase())
    )

    const recurringCandidates = await prisma.scheduleItem.findMany({
      where: {
        schedule: {
          userId: session.user.id
        }
      },
      include: {
        schedule: {
          select: {
            weekStart: true
          }
        }
      }
    })

    const recurringItems = (recurringCandidates as PrismaRecurringItem[]).filter((item) => item.isRecurring)

    const virtualItems = recurringItems
      .flatMap((recurringItem) => {
        const occurrences = expandRecurringItemForWeek(recurringItem, weekStartDate, weekKey)
        return occurrences.filter((occurrence) => {
          if (!occurrence) return false
          const signature = `${occurrence.title}-${occurrence.startTime}-${occurrence.day}`.toLowerCase()
          if (existingSignatures.has(signature)) {
            return false
          }
          existingSignatures.add(signature)
          return true
        }).map((occurrence) => {
          const cleanedOccurrence = { ...occurrence }
          delete (cleanedOccurrence as any).schedule
          return cleanedOccurrence
        })
      })

    const combinedItems = [...normalizedBaseItems, ...virtualItems]
      .sort((a, b) => {
        if (a.day !== b.day) return a.day - b.day
        return a.startTime.localeCompare(b.startTime)
      })

    const scheduleTimezone = ((schedule as any).timezone as string | undefined) || 'UTC'

    const responseSchedule = {
      ...(schedule as any),
      timezone: scheduleTimezone,
      items: combinedItems
    }

    return NextResponse.json({ schedule: responseSchedule })

  } catch (error) {
    logger.error('Error fetching schedule:', error)
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
    const { weekStart, items, timezone } = body

    logger.info('POST /api/schedule called:', { 
      userId: session.user.id,
      weekStart, 
      itemCount: items?.length,
      timezone 
    })

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
      logger.info('Creating new schedule:', { userId: session.user.id, weekStart: weekStartDate })
      schedule = await prisma.schedule.create({
        data: {
          userId: session.user.id,
          weekStart: weekStartDate,
          timezone: timezone || 'UTC'
        }
      })
      logger.info('Schedule created:', { scheduleId: schedule.id })
    } else if (timezone && (schedule as any).timezone !== timezone) {
      logger.info('Updating schedule timezone:', { scheduleId: schedule.id, oldTimezone: (schedule as any).timezone, newTimezone: timezone })
      schedule = await prisma.schedule.update({
        where: { id: schedule.id },
        data: { timezone }
      })
    }

    // Update schedule items
    if (items && Array.isArray(items)) {
      // Delete existing items
      const deletedCount = await prisma.scheduleItem.deleteMany({
        where: { scheduleId: schedule.id }
      })
      logger.info('Deleted existing items:', { scheduleId: schedule.id, count: deletedCount.count })

      // Create new items
      if (items.length > 0) {
        logger.info('Creating new items:', { scheduleId: schedule.id, itemCount: items.length })
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
            isRecurring?: boolean;
            repeatPattern?: string | null;
            repeatInterval?: number | null;
            repeatEndsOn?: string | null;
            recurrenceRule?: Prisma.InputJsonValue | null;
            repeatDaysOfWeek?: number[] | null;
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
            generatorData: item.generatorData,
            isRecurring: item.isRecurring ?? false,
            repeatPattern: item.repeatPattern ?? null,
            repeatInterval: item.repeatInterval ?? null,
            repeatEndsOn: item.repeatEndsOn ? new Date(item.repeatEndsOn) : null,
            recurrenceRule: item.recurrenceRule ?? Prisma.JsonNull,
            repeatDaysOfWeek: item.repeatDaysOfWeek ?? undefined
          }))
        })
        logger.info('Items created successfully')
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

    logger.info('Schedule saved successfully:', { 
      scheduleId: schedule.id, 
      itemCount: updatedSchedule?.items?.length 
    })

    return NextResponse.json({ schedule: updatedSchedule })

  } catch (error) {
    logger.error('Error saving schedule:', error)
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
    logger.error('Error clearing schedule:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}