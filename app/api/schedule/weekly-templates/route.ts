import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";

// GET /api/schedule/weekly-templates - Get all weekly templates for user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if Prisma client has been regenerated with new models
     
    if (!(prisma as any).weeklyTemplate) {
      return NextResponse.json([]);
    }

     
    const weeklyTemplates = await (prisma as any).weeklyTemplate.findMany({
      where: {
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
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    });

    return NextResponse.json(weeklyTemplates);
  } catch (error) {
    // Handle case where table doesn't exist yet (migration not run)
    if ((error as { code?: string })?.code === "P2021") {
      return NextResponse.json([]);
    }
    logger.error("Error fetching weekly templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch weekly templates" },
      { status: 500 },
    );
  }
}

// POST /api/schedule/weekly-templates - Create a new weekly template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if Prisma client has been regenerated with new models
     
    if (!(prisma as any).weeklyTemplate || !(prisma as any).dailyTemplate) {
      return NextResponse.json(
        {
          error: "Schedule feature not available. Database migration required.",
        },
        { status: 503 },
      );
    }

    const body = await request.json();
    const { name, description, days, isPublic = false } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // days should be an array of { dayOfWeek: 0-6, dailyTemplateId: string | null, overrideTime?: string }
    if (!Array.isArray(days) || days.length !== 7) {
      return NextResponse.json(
        {
          error: "Days must be an array of 7 items (0-6 for each day of week)",
        },
        { status: 400 },
      );
    }

    // Validate that all daily templates exist and belong to user
    const dailyTemplateIds = days
      .map((d: { dailyTemplateId?: string }) => d.dailyTemplateId)
      .filter(Boolean) as string[];

    if (dailyTemplateIds.length > 0) {
       
      const existingTemplates = await (prisma as any).dailyTemplate.findMany({
        where: {
          id: { in: dailyTemplateIds },
          userId: session.user.id,
        },
        select: { id: true },
      });

      const existingIds = new Set(
        existingTemplates.map((t: { id: string }) => t.id),
      );
      const missingIds = dailyTemplateIds.filter((id) => !existingIds.has(id));

      if (missingIds.length > 0) {
        return NextResponse.json(
          { error: `Daily templates not found: ${missingIds.join(", ")}` },
          { status: 404 },
        );
      }
    }

     
    const weeklyTemplate = await (prisma as any).weeklyTemplate.create({
      data: {
        userId: session.user.id,
        name,
        description,
        isPublic,
        days: {
          create: days.map(
            (day: {
              dayOfWeek: number;
              dailyTemplateId?: string;
              overrideTime?: string;
            }) => ({
              dayOfWeek: day.dayOfWeek,
              dailyTemplateId: day.dailyTemplateId || null,
              overrideTime: day.overrideTime || null,
            }),
          ),
        },
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

    return NextResponse.json(weeklyTemplate, { status: 201 });
  } catch (error) {
    logger.error("Error creating weekly template:", error);
    return NextResponse.json(
      { error: "Failed to create weekly template" },
      { status: 500 },
    );
  }
}
