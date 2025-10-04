import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

export const dynamic = 'force-dynamic';

const profileUpdateSchema = z.object({
  name: z.string().min(2).optional().nullable(),
  height: z.number().positive().optional().nullable(),
  weight: z.number().positive().optional().nullable(),
  birthdate: z.string().optional().nullable(),
  gender: z.enum(["male", "female"]).optional().nullable(),
  fitnessGoals: z.string().optional().nullable(),
  activityLevel: z.string().optional().nullable(),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...safeUser } = user
  return NextResponse.json({ user: safeUser })
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = profileUpdateSchema.parse(body)

    // Prisma expects undefined to leave fields unchanged; pass values directly (including null) to set nulls
    const updateData: Record<string, unknown> = {}
    for (const key of Object.keys(parsed)) {
      const value = parsed[key as keyof typeof parsed]
      if (value === undefined) continue
      updateData[key] = value
    }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    })

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...safeUser } = updated
    return NextResponse.json({ user: safeUser })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Delete user and all related data (cascade will handle related records)
    await prisma.user.delete({
      where: { id: session.user.id }
    })

    return NextResponse.json({ message: "Account deleted successfully" })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
