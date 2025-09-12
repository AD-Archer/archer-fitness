import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const completedDays = await (prisma as any).completedDay.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: {
        date: 'desc'
      }
    })

    return NextResponse.json(completedDays)
  } catch (error) {
    logger.error('Error fetching completed days:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { date, dateMsLocal, status, notes } = await request.json()

    if (!date && !dateMsLocal) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 })
    }

    // Check if this day is already marked as completed
    // Normalize the date to start of day to ensure proper matching
    // Prefer local-midnight epoch from client to avoid UTC drift; fallback to provided date string
    const searchDate = dateMsLocal
      ? new Date(Number(dateMsLocal))
      : new Date(date)
    // Ensure we use local midnight
    searchDate.setHours(0, 0, 0, 0)

    const existingCompletedDay = await (prisma as any).completedDay.findFirst({
      where: {
        userId: session.user.id,
        date: {
          gte: searchDate,
          lt: new Date(searchDate.getTime() + 24 * 60 * 60 * 1000) // Next day
        }
      }
    })

    if (existingCompletedDay) {
      // Update existing record
      const updatedCompletedDay = await (prisma as any).completedDay.update({
        where: {
          id: existingCompletedDay.id
        },
        data: {
          status: status || 'completed',
          notes: notes || existingCompletedDay.notes,
          date: searchDate, // Use normalized date
          updatedAt: new Date()
        }
      })
      return NextResponse.json(updatedCompletedDay)
    } else {
      // Create new record
      const newCompletedDay = await (prisma as any).completedDay.create({
        data: {
          userId: session.user.id,
          date: searchDate, // Use normalized date
          status: status || 'completed',
          notes: notes || null
        }
      })
      return NextResponse.json(newCompletedDay)
    }
  } catch (error) {
    logger.error('Error creating/updating completed day:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { date, dateMsLocal } = await request.json()

    if (!date && !dateMsLocal) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 })
    }

    // Find and delete the completed day record
    // Normalize the date to start of day to ensure proper matching
    const searchDate = dateMsLocal
      ? new Date(Number(dateMsLocal))
      : new Date(date)
    searchDate.setHours(0, 0, 0, 0)

    const existingCompletedDay = await (prisma as any).completedDay.findFirst({
      where: {
        userId: session.user.id,
        date: {
          gte: searchDate,
          lt: new Date(searchDate.getTime() + 24 * 60 * 60 * 1000) // Next day
        }
      }
    })

    if (existingCompletedDay) {
      await (prisma as any).completedDay.delete({
        where: {
          id: existingCompletedDay.id
        }
      })
      return NextResponse.json({ message: 'Day marked as incomplete' })
    } else {
      return NextResponse.json({ error: 'Day not found' }, { status: 404 })
    }
  } catch (error) {
    logger.error('Error deleting completed day:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}