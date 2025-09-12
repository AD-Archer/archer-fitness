import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { logger } from "@/lib/logger"

const prisma = new PrismaClient()

export async function GET() {
  try {
    // Fetch all equipment, muscles, and body parts from the database
    const [equipment, muscles, bodyParts] = await Promise.all([
      prisma.equipment.findMany({
        orderBy: { name: 'asc' }
      }),
      prisma.muscle.findMany({
        orderBy: { name: 'asc' }
      }),
      prisma.bodyPart.findMany({
        orderBy: { name: 'asc' }
      })
    ])

    return NextResponse.json({
      equipment: equipment.map(eq => ({
        id: eq.id,
        name: eq.name,
        value: eq.name.toLowerCase().replace(/\s+/g, '-') // Convert to kebab-case for form values
      })),
      muscles: muscles.map(muscle => ({
        id: muscle.id,
        name: muscle.name,
        value: muscle.name.toLowerCase().replace(/\s+/g, '-')
      })),
      bodyParts: bodyParts.map(bodyPart => ({
        id: bodyPart.id,
        name: bodyPart.name,
        value: bodyPart.name.toLowerCase().replace(/\s+/g, '-')
      }))
    })
  } catch (error) {
    logger.error('Error fetching workout options:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch workout options',
        equipment: [],
        muscles: [],
        bodyParts: []
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}