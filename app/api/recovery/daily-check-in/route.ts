import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

function normalizeBodyPartInput(bodyParts: unknown) {
  if (!Array.isArray(bodyParts)) return undefined;

  const normalized = new Map<string, number>();
  for (const entry of bodyParts) {
    if (!entry || typeof entry !== "object") continue;

    const bodyPartRaw = (entry as any).bodyPart;
    const sorenessRaw = (entry as any).soreness;

    if (typeof bodyPartRaw !== "string") continue;
    const bodyPart = bodyPartRaw.trim();
    if (!bodyPart) continue;

    const soreness = Number(sorenessRaw);
    normalized.set(bodyPart, Number.isFinite(soreness) ? soreness : 0);
  }

  return Array.from(normalized.entries()).map(([bodyPart, soreness]) => ({
    bodyPart,
    soreness,
  }));
}

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
    const normalizedBodyParts = normalizeBodyPartInput(bodyParts);

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
        bodyPartChecks: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (existingCheckIn) {
      // Update existing check-in while preserving soreness history.
      // New bodyPartChecks are appended and the latest entry per bodyPart is
      // treated as the current value.
      //
      // If bodyParts is provided (even an empty array), treat it as the complete
      // "current state" for soreness and automatically clear omitted parts.
      const bodyPartChecksToCreate: Array<{
        bodyPart: string;
        sorenessLevel: number;
      }> = [];

      if (normalizedBodyParts) {
        const incoming = new Map(
          normalizedBodyParts.map((bp) => [bp.bodyPart, bp.soreness]),
        );

        // Determine the current soreness per body part (latest check wins)
        const current = new Map<string, number>();
        for (const check of existingCheckIn.bodyPartChecks || []) {
          if (!current.has(check.bodyPart)) {
            current.set(check.bodyPart, check.sorenessLevel);
          }
        }

        // Apply incoming values (including 0) only if they changed
        for (const [bodyPart, soreness] of incoming) {
          const currentLevel = current.get(bodyPart);
          if (currentLevel === undefined || currentLevel !== soreness) {
            bodyPartChecksToCreate.push({ bodyPart, sorenessLevel: soreness });
          }
        }

        // Clear any previously-sore body parts that are now omitted
        for (const [bodyPart, sorenessLevel] of current) {
          if (sorenessLevel > 0 && !incoming.has(bodyPart)) {
            bodyPartChecksToCreate.push({ bodyPart, sorenessLevel: 0 });
          }
        }
      }

      const updatedCheckIn = await prisma.dailyCheckIn.update({
        where: { id: existingCheckIn.id },
        data: {
          energyLevel,
          notes: notes || null,
          ...(bodyPartChecksToCreate.length > 0
            ? {
                bodyPartChecks: {
                  create: bodyPartChecksToCreate,
                },
              }
            : {}),
        },
        include: {
          bodyPartChecks: {
            orderBy: { createdAt: "desc" },
          },
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
          normalizedBodyParts && normalizedBodyParts.length > 0
            ? {
                create: normalizedBodyParts.map((bp) => ({
                  bodyPart: bp.bodyPart,
                  sorenessLevel: bp.soreness,
                })),
              }
            : undefined,
      },
      include: {
        bodyPartChecks: {
          orderBy: { createdAt: "desc" },
        },
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
        bodyPartChecks: {
          orderBy: { createdAt: "desc" },
        },
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
