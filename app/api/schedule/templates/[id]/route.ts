import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/schedule/templates/[id] - Get a specific template
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const template = await prisma.scheduleTemplate.findFirst({
      where: {
        id: id,
        OR: [
          { userId: session.user.id },
          { isDefault: true },
          { isPublic: true },
        ],
      },
      include: {
        items: {
          orderBy: [{ day: "asc" }, { startTime: "asc" }],
        },
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ template });
  } catch (error) {
    logger.error("Error fetching schedule template:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PUT /api/schedule/templates/[id] - Update a template
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const body = await request.json();
    const { name, description, isPublic, items } = body;

    // Check if user owns the template
    const existingTemplate = await prisma.scheduleTemplate.findFirst({
      where: {
        id: id,
        userId: session.user.id,
      },
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: "Template not found or not authorized" },
        { status: 404 },
      );
    }

    // Update template
    await prisma.scheduleTemplate.update({
      where: { id: id },
      data: {
        name: name || existingTemplate.name,
        description:
          description !== undefined
            ? description
            : existingTemplate.description,
        isPublic: isPublic !== undefined ? isPublic : existingTemplate.isPublic,
      },
    });

    // Update items if provided
    if (items && Array.isArray(items)) {
      // Delete existing items
      await prisma.scheduleTemplateItem.deleteMany({
        where: { templateId: id },
      });

      // Create new items
      if (items.length > 0) {
        await prisma.scheduleTemplateItem.createMany({
          data: items.map(
            (item: {
              type: string;
              title: string;
              description?: string;
              startTime: string;
              endTime: string;
              day: number;
              category?: string;
              calories?: number;
              difficulty?: string;
              duration?: number;
            }) => ({
              templateId: id,
              type: item.type,
              title: item.title,
              description: item.description,
              startTime: item.startTime,
              endTime: item.endTime,
              day: item.day,
              category: item.category,
              calories: item.calories,
              difficulty: item.difficulty,
              duration: item.duration,
            }),
          ),
        });
      }
    }

    // Return updated template
    const updatedTemplate = await prisma.scheduleTemplate.findUnique({
      where: { id: id },
      include: {
        items: {
          orderBy: [{ day: "asc" }, { startTime: "asc" }],
        },
      },
    });

    return NextResponse.json({ template: updatedTemplate });
  } catch (error) {
    logger.error("Error updating schedule template:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE /api/schedule/templates/[id] - Delete a template
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if user owns the template
    const template = await prisma.scheduleTemplate.findFirst({
      where: {
        id: id,
        userId: session.user.id,
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found or not authorized" },
        { status: 404 },
      );
    }

    // Delete template (cascade will delete items)
    await prisma.scheduleTemplate.delete({
      where: { id: id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error deleting schedule template:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/schedule/templates/[id]/apply - Apply a template to a week
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const body = await request.json();
    const { weekStart } = body;

    if (!weekStart) {
      return NextResponse.json(
        { error: "weekStart is required" },
        { status: 400 },
      );
    }

    // Get template
    const template = await prisma.scheduleTemplate.findFirst({
      where: {
        id: id,
        OR: [
          { userId: session.user.id },
          { isDefault: true },
          { isPublic: true },
        ],
      },
      include: { items: true },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 },
      );
    }

    const weekStartDate = new Date(weekStart);

    // Get or create schedule for the week
    let schedule = await prisma.schedule.findUnique({
      where: {
        userId_weekStart: {
          userId: session.user.id,
          weekStart: weekStartDate,
        },
      },
    });

    if (!schedule) {
      schedule = await prisma.schedule.create({
        data: {
          userId: session.user.id,
          weekStart: weekStartDate,
        },
      });
    }

    // Clear existing items for the week
    await prisma.scheduleItem.deleteMany({
      where: { scheduleId: schedule.id },
    });

    // Apply template items
    if (template.items.length > 0) {
      await prisma.scheduleItem.createMany({
        data: template.items.map((item) => ({
          scheduleId: schedule.id,
          type: item.type,
          title: item.title,
          description: item.description,
          startTime: item.startTime,
          endTime: item.endTime,
          day: item.day,
          category: item.category,
          calories: item.calories,
          difficulty: item.difficulty,
          duration: item.duration,
          isFromGenerator: false,
        })),
      });
    }

    // Increment usage count
    await prisma.scheduleTemplate.update({
      where: { id: id },
      data: { usageCount: { increment: 1 } },
    });

    // Return updated schedule
    const updatedSchedule = await prisma.schedule.findUnique({
      where: { id: schedule.id },
      include: {
        items: {
          orderBy: [{ day: "asc" }, { startTime: "asc" }],
        },
      },
    });

    return NextResponse.json({ schedule: updatedSchedule });
  } catch (error) {
    logger.error("Error applying schedule template:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
