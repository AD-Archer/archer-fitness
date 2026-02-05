"use client";

import { useMemo, useState, useEffect } from "react";
import { AlertOctagon, RefreshCcw } from "lucide-react";
import { parseISO, format } from "date-fns";

import { useRecoveryData } from "@/hooks/use-recovery-data";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useSearchParams, useRouter } from "next/navigation";
import { RecoverySummary } from "./recovery-summary";
import { SorenessDialog } from "./soreness-dialog";
import { RecoveryTabs } from "./recovery-tabs";
import { RecoveryBodyDiagram } from "./recovery-body-diagram";
import { RecoveryCalendar } from "./recovery-calendar";
import { DailyCheckIn } from "./daily-check-in";
import { AllBodyPartsView } from "./all-body-parts-view";

function getTrendData(parts: any[]) {
  const map = new Map<string, number>();
  for (const part of parts) {
    for (const point of part.trend) {
      const date = point.date.includes("T")
        ? point.date
        : `${point.date}T00:00:00`;
      const key = parseISO(date).toISOString();
      map.set(key, (map.get(key) ?? 0) + point.volume);
    }
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .slice(-10)
    .map(([iso, volume]) => ({
      iso,
      label: new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      volume,
    }));
}

export function RecoveryMonitor() {
  const {
    data,
    loading,
    error,
    refreshing,
    refresh,
    submitFeedback,
    submitting,
  } = useRecoveryData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [bodyPartOptions, setBodyPartOptions] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = searchParams.get("tab") || "status";

  const trendData = useMemo(
    () => (data ? getTrendData(data.bodyParts) : []),
    [data]
  );

  // Calculate status for all body parts
  const allBodyPartsStatus = useMemo(() => {
    if (!data) return []
    
    const allBodyParts = [
      "Chest", "Back", "Shoulders", "Biceps", "Triceps",
      "Forearms", "Abs", "Quadriceps", "Hamstrings", "Glutes", "Calves"
    ]

    return allBodyParts.map(bodyPartName => {
      const bodyPartData = data.bodyParts.find(
        bp => bp.bodyPart.toLowerCase() === bodyPartName.toLowerCase()
      )

      if (!bodyPartData) {
        return {
          name: bodyPartName,
          status: "ready" as const,
        }
      }

      const hoursUntilReady = bodyPartData.hoursUntilNextEligible || 0
      const recommendedRest = bodyPartData.recommendedRestHours || 48

      let status: "ready" | "caution" | "rest" | "worked-recently"
      
      if (hoursUntilReady <= 0) {
        status = "ready"
      } else if (hoursUntilReady < 24) {
        const lastWorkedDate = bodyPartData.lastWorkedDate ? new Date(bodyPartData.lastWorkedDate) : null
        const hoursSinceWorked = lastWorkedDate 
          ? Math.floor((Date.now() - lastWorkedDate.getTime()) / (1000 * 60 * 60))
          : 999
        
        if (hoursSinceWorked < 12) {
          status = "worked-recently"
        } else {
          status = "caution"
        }
      } else {
        status = "rest"
      }

      return {
        name: bodyPartName,
        status,
        lastWorked: bodyPartData.lastWorkedDate,
        hoursUntilReady,
        recommendedRest,
        sets: bodyPartData.totalSets,
      }
    })
  }, [data])

  // Fetch body part options for soreness dialog
  useEffect(() => {
    const fetchBodyParts = async () => {
      try {
        const response = await fetch("/api/workout-tracker/body-parts");
        if (response.ok) {
          const bodyParts = await response.json();
          setBodyPartOptions(
            bodyParts.map((bp: { name: string }) => bp.name).sort()
          );
        }
      } catch (error) {
        console.error("Failed to fetch body parts:", error);
        // Fallback to some common body parts
        setBodyPartOptions([
          "Chest",
          "Back",
          "Shoulders",
          "Arms",
          "Legs",
          "Core",
          "Waist",
        ]);
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
          <CardDescription>Check back after completing a workout session</CardDescription>
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
      {data.summary.painAlerts.length > 0 && (
        <Card className="border-rose-200 dark:border-rose-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex flex-wrap items-center gap-2 text-rose-600 dark:text-rose-300">
              <AlertOctagon className="size-5" /> Pain alerts
            </CardTitle>
            <CardDescription>
              You flagged {data.summary.painAlerts.length} area
              {data.summary.painAlerts.length > 1 ? "s" : ""}. Consider active
              recovery or consulting a coach.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {data.summary.painAlerts.map((alert) => (
              <Badge
                key={alert}
                className="bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-200"
              >
                {alert}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecoverySummary
            summary={data.summary}
            refreshing={refreshing}
            onRefresh={refresh}
            onOpenDialog={() => setIsDialogOpen(true)}
          />
        </div>
        <DailyCheckIn onComplete={refresh} />
      </div>

      <AllBodyPartsView bodyPartsStatus={allBodyPartsStatus} />

      <RecoveryCalendar 
        bodyParts={Array.from(new Set(data.bodyParts.map(bp => bp.bodyPart)))}
        workoutHistory={data.recentSessions.map(session => ({
          date: new Date(session.performedAt).toISOString().split('T')[0],
          bodyParts: session.bodyParts
        }))}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
      />

      <RecoveryBodyDiagram 
        timeRange="7days" 
        onRefresh={refresh}
        selectedDate={selectedDate}
      />

      <SorenessDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        bodyPartOptions={bodyPartOptions}
        onSubmit={submitFeedback}
        submitting={submitting}
      />

      <RecoveryTabs
        bodyParts={data.bodyParts}
        trendData={trendData}
        summary={data.summary}
        recentSessions={data.recentSessions.map((session) => ({
          ...session,
          durationMinutes: session.durationMinutes ?? undefined,
        }))}
        value={activeTab}
        onValueChange={(value) => {
          const params = new URLSearchParams(searchParams);
          params.set("tab", value);
          router.replace(`?${params.toString()}`, { scroll: false });
        }}
        onResolve={refresh}
      />
    </div>
  );
}
