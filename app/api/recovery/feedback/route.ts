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

    const feedback = await prisma.recoveryFeedback.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    })

    return NextResponse.json({ feedback })
  } catch (error) {
    console.error("Error fetching recovery feedback:", error)
    return NextResponse.json(
      { error: "Failed to fetch recovery feedback" },
      { status: 500 }
    )
  }
}
