"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, ArrowRight } from "lucide-react";

interface LeaderboardPlayer {
  alias: string;
  rank: number;
  xp: number;
}

interface LeaderboardResponse {
  totalPlayers: number;
  players: LeaderboardPlayer[];
  currentPlayer: LeaderboardPlayer | null;
}

export function ProgressionLeaderboardCard() {
  const [state, setState] = useState<{
    loading: boolean;
    data?: LeaderboardResponse;
    error?: string;
  }>({ loading: true });

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await fetch("/api/progression/leaderboard");
        if (!res.ok) throw new Error("Failed to load leaderboard");
        const data: LeaderboardResponse = await res.json();
        if (!active) return;
        setState({ loading: false, data });
      } catch (error) {
        if (!active) return;
        setState({ loading: false, error: (error as Error).message });
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  if (state.loading) {
    return <Skeleton className="h-40 w-full rounded-3xl" />;
  }

  if (state.error || !state.data) {
    return (
      <Card className="rounded-3xl border bg-card/70 p-4 text-sm">
        <p className="font-semibold">Progression leaderboard</p>
        <p className="text-muted-foreground">
          {state.error ?? "No leaderboard data yet."}
        </p>
        <Button asChild variant="link" className="px-0">
          <Link href="/progression">Open progression</Link>
        </Button>
      </Card>
    );
  }

  const topPlayers = state.data.players.slice(0, 10); // Show up to 10 players with scroll

  return (
    <Card className="space-y-3 rounded-3xl border bg-card/70 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Community climb
          </p>
          <h3 className="text-lg font-semibold">Leaderboard</h3>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs font-semibold">
          <Users className="h-4 w-4 text-muted-foreground" />
          {state.data.totalPlayers}
        </span>
      </div>

      {topPlayers.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Be the first to log XP and take the top spot.
        </p>
      ) : (
        <div className="max-h-48 overflow-y-auto space-y-2">
          {topPlayers.map((player) => (
            <div
              key={player.rank}
              className="flex items-center justify-between rounded-2xl border px-3 py-2 text-sm"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white text-sm font-bold">
                  {player.rank}
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    {player.alias}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {player.xp} XP
                  </p>
                </div>
              </div>
              {state.data?.currentPlayer?.alias === player.alias && (
                <span className="text-xs font-semibold text-primary">You</span>
              )}
            </div>
          ))}
        </div>
      )}

      {state.data.currentPlayer && (
        <div className="rounded-2xl bg-primary/10 px-3 py-2 text-xs font-semibold text-primary">
          You: {state.data.currentPlayer.alias} · Rank #
          {state.data.currentPlayer.rank}
        </div>
      )}

      <Button asChild variant="outline" className="w-full">
        <Link href="/tree">
          <ArrowRight className="mr-2 h-4 w-4" /> View full tree
        </Link>
      </Button>

      <p className="text-[11px] text-muted-foreground">
        XP is synced from every logged workout node.
      </p>
    </Card>
  );
}
