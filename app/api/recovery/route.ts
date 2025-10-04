import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"
import {
  formatBodyPartLabel,
  getRecoveryStatusFromHours,
  getRestWindowHours,
  normalizeBodyPartKey,
} from "@/lib/recovery-guidelines"
import type {
  BodyPartInsight,
  RecoveryApiResponse,
  RecoveryFeeling,
  RecoverySummary,
} from "@/types/recovery"

const HOURS_IN_MS = 1000 * 60 * 60
const DAYS_LOOKBACK = 30
const SEVEN_DAYS_MS = 7 * 24 * HOURS_IN_MS

const feelingEnum = z.enum(["GOOD", "TIGHT", "SORE", "INJURED"] as const)

const feedbackSchema = z.object({
  bodyPart: z.string().min(1),
  feeling: feelingEnum,
  intensity: z
    .number()
    .min(0)
    .max(10)
    .optional(),
  note: z
    .string()
    .max(300)
    .optional()
    .transform((value) => value?.trim() || undefined),
})

function calculateHoursSince(date: Date | null, now: Date): number | null {
  if (!date) {
    return null
  }

  return Math.max(0, (now.getTime() - date.getTime()) / HOURS_IN_MS)
}

type PrismaFeedbackRecord = {
  id: string
  userId: string
  bodyPart: string
  feeling: RecoveryFeeling
  intensity: number | null
  note: string | null
  createdAt: Date
}

