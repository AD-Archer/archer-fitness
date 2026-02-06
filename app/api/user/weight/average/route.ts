import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export const dynamic = 'force-dynamic';

// Type for weight entry selection
interface WeightEntrySelect {
  weight: number
  date: Date
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30') // Default to 30 days for monthly average
    
    // Calculate date range
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    try {
      const entries: WeightEntrySelect[] = await prisma.weightEntry.findMany({
        where: {
          userId: session.user.id,
          date: { gte: startDate }
        },
        orderBy: { date: 'desc' },
        select: {
          weight: true,
          date: true
        }
      })

      if (entries.length === 0) {
        return NextResponse.json({
          averageWeight: null,
          entryCount: 0,
          periodDays: days,
          message: "No weight entries found for the specified period"
        })
      }

      // Calculate average weight over the period
      const totalWeight = entries.reduce((sum: number, entry: WeightEntrySelect) => sum + entry.weight, 0)
      const averageWeight = totalWeight / entries.length

      return NextResponse.json({
        averageWeight: Math.round(averageWeight * 10) / 10, // Round to 1 decimal place
        entryCount: entries.length,
        periodDays: days,
        oldestEntry: entries[entries.length - 1]?.date,
        newestEntry: entries[0]?.date,
      })
    } catch {
      return NextResponse.json({
        averageWeight: null,
        entryCount: 0,
        periodDays: days,
        message: "Weight tracking not available"
      })
    }
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}