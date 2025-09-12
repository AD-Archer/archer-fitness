import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
    
    const exerciseId = params.id
    if (!exerciseId) {
      return new NextResponse("Exercise ID is required", { status: 400 })
    }
    
    const userId = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    }).then(user => user?.id)
    
    if (!userId) {
      return new NextResponse("User not found", { status: 404 })
    }
    
    // Verify this is the user's custom exercise
    const exercise = await prisma.exercise.findUnique({
      where: { id: exerciseId },
      select: { isPredefined: true, userId: true }
    })
    
    if (!exercise) {
      return new NextResponse("Exercise not found", { status: 404 })
    }
    
    if (exercise.isPredefined || exercise.userId !== userId) {
      return new NextResponse("You can only delete your own custom exercises", { status: 403 })
    }
    
    await prisma.exercise.delete({
      where: { id: exerciseId }
    })
    
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    logger.error("[API] Error deleting custom exercise:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
