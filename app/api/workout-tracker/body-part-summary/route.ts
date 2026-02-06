import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { subDays } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const timeRange = searchParams.get("timeRange") || "7days";

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate date range
    const now = new Date();
    const daysBack = timeRange === "30days" ? 30 : 7;
    const startDate = subDays(now, daysBack);

    // Fetch workout sessions in the time range
    const workoutSessions = await prisma.workoutSession.findMany({
      where: {
        userId: user.id,
        startTime: {
          gte: startDate,
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
          },
        },
      },
    });

    // Process and aggregate body part data
    const bodyPartMap = new Map<
      string,
      {
        name: string;
        intensity: "none" | "light" | "moderate" | "heavy";
        lastWorked?: string;
        sets?: number;
        sessionCount?: number;
      }
    >();

    for (const session of workoutSessions) {
      for (const exercise of session.exercises) {
        for (const bodyPartRelation of exercise.exercise.bodyParts) {
          const bodyPartName = bodyPartRelation.bodyPart.name;

          if (!bodyPartMap.has(bodyPartName)) {
            bodyPartMap.set(bodyPartName, {
              name: bodyPartName,
              intensity: "none",
              sets: 0,
              sessionCount: 0,
            });
          }

          const data = bodyPartMap.get(bodyPartName)!;
          data.sets = (data.sets || 0) + exercise.completedSets;
          data.sessionCount = (data.sessionCount || 0) + 1;
          data.lastWorked = session.startTime.toISOString();

          // Calculate intensity based on sets and frequency
          const intensity =
            (data.sets || 0) > 15
              ? "heavy"
              : (data.sets || 0) > 9
                ? "moderate"
                : "light";
          data.intensity = intensity as "light" | "moderate" | "heavy";
        }
      }
    }

    const bodyParts = Array.from(bodyPartMap.values());

    return NextResponse.json(
      {
        success: true,
        bodyParts,
        timeRange,
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch body part summary" },
      { status: 500 },
    );
  }
}
