import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";

// GET /api/schedule/active - Get all active schedules for user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if Prisma client has been regenerated with new models
     
    if (!(prisma as any).activeSchedule) {
      return NextResponse.json([]);
    }

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") !== "false";

     
    const activeSchedules = await (prisma as any).activeSchedule.findMany({
      where: {
        userId: session.user.id,
        ...(activeOnly && { isActive: true }),
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
              orderBy: { dayOfWeek: "asc" },
            },
          },
        },
      },
      orderBy: { startDate: "desc" },
    });

    return NextResponse.json(activeSchedules);
  } catch (error) {
    // Handle case where table doesn't exist yet (migration not run)
    if ((error as { code?: string })?.code === "P2021") {
      return NextResponse.json([]);
    }
    logger.error("Error fetching active schedules:", error);
    return NextResponse.json(
      { error: "Failed to fetch active schedules" },
      { status: 500 },
    );
  }
}

// POST /api/schedule/active - Create/activate a new schedule from a weekly template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if Prisma client has been regenerated with new models
     
    if (!(prisma as any).activeSchedule || !(prisma as any).weeklyTemplate) {
      return NextResponse.json(
        {
          error: "Schedule feature not available. Database migration required.",
        },
        { status: 503 },
      );
    }

    const body = await request.json();
    const { weeklyTemplateId, name, startDate, endDate } = body;

    if (!weeklyTemplateId) {
      return NextResponse.json(
        { error: "Weekly template ID is required" },
        { status: 400 },
      );
    }

    if (!startDate) {
      return NextResponse.json(
        { error: "Start date is required" },
        { status: 400 },
      );
    }

    // Verify the weekly template exists and is accessible
     
    const weeklyTemplate = await (prisma as any).weeklyTemplate.findFirst({
      where: {
        id: weeklyTemplateId,
        OR: [
          { userId: session.user.id },
          { isPublic: true },
          { isDefault: true },
        ],
      },
    });

    if (!weeklyTemplate) {
      return NextResponse.json(
        { error: "Weekly template not found or not accessible" },
        { status: 404 },
      );
    }

    // Parse dates
    const parsedStartDate = new Date(startDate);
    const parsedEndDate = endDate ? new Date(endDate) : null;

    if (parsedEndDate && parsedEndDate <= parsedStartDate) {
      return NextResponse.json(
        { error: "End date must be after start date" },
        { status: 400 },
      );
    }

     
    const activeSchedule = await (prisma as any).activeSchedule.create({
      data: {
        userId: session.user.id,
        weeklyTemplateId,
        name: name || weeklyTemplate.name,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        isActive: true,
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
              orderBy: { dayOfWeek: "asc" },
            },
          },
        },
      },
    });

    return NextResponse.json(activeSchedule, { status: 201 });
  } catch (error) {
    logger.error("Error creating active schedule:", error);
    return NextResponse.json(
      { error: "Failed to create active schedule" },
      { status: 500 },
    );
  }
}
