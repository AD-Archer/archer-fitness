import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    const [totalPlayers, nodeGroups, profiles, currentProfile] =
      await Promise.all([
        prisma.progressionProfile.count(),
        prisma.progressionNodeProgress.groupBy({
          by: ["nodeId"],
          where: { status: "COMPLETED" },
          _count: { nodeId: true },
        }),
        prisma.progressionProfile.findMany({
          select: { alias: true, totalXp: true, crowns: true, userId: true },
          orderBy: { totalXp: "desc" },
          take: 10,
        }),
        session?.user?.id
          ? prisma.progressionProfile.findUnique({
              where: { userId: session.user.id },
              select: { alias: true, totalXp: true, crowns: true },
            })
          : null,
      ]);

    const denominator = totalPlayers || 1;

    const nodes = nodeGroups.map((group: any) => ({
      nodeId: group.nodeId,
      clearedCount: group._count.nodeId,
      percent: Math.round((group._count.nodeId / denominator) * 1000) / 10,
    }));

    let currentRank: number | null = null;
    if (currentProfile) {
      const higher = await prisma.progressionProfile.count({
        where: { totalXp: { gt: currentProfile.totalXp } },
      });
      currentRank = higher + 1;
    }

    return NextResponse.json({
      totalPlayers,
      nodes,
      currentPlayer: currentProfile
        ? {
            alias: currentProfile.alias,
            rank: currentRank ?? 0,
            xp: currentProfile.totalXp,
          }
        : null,
      players: profiles.map((profile: any, index: any) => ({
        alias: profile.alias,
        rank: index + 1,
        xp: profile.totalXp,
      })),
    });
  } catch (error) {
    logger.error("Error fetching progression leaderboard", error);
    return NextResponse.json(
      { error: "Failed to load leaderboard" },
      { status: 500 },
    );
  }
}
