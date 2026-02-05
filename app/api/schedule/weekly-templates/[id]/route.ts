import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/schedule/weekly-templates/[id] - Get a specific weekly template
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const weeklyTemplate = await prisma.weeklyTemplate.findFirst({
      where: {
        id,
        OR: [
          { userId: session.user.id },
          { isPublic: true },
          { isDefault: true },
        ],
      },
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
                    exercises: {
                      include: {
                        exercise: {
                          select: {
                            id: true,
                            name: true,
                          },
                        },
                      },
                      orderBy: { order: "asc" },
                    },
                  },
                },
              },
            },
          },
          orderBy: { dayOfWeek: "asc" },
        },
      },
    });

    if (!weeklyTemplate) {
      return NextResponse.json(
        { error: "Weekly template not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(weeklyTemplate);
  } catch (error) {
    logger.error("Error fetching weekly template:", error);
    return NextResponse.json(
      { error: "Failed to fetch weekly template" },
      { status: 500 },
    );
  }
}

// PUT /api/schedule/weekly-templates/[id] - Update a weekly template
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { name, description, days, isPublic } = body;

    // Verify ownership
    const existing = await prisma.weeklyTemplate.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Weekly template not found or not owned by user" },
        { status: 404 },
      );
    }

    // If updating days, validate them
    if (days) {
      if (!Array.isArray(days) || days.length !== 7) {
        return NextResponse.json(
          { error: "Days must be an array of 7 items" },
          { status: 400 },
        );
      }

      const dailyTemplateIds = days
        .map((d: { dailyTemplateId?: string }) => d.dailyTemplateId)
        .filter(Boolean) as string[];

      if (dailyTemplateIds.length > 0) {
        const existingTemplates = await prisma.dailyTemplate.findMany({
          where: {
            id: { in: dailyTemplateIds },
            userId: session.user.id,
          },
          select: { id: true },
        });

        const existingIds = new Set(
          existingTemplates.map((t: { id: string }) => t.id),
        );
        const missingIds = dailyTemplateIds.filter(
          (id) => !existingIds.has(id),
        );

        if (missingIds.length > 0) {
          return NextResponse.json(
            { error: `Daily templates not found: ${missingIds.join(", ")}` },
            { status: 404 },
          );
        }
      }

      // Delete existing days and recreate
      await prisma.weeklyTemplateDay.deleteMany({
        where: { weeklyTemplateId: id },
      });

      await prisma.weeklyTemplateDay.createMany({
        data: days.map(
          (day: {
            dayOfWeek: number;
            dailyTemplateId?: string;
            overrideTime?: string;
          }) => ({
            weeklyTemplateId: id,
            dayOfWeek: day.dayOfWeek,
            dailyTemplateId: day.dailyTemplateId || null,
            overrideTime: day.overrideTime || null,
          }),
        ),
      });
    }

    const updatedTemplate = await prisma.weeklyTemplate.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(isPublic !== undefined && { isPublic }),
      },
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
    });

    return NextResponse.json(updatedTemplate);
  } catch (error) {
    logger.error("Error updating weekly template:", error);
    return NextResponse.json(
      { error: "Failed to update weekly template" },
      { status: 500 },
    );
  }
}

// DELETE /api/schedule/weekly-templates/[id] - Delete a weekly template
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    // Verify ownership
    const existing = await prisma.weeklyTemplate.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Weekly template not found or not owned by user" },
        { status: 404 },
      );
    }

    // Check if template is being used by any active schedules
    const activeSchedules = await prisma.activeSchedule.findMany({
      where: { weeklyTemplateId: id, isActive: true },
      select: { id: true, name: true },
    });

    if (activeSchedules.length > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete template that is used by active schedules",
          activeSchedules,
        },
        { status: 400 },
      );
    }

    await prisma.weeklyTemplate.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error deleting weekly template:", error);
    return NextResponse.json(
      { error: "Failed to delete weekly template" },
      { status: 500 },
    );
  }
}
