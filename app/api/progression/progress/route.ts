import { NextResponse, NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"
import type { NodeStatus } from "@/lib/progression/types"
import { generateAlias } from "@/lib/progression/aliases"

const statusMap: Record<NodeStatus, "LOCKED" | "AVAILABLE" | "COMPLETED"> = {
  locked: "LOCKED",
  available: "AVAILABLE",
  completed: "COMPLETED",
}

const ensureProfile = async (userId: string) => {
  const existing = await prisma.progressionProfile.findUnique({ where: { userId } })
  if (existing) return existing
  return prisma.progressionProfile.create({
    data: {
      userId,
      alias: generateAlias(userId),
    },
  })
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const [records, profile] = await Promise.all([
      prisma.progressionNodeProgress.findMany({
        where: { userId: session.user.id },
      }),
      ensureProfile(session.user.id),
    ])

    return NextResponse.json({
      profile,
      records,
    })
  } catch (error) {
    logger.error("Error fetching progression progress", error)
    return NextResponse.json({ error: "Failed to load progression" }, { status: 500 })
  }
}

interface ProgressPayload {
  nodeId: string
  status: NodeStatus
  completionCount: number
  xpEarned?: number
  lastCompletedAt?: string | null
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = (await request.json()) as ProgressPayload[]
    if (!Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    const operations = body
      .filter((item) => item?.nodeId)
      .map(async (item) => {
        const safeCount = Math.max(0, Math.floor(item.completionCount || 0))
        const prismaStatus = statusMap[item.status] ?? "LOCKED"
        const xpEarned = Math.max(0, Math.floor(item.xpEarned || 0))
        const lastCompletedAt = item.lastCompletedAt ? new Date(item.lastCompletedAt) : null

        await prisma.progressionNodeProgress.upsert({
          where: {
            userId_nodeId: {
              userId: session.user.id,
              nodeId: item.nodeId,
            },
          },
          create: {
            userId: session.user.id,
            nodeId: item.nodeId,
            status: prismaStatus,
            completionCount: safeCount,
            xpEarned,
            lastCompletedAt,
          },
          update: {
            status: prismaStatus,
            completionCount: safeCount,
            xpEarned,
            lastCompletedAt,
          },
        })
      })

    await Promise.all(operations)

    const progressRecords = await prisma.progressionNodeProgress.findMany({
      where: { userId: session.user.id },
    })

    const crowns = progressRecords.filter((record) => record.status === "COMPLETED").length
    const totalXp = progressRecords.reduce((sum, record) => sum + (record.xpEarned ?? 0), 0)

    await prisma.progressionProfile.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        alias: generateAlias(session.user.id),
        crowns,
        totalXp,
      },
      update: {
        crowns,
        totalXp,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    logger.error("Error saving progression progress", error)
    return NextResponse.json({ error: "Failed to save progression" }, { status: 500 })
  }
}
