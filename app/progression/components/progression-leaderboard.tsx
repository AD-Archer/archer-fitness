import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users } from "lucide-react";
import type { ProgressionBranch } from "@/lib/progression/types";

interface LeaderboardPlayer {
  alias: string;
  rank: number;
  xp: number;
}

interface ProgressionLeaderboardProps {
  branches: ProgressionBranch[];
  nodes: Record<string, { percent: number; clearedCount: number }>;
  totalPlayers: number;
  players: LeaderboardPlayer[];
  currentPlayer?: LeaderboardPlayer | null;
}

export function ProgressionLeaderboard({
  branches,
  nodes,
  totalPlayers,
  players,
  currentPlayer,
}: ProgressionLeaderboardProps) {
  const nodeEntries = branches
    .flatMap((branch) =>
      branch.milestones.map((node) => ({
        nodeId: node.id,
        name: node.name,
        branch: branch.title,
        percent: nodes[node.id]?.percent ?? 0,
        cleared: nodes[node.id]?.clearedCount ?? 0,
        badge: node.badgeIcon,
      }))
    )
    .filter((entry) => entry.percent > 0)
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 3);

  return (
    <Card className="space-y-4 rounded-3xl border bg-card/70 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Community climb
          </p>
          <h2 className="text-lg font-semibold">Leaderboard</h2>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-semibold">
          <Users className="h-4 w-4 text-muted-foreground" />
          {totalPlayers} players
        </div>
      </div>

      <div className="space-y-2">
        {players.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Be the first to log XP and claim the board.
          </p>
        ) : (
          players.map((player) => (
            <div
              key={player.rank}
              className="flex items-center justify-between rounded-2xl border px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white text-sm font-bold">
                  {player.rank}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {player.alias}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {player.xp} XP
                  </p>
                </div>
              </div>
              {currentPlayer?.alias === player.alias && (
                <Badge variant="secondary">You</Badge>
              )}
            </div>
          ))
        )}
      </div>

      {currentPlayer && (
        <div className="rounded-2xl bg-primary/10 px-4 py-3 text-sm font-semibold text-primary">
          You’re {currentPlayer.alias} · Rank #{currentPlayer.rank}
        </div>
      )}

      {nodeEntries.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Hardest checkpoints
          </p>
          {nodeEntries.map((entry) => (
            <div
              key={entry.nodeId}
              className="flex items-center justify-between rounded-2xl bg-muted/60 px-4 py-3 text-sm"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl" aria-hidden>
                  {entry.badge ? <entry.badge /> : "⭐"}
                </span>
                <div>
                  <p className="font-semibold">{entry.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {entry.branch}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">{entry.percent}%</p>
                <p className="text-xs text-muted-foreground">
                  {entry.cleared} clears
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Trophy className="h-4 w-4" /> Percent = players who completed that
        node.
      </div>
    </Card>
  );
}
