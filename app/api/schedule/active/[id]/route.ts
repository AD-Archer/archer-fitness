import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logger }from "@/lib/logger";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/schedule/active/[id] - Get a specific active schedule
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const activeSchedule = await prisma.activeSchedule.findFirst({
      where: {
        id,
        userId: session.user.id,
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
                        description: true,
                        category: true,
                        difficulty: true,
                        estimatedDuration: true,
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

    if (!activeSchedule) {
      return NextResponse.json(
        { error: "Active schedule not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(activeSchedule);
  } catch (error) {
    logger.error("Error fetching active schedule:", error);
    return NextResponse.json(
      { error: "Failed to fetch active schedule" },
      { status: 500 },
    );
  }
}

// PUT /api/schedule/active/[id] - Update an active schedule (e.g., change end date, pause)
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { name, endDate, isActive } = body;

    // Verify ownership
    const existing = await prisma.activeSchedule.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Active schedule not found" },
        { status: 404 },
      );
    }

    const updatedSchedule = await prisma.activeSchedule.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(endDate !== undefined && {
          endDate: endDate ? new Date(endDate) : null,
        }),
        ...(isActive !== undefined && { isActive }),
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

    return NextResponse.json(updatedSchedule);
  } catch (error) {
    logger.error("Error updating active schedule:", error);
    return NextResponse.json(
      { error: "Failed to update active schedule" },
      { status: 500 },
    );
  }
}

// DELETE /api/schedule/active/[id] - Delete/deactivate an active schedule
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    // Verify ownership
    const existing = await prisma.activeSchedule.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Active schedule not found" },
        { status: 404 },
      );
    }

    await prisma.activeSchedule.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error deleting active schedule:", error);
    return NextResponse.json(
      { error: "Failed to delete active schedule" },
      { status: 500 },
    );
  }
}
