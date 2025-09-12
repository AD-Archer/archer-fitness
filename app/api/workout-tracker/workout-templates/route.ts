/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const difficulty = searchParams.get("difficulty")
    const limit = parseInt(searchParams.get("limit") || "20")

    // User-specific templates (only if authenticated)
    let userTemplates: any[] = []
    if (session?.user?.id) {
      userTemplates = await prisma.workoutTemplate.findMany({
        where: { userId: session.user.id },
        include: {
          exercises: {
            include: { 
              exercise: {
                include: {
                  muscles: {
                    include: {
                      muscle: true
                    }
                  },
                  equipments: {
                    include: {
                      equipment: true
                    }
                  }
                }
              }
            },
            orderBy: { order: "asc" },
          },
        },
        orderBy: { updatedAt: "desc" },
      })
    }

    // Predefined templates
    const predefinedTemplates = await prisma.workoutTemplate.findMany({
      where: {
        isPredefined: true,
        ...(category && { category }),
        ...(difficulty && { difficulty }),
      },
      include: {
        exercises: {
          include: { 
            exercise: {
              include: {
                muscles: {
                  include: {
                    muscle: true
                  }
                },
                equipments: {
                  include: {
                    equipment: true
                  }
                }
              }
            }
          },
          orderBy: { order: "asc" },
        },
      },
      orderBy: { usageCount: "desc" },
      take: limit,
    })

    return NextResponse.json({ userTemplates, predefinedTemplates })
  } catch (error) {
    console.error("Error fetching workout templates:", error)
    return NextResponse.json(
      { error: "Failed to fetch workout templates" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify that the user still exists in the database
    const userExists = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true }
    })
    
    if (!userExists) {
      return NextResponse.json(
        { error: "User session is invalid. Please sign in again." },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, description, estimatedDuration, category, difficulty, exercises, isAiGenerated } = body

    if (!name || !exercises || exercises.length === 0) {
      return NextResponse.json(
        { error: "Name and exercises are required" },
        { status: 400 }
      )
    }

    // Resolve exercise IDs (validate provided or find/create by name)
    const resolvedExercises: Array<any> = []
    const seenExerciseIds = new Set<string>()
    for (let idx = 0; idx < exercises.length; idx++) {
      const ex = exercises[idx]
      let exerciseId = ex.exerciseId as string | undefined
      // If an ID was provided, check it exists
      if (exerciseId) {
        const exists = await prisma.exercise.findUnique({ where: { id: exerciseId }, select: { id: true } })
        if (!exists) exerciseId = undefined
      }
      // If no valid ID, resolve by name
      if (!exerciseId) {
        const nameFromBody = ex.name as string | undefined
        if (!nameFromBody) {
          return NextResponse.json(
            { error: `Exercise at position ${idx + 1} missing exerciseId or name` },
            { status: 400 }
          )
        }
        // Try user's custom exercise
        let exRec = await prisma.exercise.findFirst({ where: { userId: session.user.id, name: nameFromBody }, select: { id: true } })
        if (!exRec) {
          // Try predefined
          exRec = await prisma.exercise.findFirst({ where: { isPredefined: true, name: nameFromBody }, select: { id: true } })
        }
        if (!exRec) {
          // Create new custom exercise
          const created = await prisma.exercise.create({
            data: { userId: session.user.id, name: nameFromBody, description: null },
            select: { id: true }
          })
          exerciseId = created.id
        } else {
          exerciseId = exRec.id
        }
      }

      // Skip if this exerciseId already added to prevent unique constraint violation
      if (seenExerciseIds.has(exerciseId)) {
        continue
      }
      seenExerciseIds.add(exerciseId)

      resolvedExercises.push({
        exerciseId: exerciseId!,
        targetSets: ex.targetSets ?? 3,
        targetReps: ex.targetReps ?? "8-12",
        targetType: ex.targetType ?? "reps",
        targetWeight: ex.targetWeight ?? null,
        restTime: ex.restTime ?? 90,
        notes: ex.notes ?? null,
      })
    }


    // Create the workout template with proper relation syntax
    const workoutTemplate = await prisma.workoutTemplate.create({
      data: {
        user: {
          connect: { id: session.user.id }
        },
        name,
        description: isAiGenerated ? `${description || ''} (AI Generated)`.trim() : description,
        estimatedDuration: estimatedDuration || 30,
        category,
        difficulty,
        isAiGenerated: isAiGenerated || false,
        exercises: {
          create: resolvedExercises.map((ex: any, index: number) => ({
            exerciseId: ex.exerciseId,
            order: index,
            targetSets: ex.targetSets,
            targetReps: ex.targetReps,
            targetType: ex.targetType,
            targetWeight: ex.targetWeight,
            restTime: ex.restTime,
            notes: ex.notes,
          })),
        },
      },
      include: {
        exercises: {
          include: {
            exercise: {
              include: {
                muscles: {
                  include: {
                    muscle: true
                  }
                },
                equipments: {
                  include: {
                    equipment: true
                  }
                }
              }
            }
          },
          orderBy: {
            order: "asc",
          },
        },
      },
    })

    return NextResponse.json(workoutTemplate, { status: 201 })
  } catch (error) {
    console.error("Error creating workout template:", error)
    return NextResponse.json(
      { error: `Failed to create workout template: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
