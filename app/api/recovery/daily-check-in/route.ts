import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const { date, energyLevel, bodyParts, notes } = body;

    // Validate required fields
    if (!date || energyLevel === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: date and energyLevel" },
        { status: 400 },
      );
    }

    // Normalize the date to midnight UTC to avoid time-based duplicates
    const checkInDate = new Date(date);
    checkInDate.setUTCHours(0, 0, 0, 0);

    // Check if a check-in already exists for this date
    const existingCheckIn = await prisma.dailyCheckIn.findUnique({
      where: {
        userId_date: {
          userId: user.id,
          date: checkInDate,
        },
      },
      include: {
        bodyPartChecks: true,
      },
    });

    if (existingCheckIn) {
      // Update existing check-in instead of creating a new one
      // First, delete old body part checks
      await prisma.bodyPartCheck.deleteMany({
        where: { checkInId: existingCheckIn.id },
      });

      // Then update the check-in
      const updatedCheckIn = await prisma.dailyCheckIn.update({
        where: { id: existingCheckIn.id },
        data: {
          energyLevel,
          notes: notes || null,
          bodyPartChecks:
            bodyParts && bodyParts.length > 0
              ? {
                  create: bodyParts.map(
                    (bp: { bodyPart: string; soreness: number }) => ({
                      bodyPart: bp.bodyPart,
                      sorenessLevel: bp.soreness,
                    }),
                  ),
                }
              : undefined,
        },
        include: {
          bodyPartChecks: true,
        },
      });

      return NextResponse.json(updatedCheckIn);
    }

    // Create new check-in
    const checkIn = await prisma.dailyCheckIn.create({
      data: {
        userId: user.id,
        date: checkInDate,
        energyLevel,
        notes: notes || null,
        bodyPartChecks:
          bodyParts && bodyParts.length > 0
            ? {
                create: bodyParts.map(
                  (bp: { bodyPart: string; soreness: number }) => ({
                    bodyPart: bp.bodyPart,
                    sorenessLevel: bp.soreness,
                  }),
                ),
              }
            : undefined,
      },
      include: {
        bodyPartChecks: true,
      },
    });

    return NextResponse.json(checkIn);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create check-in",
      },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("days") || "30");

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setUTCHours(0, 0, 0, 0);

    const checkIns = await prisma.dailyCheckIn.findMany({
      where: {
        userId: user.id,
        date: {
          gte: startDate,
        },
      },
      include: {
        bodyPartChecks: true,
      },
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json(checkIns);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch check-ins" },
      { status: 500 },
    );
  }
}
