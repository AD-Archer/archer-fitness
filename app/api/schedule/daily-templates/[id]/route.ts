import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/schedule/daily-templates/[id] - Get a specific daily template
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const dailyTemplate = await prisma.dailyTemplate.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
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
                    description: true,
                  },
                },
              },
              orderBy: { order: "asc" },
            },
          },
        },
      },
    });

    if (!dailyTemplate) {
      return NextResponse.json(
        { error: "Daily template not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(dailyTemplate);
  } catch (error) {
    logger.error("Error fetching daily template:", error);
    return NextResponse.json(
      { error: "Failed to fetch daily template" },
      { status: 500 },
    );
  }
}

// PUT /api/schedule/daily-templates/[id] - Update a daily template
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const {
      name,
      workoutTemplateId,
      cardioType,
      startTime,
      duration,
      color,
      isRestDay,
      notes,
    } = body;

    // Verify ownership
    const existing = await prisma.dailyTemplate.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Daily template not found" },
        { status: 404 },
      );
    }

    // If changing workout template, verify it exists
    if (workoutTemplateId && workoutTemplateId !== existing.workoutTemplateId) {
      const workoutTemplate = await prisma.workoutTemplate.findFirst({
        where: {
          id: workoutTemplateId,
          OR: [
            { userId: session.user.id },
            { isPublic: true },
            { isPredefined: true },
          ],
        },
      });

      if (!workoutTemplate) {
        return NextResponse.json(
          { error: "Workout template not found or not accessible" },
          { status: 404 },
        );
      }
    }

    const updatedTemplate = await prisma.dailyTemplate.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(workoutTemplateId !== undefined && {
          workoutTemplateId: isRestDay
            ? null
            : cardioType
              ? null
              : workoutTemplateId,
        }),
        ...(cardioType !== undefined && {
          cardioType: isRestDay
            ? null
            : (workoutTemplateId ? null : cardioType) || null,
        }),
        ...(startTime !== undefined && { startTime }),
        ...(duration !== undefined && { duration }),
        ...(color !== undefined && { color }),
        ...(isRestDay !== undefined && { isRestDay }),
        ...(notes !== undefined && { notes }),
      },
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
    });

    return NextResponse.json(updatedTemplate);
  } catch (error) {
    logger.error("Error updating daily template:", error);
    return NextResponse.json(
      { error: "Failed to update daily template" },
      { status: 500 },
    );
  }
}

// DELETE /api/schedule/daily-templates/[id] - Delete a daily template
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    // Verify ownership
    const existing = await prisma.dailyTemplate.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Daily template not found" },
        { status: 404 },
      );
    }

    await prisma.dailyTemplate.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error deleting daily template:", error);
    return NextResponse.json(
      { error: "Failed to delete daily template" },
      { status: 500 },
    );
  }
}
