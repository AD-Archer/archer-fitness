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
    const days = parseInt(searchParams.get("days") || "7")
    const date = searchParams.get("date") // YYYY-MM-DD format

    let dateFilter = {}
    if (date) {
      // Parse the date in UTC to avoid timezone issues
      const year = parseInt(date.split('-')[0])
      const month = parseInt(date.split('-')[1]) - 1 // JavaScript months are 0-indexed
      const day = parseInt(date.split('-')[2])

      const startOfDay = new Date(Date.UTC(year, month, day, 0, 0, 0, 0))
      const endOfDay = new Date(Date.UTC(year, month, day, 23, 59, 59, 999))

      dateFilter = {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        }
      }
    } else {
      // Get data for the last N days
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      dateFilter = {
        date: {
          gte: startDate
        }
      }
    }

    const nutritionLogs = await prisma.nutritionLog.findMany({
      where: {
        userId: session.user.id,
        ...dateFilter,
      },
      orderBy: {
        date: "desc",
      },
    })

    // Calculate totals for the period
    const totalCalories = nutritionLogs.reduce((sum, log) => sum + log.calories, 0)
    const totalProtein = nutritionLogs.reduce((sum, log) => sum + log.protein, 0)
    const totalCarbs = nutritionLogs.reduce((sum, log) => sum + log.carbs, 0)
    const totalFat = nutritionLogs.reduce((sum, log) => sum + log.fat, 0)

    const averageCalories = nutritionLogs.length > 0 ? totalCalories / nutritionLogs.length : 0
    const averageProtein = nutritionLogs.length > 0 ? totalProtein / nutritionLogs.length : 0
    const averageCarbs = nutritionLogs.length > 0 ? totalCarbs / nutritionLogs.length : 0
    const averageFat = nutritionLogs.length > 0 ? totalFat / nutritionLogs.length : 0

    return NextResponse.json({
      logs: nutritionLogs,
      summary: {
        totalDays: nutritionLogs.length,
        totalCalories,
        totalProtein,
        totalCarbs,
        totalFat,
        averageCalories: Math.round(averageCalories),
        averageProtein: Math.round(averageProtein * 10) / 10,
        averageCarbs: Math.round(averageCarbs * 10) / 10,
        averageFat: Math.round(averageFat * 10) / 10,
      }
    })
  } catch (error) {
    console.error("Error fetching nutrition logs:", error)
    return NextResponse.json(
      { error: "Failed to fetch nutrition logs" },
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
    const { date, meals, calories, protein, carbs, fat } = body

    if (!date || !calories || protein === undefined || carbs === undefined || fat === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const logDate = new Date(date)

    const nutritionLog = await prisma.nutritionLog.create({
      data: {
        userId: session.user.id,
        date: logDate,
        meals: meals || {},
        calories: parseInt(calories),
        protein: parseFloat(protein),
        carbs: parseFloat(carbs),
        fat: parseFloat(fat),
      },
    })

    return NextResponse.json(nutritionLog, { status: 201 })
  } catch (error) {
    console.error("Error creating nutrition log:", error)
    return NextResponse.json(
      { error: "Failed to create nutrition log" },
      { status: 500 }
    )
  }
}