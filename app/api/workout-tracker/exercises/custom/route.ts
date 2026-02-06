import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { logger } from "@/lib/logger"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
    
    const data = await req.json()
    const { name, description } = data
    
    if (!name?.trim()) {
      return new NextResponse("Exercise name is required", { status: 400 })
    }
    
    const userId = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    }).then((user: any) => user?.id)
    
    if (!userId) {
      return new NextResponse("User not found", { status: 404 })
    }
    
    const newExercise = await prisma.exercise.create({
      data: {
        name,
        description: description || "",
        isPredefined: false,
        isPublic: false,
        userId
      }
    })
    
    return NextResponse.json({
      id: newExercise.id,
      name: newExercise.name,
      description: newExercise.description,
      isCustom: true
    })
  } catch (error) {
    logger.error("[API] Error creating custom exercise:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
