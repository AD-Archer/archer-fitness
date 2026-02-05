import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";

// GET /api/schedule/daily-templates - Get all daily templates for user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dailyTemplates = await prisma.dailyTemplate.findMany({
      where: { userId: session.user.id },
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
      orderBy: { name: "asc" },
    });

    return NextResponse.json(dailyTemplates);
  } catch (error) {
    // Handle case where table doesn't exist yet (migration not run)
    if ((error as { code?: string })?.code === "P2021") {
      return NextResponse.json([]);
    }
    logger.error("Error fetching daily templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch daily templates" },
      { status: 500 },
    );
  }
}

// POST /api/schedule/daily-templates - Create a new daily template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      workoutTemplateId,
      cardioType,
      startTime = "09:00",
      duration = 60,
      color = "#3b82f6",
      isRestDay = false,
      notes,
    } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // If it's not a rest day and no workout template or cardio type, error
    if (!isRestDay && !workoutTemplateId && !cardioType) {
      return NextResponse.json(
        {
          error:
            "Workout template or cardio activity is required for non-rest days",
        },
        { status: 400 },
      );
    }

    // Verify workout template exists and belongs to user (or is public/predefined)
    if (workoutTemplateId) {
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

    const dailyTemplate = await prisma.dailyTemplate.create({
      data: {
        userId: session.user.id,
        name,
        workoutTemplateId: isRestDay
          ? null
          : cardioType
            ? null
            : workoutTemplateId,
        cardioType: isRestDay
          ? null
          : (workoutTemplateId ? null : cardioType) || null,
        startTime,
        duration,
        color,
        isRestDay,
        notes,
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

    return NextResponse.json(dailyTemplate, { status: 201 });
  } catch (error) {
    logger.error("Error creating daily template:", error);
    return NextResponse.json(
      { error: "Failed to create daily template" },
      { status: 500 },
    );
  }
}
