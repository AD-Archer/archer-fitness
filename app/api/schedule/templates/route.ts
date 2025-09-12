import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/schedule/templates - Get all schedule templates for a user
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user templates and default public templates
    const templates = await prisma.scheduleTemplate.findMany({
      where: {
        OR: [
          { userId: session.user.id },
          { isDefault: true },
          { isPublic: true }
        ]
      },
      include: {
        items: {
          orderBy: [
            { day: 'asc' },
            { startTime: 'asc' }
          ]
        }
      },
      orderBy: [
        { isDefault: 'desc' },
        { usageCount: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json({ templates })

  } catch (error) {
    console.error('Error fetching schedule templates:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/schedule/templates - Create a new schedule template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, isPublic, items } = body

    if (!name || !items || !Array.isArray(items)) {
      return NextResponse.json({ error: "Name and items are required" }, { status: 400 })
    }

    // Create template
    const template = await prisma.scheduleTemplate.create({
      data: {
        userId: session.user.id,
        name,
        description,
        isPublic: isPublic || false
      }
    })

    // Create template items
    if (items.length > 0) {
      await prisma.scheduleTemplateItem.createMany({
        data: items.map((item: {
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
          templateId: template.id,
          type: item.type,
          title: item.title,
          description: item.description,
          startTime: item.startTime,
          endTime: item.endTime,
          day: item.day,
          category: item.category,
          calories: item.calories,
          difficulty: item.difficulty,
          duration: item.duration
        }))
      })
    }

    // Return template with items
    const fullTemplate = await prisma.scheduleTemplate.findUnique({
      where: { id: template.id },
      include: {
        items: {
          orderBy: [
            { day: 'asc' },
            { startTime: 'asc' }
          ]
        }
      }
    })

    return NextResponse.json({ template: fullTemplate })

  } catch (error) {
    console.error('Error creating schedule template:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}