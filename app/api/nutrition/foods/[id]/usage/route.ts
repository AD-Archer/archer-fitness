import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { foodId } = await request.json()

    if (!foodId) {
      return NextResponse.json({ error: "Food ID is required" }, { status: 400 })
    }

    // Increment usage count for the food
    const updatedFood = await prisma.food.update({
      where: { id: foodId },
      data: {
        usageCount: {
          increment: 1
        }
      }
    })

    return NextResponse.json({ success: true, usageCount: updatedFood.usageCount })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
