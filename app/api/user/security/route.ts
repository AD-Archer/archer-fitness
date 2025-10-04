import { NextResponse, NextRequest } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { emailNotificationManager } from "@/lib/email-notifications"

const passwordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8),
  confirmPassword: z.string().min(8),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

const unlinkSchema = z.object({
  provider: z.string().min(1),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const [user, accounts] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, email: true, password: true, emailVerified: true },
      }),
      prisma.account.findMany({
        where: { userId: session.user.id },
        select: {
          id: true,
          provider: true,
          providerAccountId: true,
          type: true,
        },
      }),
    ])

    return NextResponse.json({
      hasPassword: Boolean(user?.password),
      email: user?.email ?? null,
      emailVerified: user?.emailVerified ?? null,
      linkedAccounts: accounts.map((account) => ({
        id: account.id,
        provider: account.provider,
      })),
    })
  } catch {
    return NextResponse.json({ error: "Unable to load security settings" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const data = passwordSchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, password: true, email: true },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (user.password) {
      if (!data.currentPassword) {
        return NextResponse.json({ error: "Current password is required" }, { status: 400 })
      }

      const isValid = await bcrypt.compare(data.currentPassword, user.password)
      if (!isValid) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })
      }
    }

    const hashedPassword = await bcrypt.hash(data.newPassword, 12)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
      },
    })

    if (user.email) {
      await emailNotificationManager.sendPasswordChangedEmail(user.email)
    }

    return NextResponse.json({ message: "Password updated" })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: "Unable to update password" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { provider } = unlinkSchema.parse(body)

    const [user, accounts] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, password: true },
      }),
      prisma.account.findMany({
        where: { userId: session.user.id },
        select: { id: true, provider: true },
      }),
    ])

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const accountToRemove = accounts.find((account) => account.provider === provider)

    if (!accountToRemove) {
      return NextResponse.json({ error: "Provider not linked" }, { status: 404 })
    }

    const remainingAccounts = accounts.filter((account) => account.provider !== provider)

    const hasAlternativeLogin = Boolean(user.password) || remainingAccounts.length > 0

    if (!hasAlternativeLogin) {
      return NextResponse.json(
        { error: "Cannot unlink the only login method. Add a password first." },
        { status: 400 }
      )
    }

    await prisma.account.delete({
      where: { id: accountToRemove.id },
    })

    return NextResponse.json({ message: "Provider unlinked" })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: "Unable to update linked providers" }, { status: 500 })
  }
}