async function buildRecoveryResponse(userId: string): Promise<RecoveryApiResponse> {
  const now = new Date()
  const sinceDate = new Date(now.getTime() - DAYS_LOOKBACK * 24 * HOURS_IN_MS)
  const sevenDaysAgo = new Date(now.getTime() - SEVEN_DAYS_MS)

  const [sessions, feedbackEntries] = await Promise.all([
    prisma.workoutSession.findMany({
      where: {
        userId,
        isArchived: false,
        startTime: {
          gte: sinceDate,
        },
      },
      include: {
        exercises: {
          include: {
            exercise: {
              include: {
                bodyParts: {
                  include: {
                    bodyPart: true,
                  },
                },
              },
            },
            sets: true,
          },
        },
      },
      orderBy: {
        startTime: "desc",
      },
      take: 60,
    }),
    prisma.recoveryFeedback.findMany({
      where: { userId },
      orderBy: {
        createdAt: "desc",
      },
    }) as Promise<PrismaFeedbackRecord[]>,
  ])

  const latestFeedbackByPart = new Map(
    feedbackEntries.map((entry) => [normalizeBodyPartKey(entry.bodyPart), entry])
  )

  type InternalAggregate = {
    bodyPart: string
    displayName: string
    lastWorkout: Date | null
    totalSets: number
    sessionIds: Set<string>
    sevenDaySessions: Set<string>
    trend: Map<string, number>
  }

  const bodyPartAggregates = new Map<string, InternalAggregate>()
  const recentSessions: RecoveryApiResponse["recentSessions"] = []

  for (const session of sessions) {
    const performedAt = session.endTime ?? session.startTime
    if (!performedAt) {
      continue
    }

    const sessionBodyParts = new Set<string>()
    const sessionTrendKey = performedAt.toISOString().split("T")[0]

    for (const sessionExercise of session.exercises) {
      const bodyPartNames = sessionExercise.exercise.bodyParts.length
        ? sessionExercise.exercise.bodyParts.map(
            (bp: { bodyPart: { name: string } }) => bp.bodyPart.name
          )
        : ["fullbody"]

      const setCount = sessionExercise.sets?.length || sessionExercise.targetSets || 1

      for (const rawName of bodyPartNames) {
        const key = normalizeBodyPartKey(rawName)
        const displayName = formatBodyPartLabel(rawName)
        sessionBodyParts.add(displayName)

        if (!bodyPartAggregates.has(key)) {
          bodyPartAggregates.set(key, {
            bodyPart: key,
            displayName,
            lastWorkout: performedAt,
            totalSets: setCount,
            sessionIds: new Set([session.id]),
            sevenDaySessions: performedAt >= sevenDaysAgo ? new Set([session.id]) : new Set(),
            trend: new Map([[sessionTrendKey, setCount]]),
          })
          continue
        }

        const aggregate = bodyPartAggregates.get(key)!
        aggregate.lastWorkout = aggregate.lastWorkout
          ? new Date(Math.max(aggregate.lastWorkout.getTime(), performedAt.getTime()))
          : performedAt
        aggregate.totalSets += setCount
        aggregate.sessionIds.add(session.id)
        if (performedAt >= sevenDaysAgo) {
          aggregate.sevenDaySessions.add(session.id)
        }
        aggregate.trend.set(
          sessionTrendKey,
          (aggregate.trend.get(sessionTrendKey) ?? 0) + setCount
        )
      }
    }

    recentSessions.push({
      id: session.id,
      name: session.name,
      performedAt: performedAt.toISOString(),
      bodyParts: Array.from(sessionBodyParts),
      durationMinutes: session.duration ? Math.round(session.duration / 60) : null,
    })
  }

  for (const [key, feedback] of latestFeedbackByPart.entries()) {
    if (!bodyPartAggregates.has(key)) {
      bodyPartAggregates.set(key, {
        bodyPart: key,
        displayName: formatBodyPartLabel(feedback.bodyPart),
        lastWorkout: null,
        totalSets: 0,
        sessionIds: new Set(),
        sevenDaySessions: new Set(),
        trend: new Map(),
      })
    }
  }

  const bodyParts: BodyPartInsight[] = Array.from(bodyPartAggregates.values()).map((aggregate) => {
    const feedback = latestFeedbackByPart.get(aggregate.bodyPart)
    const restWindowHours = getRestWindowHours(aggregate.bodyPart)
    const hoursSinceLast = calculateHoursSince(aggregate.lastWorkout, now)
    const status = getRecoveryStatusFromHours(
      hoursSinceLast,
      restWindowHours,
      Boolean(feedback && feedback.feeling !== "GOOD")
    )

    return {
      bodyPart: aggregate.displayName,
      lastWorkout: aggregate.lastWorkout ? aggregate.lastWorkout.toISOString() : null,
      hoursSinceLast,
      recommendedRestHours: restWindowHours,
      status,
      recentSessionIds: Array.from(aggregate.sessionIds),
      sevenDayCount: aggregate.sevenDaySessions.size,
      averageSets:
        aggregate.sessionIds.size > 0 ? Number((aggregate.totalSets / aggregate.sessionIds.size).toFixed(1)) : 0,
      feedback: feedback
        ? {
            bodyPart: formatBodyPartLabel(feedback.bodyPart),
            feeling: feedback.feeling,
            intensity: feedback.intensity,
            note: feedback.note,
            createdAt: feedback.createdAt.toISOString(),
          }
        : null,
      trend: Array.from(aggregate.trend.entries())
        .sort(([a], [b]) => (a < b ? -1 : 1))
        .map(([date, volume]) => ({ date, volume })),
    }
  })

  bodyParts.sort((a, b) => {
    if (a.status === b.status) {
      const aHours = a.hoursSinceLast ?? 0
      const bHours = b.hoursSinceLast ?? 0
      return bHours - aHours
    }
    const order = { ready: 0, caution: 1, rest: 2, pain: 3 }
    return order[a.status] - order[b.status]
  })

  const summary: RecoverySummary = bodyParts.reduce(
    (acc, part) => {
      acc[`${part.status}Count` as const] = acc[`${part.status}Count` as const] + 1

      if (part.status === "ready") {
        acc.suggestedFocus.push(part.bodyPart)
      } else if (part.status === "pain" && part.feedback) {
        acc.painAlerts.push(part.bodyPart)
      }

      if (part.status === "rest" || part.status === "caution") {
        const remaining = Math.max(
          0,
          part.recommendedRestHours - (part.hoursSinceLast ?? 0)
        )
        acc.nextEligibleInHours.push({
          bodyPart: part.bodyPart,
          remainingHours: Number(remaining.toFixed(1)),
        })
      }

      return acc
    },
    {
      readyCount: 0,
      cautionCount: 0,
      restCount: 0,
      painCount: 0,
      suggestedFocus: [] as string[],
      nextEligibleInHours: [] as Array<{ bodyPart: string; remainingHours: number }>,
      painAlerts: [] as string[],
      lastUpdated: now.toISOString(),
    }
  )

  summary.suggestedFocus = summary.suggestedFocus.slice(0, 5)
  summary.nextEligibleInHours.sort((a, b) => a.remainingHours - b.remainingHours)

  return {
    summary,
    bodyParts,
    recentSessions: recentSessions.slice(0, 6),
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await buildRecoveryResponse(session.user.id)
    return NextResponse.json(payload)
  } catch (error) {
    logger.error("GET /api/recovery failed", error)
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
    const entries = Array.isArray(body) ? body : [body]

    if (!entries.length) {
      return NextResponse.json({ error: "No feedback provided" }, { status: 400 })
    }

    const parsedEntries: z.infer<typeof feedbackSchema>[] = []

    for (const entry of entries) {
      const result = feedbackSchema.safeParse(entry)
      if (result.success) {
        parsedEntries.push(result.data)
      }
    }

    if (!parsedEntries.length) {
      return NextResponse.json({ error: "Invalid feedback payload" }, { status: 400 })
    }

    await prisma.recoveryFeedback.createMany({
      data: parsedEntries.map((data) => ({
        userId: session.user.id,
        bodyPart: normalizeBodyPartKey(String(data.bodyPart)),
        feeling: data.feeling,
        intensity: data.intensity ?? null,
        note: data.note,
      })),
    })

    logger.info("Recovery feedback saved", {
      userId: session.user.id,
      count: parsedEntries.length,
    })

    const refreshed = await buildRecoveryResponse(session.user.id)
    return NextResponse.json(refreshed)
  } catch (error) {
    logger.error("POST /api/recovery failed", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
