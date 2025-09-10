/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const template = await prisma.workoutTemplate.findUnique({
      where: { id: params.id },
      include: {
        exercises: { include: { exercise: true }, orderBy: { order: "asc" } },
      },
    })
    if (!template) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(template)
  } catch (error) {
    console.error("Error fetching workout template:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const { name, description, estimatedDuration, category, difficulty, exercises } = body

    // Enforce ownership
    const existing = await prisma.workoutTemplate.findFirst({ where: { id: params.id, userId: session.user.id } })
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

    // Update template core
    await prisma.workoutTemplate.update({
      where: { id: params.id },
      data: { name, description, estimatedDuration, category, difficulty },
    })

    // If exercises provided, replace the list
    if (Array.isArray(exercises)) {
      // Resolve exercise IDs (create by name if missing)
      const resolved = [] as Array<any>
      for (let i = 0; i < exercises.length; i++) {
        const ex = exercises[i]
        let exerciseId: string | undefined = ex.exerciseId
        if (!exerciseId) {
          const nameFromBody: string | undefined = ex.name
          if (!nameFromBody) {
            return NextResponse.json({ error: `Exercise at position ${i + 1} missing exerciseId or name` }, { status: 400 })
          }
          const created = await prisma.exercise.create({
            data: {
              userId: session.user.id,
              name: nameFromBody,
              description: ex.description,
              instructions: ex.instructions,
            },
          })
          exerciseId = created.id
        }
        resolved.push({
          exerciseId,
          targetSets: ex.targetSets ?? 3,
          targetReps: ex.targetReps ?? "8-12",
          targetWeight: ex.targetWeight ?? null,
          restTime: ex.restTime ?? 90,
          notes: ex.notes ?? null,
        })
      }

      // Delete existing links then recreate
      await prisma.workoutTemplateExercise.deleteMany({ where: { workoutTemplateId: params.id } })
      await prisma.workoutTemplate.update({
        where: { id: params.id },
        data: {
          exercises: {
            create: resolved.map((ex: any, index: number) => ({
              exerciseId: ex.exerciseId,
              order: index,
              targetSets: ex.targetSets,
              targetReps: ex.targetReps,
              targetWeight: ex.targetWeight,
              restTime: ex.restTime,
              notes: ex.notes,
            })),
          },
        },
      })
    }

    const full = await prisma.workoutTemplate.findUnique({
      where: { id: params.id },
      include: { exercises: { include: { exercise: true }, orderBy: { order: "asc" } } },
    })
    return NextResponse.json(full)
  } catch (error) {
    console.error("Error updating workout template:", error)
    return NextResponse.json({ error: "Failed to update template" }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Enforce ownership
    const existing = await prisma.workoutTemplate.findFirst({ where: { id: params.id, userId: session.user.id } })
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

    await prisma.workoutTemplate.delete({ where: { id: params.id } })
    return NextResponse.json({ message: "Deleted" })
  } catch (error) {
    console.error("Error deleting workout template:", error)
    return NextResponse.json({ error: "Failed to delete template" }, { status: 500 })
  }
}
