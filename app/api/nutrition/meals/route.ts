import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Prisma, Food } from "@prisma/client"

interface IngredientInput {
  foodId: string
  quantity: string | number
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const limit = parseInt(searchParams.get("limit") || "50")

    // Get both user's meals and public meals from other users
    const where: Prisma.MealWhereInput = {
      OR: [
        { userId: session.user.id }, // User's meals
        { isPublic: true } // Public meals from other users
      ]
    }

    if (search) {
      where.name = {
        contains: search,
        mode: "insensitive"
      }
    }

    const meals = await prisma.meal.findMany({
      where,
      include: {
        ingredients: {
          include: {
            food: true
          }
        },
        user: {
          select: {
            name: true
          }
        }
      },
      orderBy: [
        { createdAt: "desc" }
      ],
      take: limit
    })

    return NextResponse.json(meals)
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
    const { name, description, ingredients, isPublic } = body

    // Validate required fields
    if (!name || !ingredients || ingredients.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Calculate totals from ingredients
    let totalCalories = 0
    let totalProtein = 0
    let totalCarbs = 0
    let totalFat = 0
    let totalFiber = 0
    let totalSugar = 0
    let totalSodium = 0

    // First, get all the food items
    const foodIds = ingredients.map((ing: IngredientInput) => ing.foodId)
    const foods = await prisma.food.findMany({
      where: {
        id: { in: foodIds }
      }
    })

    const foodMap = foods.reduce((map, food) => {
      map[food.id] = food
      return map
    }, {} as Record<string, Food>)

    // Calculate totals
    for (const ingredient of ingredients) {
      const food = foodMap[ingredient.foodId]
      if (food) {
        const quantity = parseFloat(ingredient.quantity)
        totalCalories += food.calories * quantity
        totalProtein += food.protein * quantity
        totalCarbs += food.carbs * quantity
        totalFat += food.fat * quantity
        if (food.fiber) totalFiber += food.fiber * quantity
        if (food.sugar) totalSugar += food.sugar * quantity
        if (food.sodium) totalSodium += food.sodium * quantity
      }
    }

    // Create the meal
    const meal = await prisma.meal.create({
      data: {
        name,
        description,
        totalCalories,
        totalProtein,
        totalCarbs,
        totalFat,
        totalFiber: totalFiber || null,
        totalSugar: totalSugar || null,
        totalSodium: totalSodium || null,
        isPublic: isPublic || false,
        userId: session.user.id,
        ingredients: {
          create: ingredients.map((ing: IngredientInput) => ({
            foodId: ing.foodId,
            quantity: parseFloat(ing.quantity.toString())
          }))
        }
      },
      include: {
        ingredients: {
          include: {
            food: true
          }
        }
      }
    })

    return NextResponse.json(meal, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
