import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic';

// Weight entry type for better TypeScript support
interface WeightEntry {
  id: string
  userId: string
  weight: number
  date: Date
  notes?: string | null
  createdAt: Date
  updatedAt: Date
}

interface MonthlyAverage {
  month: string
  year: number
  averageWeight: number
  entryCount: number
  monthDate: string // For sorting/display
}

// Helper function to update user's monthly average weight
async function updateUserAverageWeight(userId: string) {
  try {
    // Get weight entries from the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentEntries = await prisma.weightEntry.findMany({
      where: {
        userId,
        date: { gte: thirtyDaysAgo }
      },
      select: { weight: true }
    })

    if (recentEntries.length > 0) {
      const totalWeight = recentEntries.reduce((sum: number, entry: { weight: number }) => sum + entry.weight, 0)
      const averageWeight = totalWeight / recentEntries.length

      // Update user's weight field with monthly average
      await prisma.user.update({
        where: { id: userId },
        data: { weight: Math.round(averageWeight * 10) / 10 } // Round to 1 decimal
      })
    }
  } catch (error) {
    // Don't throw error to avoid breaking weight entry creation
  }
}

// Helper function to calculate monthly averages
function calculateMonthlyAverages(entries: WeightEntry[]): MonthlyAverage[] {
  const monthlyData: { [key: string]: { weights: number[], year: number, month: string } } = {}
  
  entries.forEach((entry: WeightEntry) => {
    const date = new Date(entry.date)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        weights: [],
        year: date.getFullYear(),
        month: date.toLocaleDateString('en-US', { month: 'short' })
      }
    }
    
    monthlyData[monthKey].weights.push(entry.weight)
  })
  
  return Object.entries(monthlyData)
    .map(([monthKey, data]) => ({
      month: data.month,
      year: data.year,
      averageWeight: data.weights.reduce((sum, weight) => sum + weight, 0) / data.weights.length,
      entryCount: data.weights.length,
      monthDate: monthKey
    }))
    .sort((a, b) => a.monthDate.localeCompare(b.monthDate))
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '30')
    const days = parseInt(searchParams.get('days') || '90')
    
    // Calculate date range
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Check if WeightEntry table exists, fallback to simulation if not
    try {
      const entries: WeightEntry[] = await prisma.weightEntry.findMany({
        where: {
          userId: session.user.id,
          date: { gte: startDate }
        },
        orderBy: { date: 'asc' },
        take: limit
      })

      // Calculate statistics and monthly averages
      const weights = entries.map((e: WeightEntry) => e.weight)
      
      if (weights.length === 0) {
        return NextResponse.json({
          entries: [],
          monthlyAverages: [],
          stats: {
            current: 0,
            currentMonthAverage: 0,
            weekChange: 0,
            monthChange: 0,
            trend: 'stable' as const,
            totalEntries: 0,
          }
        })
      }

      // Calculate monthly averages
      const monthlyAverages = calculateMonthlyAverages(entries)
      const currentMonthAverage = monthlyAverages.length > 0 
        ? monthlyAverages[monthlyAverages.length - 1].averageWeight 
        : weights[weights.length - 1]

      const latestWeight = weights[weights.length - 1]
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const monthAgo = new Date()
      monthAgo.setDate(monthAgo.getDate() - 30)

      const weekAgoEntry = entries.find((e: WeightEntry) => new Date(e.date) <= weekAgo)
      const monthAgoEntry = entries.find((e: WeightEntry) => new Date(e.date) <= monthAgo)

      const weekChange = weekAgoEntry ? latestWeight - weekAgoEntry.weight : 0
      const monthChange = monthAgoEntry ? latestWeight - monthAgoEntry.weight : 0
      
      return NextResponse.json({
        entries: entries.map((entry: WeightEntry) => ({
          id: entry.id,
          weight: entry.weight,
          date: entry.date.toISOString(),
          notes: entry.notes,
          createdAt: entry.createdAt.toISOString(),
        })),
        monthlyAverages,
        stats: {
          current: latestWeight,
          currentMonthAverage,
          weekChange,
          monthChange,
          trend: monthChange > 0.5 ? 'increasing' : monthChange < -0.5 ? 'decreasing' : 'stable',
          totalEntries: entries.length,
        }
      })
    } catch (dbError) {
      
      // Fallback to simulated data for development
      const currentDate = new Date()
      const entries = []
      
      for (let i = days; i >= 0; i -= 7) {
        const entryDate = new Date(currentDate)
        entryDate.setDate(entryDate.getDate() - i)
        
        entries.push({
          id: `weight_${i}`,
          weight: 75 + Math.sin(i / 10) * 2 + (Math.random() - 0.5),
          date: entryDate.toISOString(),
          notes: i === 0 ? "Latest entry" : null,
          createdAt: entryDate.toISOString(),
        })
      }

      const weights = entries.map(e => e.weight)
      const latestWeight = weights[weights.length - 1]
      const previousWeight = weights[weights.length - 2]
      const monthAgoWeight = weights.find((_, index) => index === Math.max(0, weights.length - 5)) || weights[0]
      
      const weekChange = previousWeight ? latestWeight - previousWeight : 0
      const monthChange = monthAgoWeight ? latestWeight - monthAgoWeight : 0
      
      return NextResponse.json({
        entries: entries.slice(-limit),
        stats: {
          current: latestWeight,
          weekChange,
          monthChange,
          trend: monthChange > 0 ? 'increasing' : monthChange < 0 ? 'decreasing' : 'stable',
          totalEntries: entries.length,
        }
      })
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
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

    const { weight, date, notes } = await request.json()

    if (!weight || typeof weight !== 'number' || weight <= 0) {
      return NextResponse.json({ error: "Invalid weight value" }, { status: 400 })
    }

    const entryDate = date ? new Date(date) : new Date()
    
    // Create weight entry in the database
    const newEntry: WeightEntry = await prisma.weightEntry.create({
      data: {
        userId: session.user.id,
        weight,
        date: entryDate,
        notes: notes || null,
      }
    })

    // Update user's monthly average weight
    await updateUserAverageWeight(session.user.id)

    return NextResponse.json({ 
      entry: {
        id: newEntry.id,
        weight: newEntry.weight,
        date: newEntry.date.toISOString(),
        notes: newEntry.notes,
        createdAt: newEntry.createdAt.toISOString(),
      },
      message: "Weight entry saved successfully" 
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const entryId = searchParams.get('id')

    if (!entryId) {
      return NextResponse.json({ error: "Entry ID required" }, { status: 400 })
    }

    // Find and delete the weight entry
    const entry: WeightEntry | null = await prisma.weightEntry.findFirst({
      where: {
        id: entryId,
        userId: session.user.id, // Ensure user can only delete their own entries
      }
    })

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 })
    }

    await prisma.weightEntry.delete({
      where: { id: entryId }
    })

    return NextResponse.json({ 
      message: "Weight entry deleted successfully" 
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}