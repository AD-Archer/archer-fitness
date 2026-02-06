"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dumbbell, Play, RotateCcw, ChevronRight } from "lucide-react";
import Link from "next/link";
import { logger } from "@/lib/logger";

interface ApiSession {
  id: string;
  name: string;
  status: string;
  startTime: string;
}

export function QuickStartWorkoutCard() {
  const [activeSession, setActiveSession] = useState<ApiSession | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchActive = async () => {
      try {
        setLoading(true);
        const today = new Date().toISOString().split("T")[0];
        const res = await fetch(
          `/api/workout-tracker/workout-sessions?date=${today}`,
        );
        if (!res.ok) return;
        const data: ApiSession[] = await res.json();
        const session =
          data.find((s) => ["active", "paused"].includes(s.status)) || null;
        setActiveSession(session);
      } catch (e) {
        logger.error("QuickStart fetch failed", e);
      } finally {
        setLoading(false);
      }
    };
    fetchActive();
  }, []);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-2.5 flex items-start gap-2">
        <div className="mt-0.5 text-muted-foreground">
          {activeSession ? (
            <RotateCcw className="h-4 w-4" />
          ) : (
            <Dumbbell className="h-4 w-4" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold flex items-center gap-1">
              {activeSession ? "Resume Workout" : "Quick Start"}
            </p>
            <Button
              asChild
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-[10px]"
            >
              <Link
                href={
                  activeSession
                    ? `/track?sessionId=${activeSession.id}`
                    : "/track"
                }
              >
                {activeSession ? "Resume" : "Start"}{" "}
                <ChevronRight className="h-3 w-3 ml-0.5" />
              </Link>
            </Button>
          </div>
          {loading ? (
            <p className="text-[10px] text-muted-foreground">Loading…</p>
          ) : activeSession ? (
            <p className="text-[10px] text-blue-600 dark:text-blue-400 truncate">
              {activeSession.name}
            </p>
          ) : (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Play className="h-3 w-3" />
              <span>Jump into a new session</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
