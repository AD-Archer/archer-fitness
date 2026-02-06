import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { Prisma } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const category = searchParams.get("category")
    const limit = parseInt(searchParams.get("limit") || "50")
    const checkDuplicates = searchParams.get("checkDuplicates") === "true"

    // Get both global foods, user's custom foods, and public foods from other users
    const where: Prisma.FoodWhereInput = {
      OR: [
        { userId: null }, // Global foods
        { userId: session.user.id }, // User's custom foods
        { isPublic: true } // Public foods from other users
      ]
    }

    if (search) {
      where.name = {
        contains: search,
        mode: "insensitive"
      }
    }

    if (category) {
      where.category = category
    }

    // If checking for duplicates, return all matches for the search term
    if (checkDuplicates && search) {
      const duplicateFoods = await prisma.food.findMany({
        where: {
          name: {
            contains: search,
            mode: "insensitive"
          }
        },
        include: {
          user: {
            select: {
              name: true
            }
          }
        },
        orderBy: [
          { usageCount: "desc" }, // Most popular first
          { verified: "desc" },
          { name: "asc" }
        ],
        take: limit
      })

      return NextResponse.json({
        foods: duplicateFoods,
        isDuplicateCheck: true
      })
    }

    const foods = await prisma.food.findMany({
      where,
      include: {
        user: {
          select: {
            name: true
          }
        }
      },
      orderBy: [
        { usageCount: "desc" }, // Most popular first
        { verified: "desc" }, // Then verified foods
        { name: "asc" }
      ],
      take: limit
    })

    return NextResponse.json(foods)
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, brand, calories, protein, carbs, fat, fiber, sugar, sodium, servingSize, servingUnit, category, isPublic, checkDuplicates } = body

    // Validate required fields
    if (!name || calories === undefined || protein === undefined || carbs === undefined || fat === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check for duplicates if requested
    if (checkDuplicates) {
      const existingFoods = await prisma.food.findMany({
        where: {
          name: {
            contains: name,
            mode: "insensitive"
          }
        },
        include: {
          user: {
            select: {
              name: true
            }
          }
        },
        orderBy: [
          { usageCount: "desc" },
          { verified: "desc" },
          { name: "asc" }
        ],
        take: 10
      })

      if (existingFoods.length > 0) {
        return NextResponse.json({
          duplicates: existingFoods,
          message: "Similar foods found. Consider using an existing one or create a new one."
        }, { status: 200 })
      }
    }

    const food = await prisma.food.create({
      data: {
        name,
        brand,
        calories: parseFloat(calories),
        protein: parseFloat(protein),
        carbs: parseFloat(carbs),
        fat: parseFloat(fat),
        fiber: fiber ? parseFloat(fiber) : null,
        sugar: sugar ? parseFloat(sugar) : null,
        sodium: sodium ? parseFloat(sodium) : null,
        servingSize: parseFloat(servingSize || 100),
        servingUnit: servingUnit || "g",
        category,
        verified: false, // User-added foods are not verified by default
        isPublic: isPublic || false,
        userId: session.user.id,
        usageCount: 0
      }
    })

    return NextResponse.json(food, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
