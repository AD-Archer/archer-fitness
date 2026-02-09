import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";

function parseDateOnlyParam(dateStr: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!match) return null;

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);

  const date = new Date(Date.UTC(year, monthIndex, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== monthIndex ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}

function normalizeToUTCMidnight(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

// Helper to get day of week (0 = Sunday, 1 = Monday, etc.)
function getDayOfWeek(date: Date): number {
  return date.getUTCDay();
}

// Helper to add days to a date
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

// Helper to format date as YYYY-MM-DD
function formatDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export interface CalendarWorkout {
  date: string;
  dayOfWeek: number;
  dailyTemplateId: string | null;
  dailyTemplateName: string | null;
  workoutTemplateId: string | null;
  workoutTemplateName: string | null;
  workoutCategory: string | null;
  workoutDifficulty: string | null;
  startTime: string;
  duration: number;
  color: string;
  isRestDay: boolean;
  activeScheduleId: string;
  activeScheduleName: string | null;
}

// GET /api/schedule/calendar?start=YYYY-MM-DD&end=YYYY-MM-DD
// Returns all scheduled workouts for the given date range based on active schedules
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startParam = searchParams.get("start");
    const endParam = searchParams.get("end");

    if (!startParam || !endParam) {
      return NextResponse.json(
        { error: "start and end query parameters are required (YYYY-MM-DD)" },
        { status: 400 },
      );
    }

    const startDate = parseDateOnlyParam(startParam);
    const endDate = parseDateOnlyParam(endParam);

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Invalid date format. Use YYYY-MM-DD" },
        { status: 400 },
      );
    }

    if (endDate < startDate) {
      return NextResponse.json(
        { error: "End date must be after start date" },
        { status: 400 },
      );
    }

    // Limit range to 3 months max to prevent abuse
    const maxRange = 90;
    const daysDiff = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (daysDiff > maxRange) {
      return NextResponse.json(
        { error: `Date range cannot exceed ${maxRange} days` },
        { status: 400 },
      );
    }

    // Check if Prisma client has been regenerated with new models

    if (!(prisma as any).activeSchedule) {
      return NextResponse.json({
        workouts: [],
        startDate: startParam,
        endDate: endParam,
        totalDays: daysDiff + 1,
        activeScheduleCount: 0,
      });
    }

    // Get all active schedules for this user that overlap with the date range

    const activeSchedules = await (prisma as any).activeSchedule.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
        startDate: { lte: endDate },
        OR: [{ endDate: null }, { endDate: { gte: startDate } }],
      },
      include: {
        weeklyTemplate: {
          include: {
            days: {
              include: {
                dailyTemplate: {
                  include: {
                    workoutTemplate: {
                      select: {
                        id: true,
                        name: true,
                        category: true,
                        difficulty: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    // Build calendar entries
    const calendarWorkouts: CalendarWorkout[] = [];
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayOfWeek = getDayOfWeek(currentDate);
      const dateStr = formatDate(currentDate);

      for (const schedule of activeSchedules) {
        // Check if this date is within the schedule's active range
        const scheduleStart = normalizeToUTCMidnight(
          new Date(schedule.startDate),
        );
        const scheduleEnd = schedule.endDate
          ? normalizeToUTCMidnight(new Date(schedule.endDate))
          : null;

        if (currentDate < scheduleStart) continue;
        if (scheduleEnd && currentDate > scheduleEnd) continue;

        // Find the template day for this day of week
        const templateDay = schedule.weeklyTemplate.days.find(
          (d: { dayOfWeek: number }) => d.dayOfWeek === dayOfWeek,
        );

        if (templateDay) {
          const daily = templateDay.dailyTemplate;

          calendarWorkouts.push({
            date: dateStr,
            dayOfWeek,
            dailyTemplateId: daily?.id || null,
            dailyTemplateName: daily?.name || null,
            workoutTemplateId: daily?.workoutTemplate?.id || null,
            workoutTemplateName: daily?.workoutTemplate?.name || null,
            workoutCategory: daily?.workoutTemplate?.category || null,
            workoutDifficulty: daily?.workoutTemplate?.difficulty || null,
            startTime: templateDay.overrideTime || daily?.startTime || "09:00",
            duration: daily?.duration || 60,
            color: daily?.color || "#6b7280",
            isRestDay: daily?.isRestDay ?? true,
            activeScheduleId: schedule.id,
            activeScheduleName: schedule.name,
          });
        }
      }

      currentDate = addDays(currentDate, 1);
    }

    // Also fetch completed days for this range
    const completedDays = await prisma.completedDay.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: startDate,
          lt: addDays(endDate, 1),
        },
      },
      select: {
        date: true,
        status: true,
        notes: true,
      },
    });

    const completedDayMap = new Map(
      completedDays.map((cd: any) => [formatDate(cd.date), cd]),
    );

    // Attach completion status to calendar workouts
    const enrichedWorkouts = calendarWorkouts.map((workout) => ({
      ...workout,
      isCompleted: completedDayMap.has(workout.date),
      completionStatus:
        (completedDayMap.get(workout.date) as any)?.status || null,
      completionNotes:
        (completedDayMap.get(workout.date) as any)?.notes || null,
    }));

    return NextResponse.json({
      workouts: enrichedWorkouts,
      startDate: startParam,
      endDate: endParam,
      totalDays: daysDiff + 1,
      activeScheduleCount: activeSchedules.length,
    });
  } catch (error) {
    // Handle case where table doesn't exist yet (migration not run)
    if ((error as { code?: string })?.code === "P2021") {
      const { searchParams } = new URL(request.url);
      return NextResponse.json({
        workouts: [],
        startDate: searchParams.get("start") || "",
        endDate: searchParams.get("end") || "",
        totalDays: 0,
        activeScheduleCount: 0,
      });
    }
    logger.error("Error fetching calendar:", error);
    return NextResponse.json(
      { error: "Failed to fetch calendar" },
      { status: 500 },
    );
  }
}
