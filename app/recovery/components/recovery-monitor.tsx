"use client";

import { useEffect, useState } from "react";
import {
  AlertOctagon,
  RefreshCcw,
  Zap,
  TrendingDown,
  Activity,
  Clock,
} from "lucide-react";

import { useRecoveryData } from "@/hooks/use-recovery-data";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RecoveryBodyDiagram } from "./recovery-body-diagram";
import { DailyCheckIn } from "./daily-check-in";
import { cn } from "@/lib/utils";

// Status configuration for styling
const statusConfig = {
  ready: {
    icon: Zap,
    label: "Ready",
    color: "emerald",
    bg: "bg-emerald-50 dark:bg-emerald-950/20",
    border: "border-emerald-200 dark:border-emerald-900/50",
    badge:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200",
  },
  caution: {
    icon: Clock,
    label: "Caution",
    color: "amber",
    bg: "bg-amber-50 dark:bg-amber-950/20",
    border: "border-amber-200 dark:border-amber-900/50",
    badge:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-200",
  },
  rest: {
    icon: TrendingDown,
    label: "Rest",
    color: "rose",
    bg: "bg-rose-50 dark:bg-rose-950/20",
    border: "border-rose-200 dark:border-rose-900/50",
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-200",
  },
  "worked-recently": {
    icon: Activity,
    label: "Recent",
    color: "blue",
    bg: "bg-blue-50 dark:bg-blue-950/20",
    border: "border-blue-200 dark:border-blue-900/50",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200",
  },
};

interface RecoveryMonitorProps {
  selectedDate?: Date;
}

export function RecoveryMonitor({ selectedDate }: RecoveryMonitorProps) {
  const { data, loading, error, refreshing, refresh } = useRecoveryData();
  const [refreshKey, setRefreshKey] = useState(0);

  // Check if viewing today
  const isViewingToday = () => {
    if (!selectedDate) return true;
    const today = new Date();
    const selected = new Date(selectedDate);
    return (
      today.getDate() === selected.getDate() &&
      today.getMonth() === selected.getMonth() &&
      today.getFullYear() === selected.getFullYear()
    );
  };

  // Fetch body part options for soreness dialog
  useEffect(() => {
    const fetchBodyParts = async () => {
      try {
        await fetch("/api/workout-tracker/body-parts");
        // Fallback to some common body parts if needed
      } catch {
        // Fallback to some common body parts
      }
    };
    fetchBodyParts();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <Card>
          <CardHeader>
            <div className="h-6 w-48 bg-muted rounded" />
            <div className="h-4 w-64 bg-muted rounded mt-2" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="h-20 bg-muted/50 rounded-lg" />
            <div className="h-16 bg-muted/50 rounded-lg" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="h-6 w-56 bg-muted rounded" />
          </CardHeader>
          <CardContent>
            <div className="h-[500px] bg-muted/30 rounded-lg" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-muted">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-muted-foreground">
            <AlertOctagon className="size-5" /> Recovery data unavailable
          </CardTitle>
          <CardDescription>
            Check back after completing a workout session
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={refresh} variant="outline">
            <RefreshCcw className="mr-2 size-4" /> Refresh
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pain Alerts - High Priority - Only show for today */}
      {isViewingToday() && data.summary.painAlerts.length > 0 && (
        <Card className="border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <AlertOctagon className="size-5" />
              {data.summary.painAlerts.length} Pain Alert
              {data.summary.painAlerts.length !== 1 ? "s" : ""}
            </CardTitle>
            <CardDescription className="text-rose-700 dark:text-rose-300">
              Consider active recovery or rest these areas
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {data.summary.painAlerts.map((alert) => (
              <Badge key={alert} className={statusConfig.rest.badge}>
                {alert}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Main Quick View - Summary + Check-in */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Key Metrics - Only show for today */}
        {isViewingToday() && (
          <div className="md:col-span-2">
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>Recovery Status</CardTitle>
                  <CardDescription>
                    Your body's readiness to train
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={refresh}
                  disabled={refreshing}
                  className="h-8 w-8 p-0"
                >
                  <RefreshCcw
                    className={cn("size-4", refreshing && "animate-spin")}
                  />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {/* Ready */}
                  <div
                    className={cn(
                      "rounded-lg border p-4",
                      statusConfig.ready.bg,
                      statusConfig.ready.border,
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm font-medium text-muted-foreground">
                        Ready to Train
                      </p>
                      <Zap className="size-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {data.summary.readyCount}
                    </p>
                    {data.summary.suggestedFocus.length > 0 && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Target:{" "}
                        {data.summary.suggestedFocus.slice(0, 1).join(", ")}
                      </p>
                    )}
                  </div>

                  {/* Caution */}
                  <div
                    className={cn(
                      "rounded-lg border p-4",
                      statusConfig.caution.bg,
                      statusConfig.caution.border,
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm font-medium text-muted-foreground">
                        Proceed with Caution
                      </p>
                      <Clock className="size-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                      {data.summary.cautionCount}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Recovering...
                    </p>
                  </div>

                  {/* Rest Needed */}
                  <div
                    className={cn(
                      "rounded-lg border p-4",
                      statusConfig.rest.bg,
                      statusConfig.rest.border,
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm font-medium text-muted-foreground">
                        Needs Rest
                      </p>
                      <TrendingDown className="size-4 text-rose-600 dark:text-rose-400" />
                    </div>
                    <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                      {data.summary.restCount}
                    </p>
                    {data.summary.nextEligibleInHours[0] && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Ready in{" "}
                        {data.summary.nextEligibleInHours[0].remainingHours.toFixed(
                          1,
                        )}
                        h
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Daily Check-in Card - Only show for today */}
        {isViewingToday() && (
          <div className="md:col-span-1">
            <DailyCheckIn
              onComplete={() => {
                refresh();
                setRefreshKey((prev) => prev + 1);
              }}
            />
          </div>
        )}
      </div>

      {/* Visual Body Diagram */}
      <RecoveryBodyDiagram
        key={refreshKey}
        timeRange="7days"
        selectedDate={selectedDate}
      />
    </div>
  );
}
