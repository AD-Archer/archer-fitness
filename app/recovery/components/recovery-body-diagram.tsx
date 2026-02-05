"use client";

import React, { useEffect, useState } from "react";
import { BodyDiagram } from "@/components/body-diagram";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  CheckCircle2,
  Activity,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WorkoutBodyPart {
  name: string;
  slug: string;
  intensity: "none" | "light" | "moderate" | "heavy";
  lastWorked?: string;
  sets?: number;
  sessionCount?: number;
}

interface PainFeedback {
  id: string;
  bodyPart: string;
  severity: string;
  notes?: string;
  createdAt: string;
}

interface BodyPartCheck {
  bodyPart: string;
  sorenessLevel: number;
  createdAt?: string;
}

interface RecoveryBodyDiagramProps {
  userId?: string;
  timeRange?: "7days" | "30days";
  onRefresh?: () => void;
  selectedDate?: Date;
}

export function RecoveryBodyDiagram({
  timeRange = "7days",
  onRefresh,
  selectedDate,
}: RecoveryBodyDiagramProps) {
  const [bodyParts, setBodyParts] = useState<WorkoutBodyPart[]>([]);
  const [painFeedback, setPainFeedback] = useState<PainFeedback[]>([]);
  const [sorenessData, setSorenessData] = useState<BodyPartCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load saved view from localStorage
  const [activeView, setActiveView] = useState<"workout" | "soreness">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("recovery-body-view");
      return saved === "workout" || saved === "soreness" ? saved : "workout";
    }
    return "workout";
  });

  const { toast } = useToast();

  // Save view to localStorage when it changes
  const handleViewChange = (view: "workout" | "soreness") => {
    setActiveView(view);
    if (typeof window !== "undefined") {
      localStorage.setItem("recovery-body-view", view);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch workout data
      const workoutResponse = await fetch(
        `/api/workout-tracker/body-part-summary?timeRange=${timeRange}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!workoutResponse.ok) {
        throw new Error("Failed to fetch body part workout data");
      }

      const workoutData = await workoutResponse.json();

      // Fetch pain feedback
      const painResponse = await fetch("/api/recovery/feedback");
      let painData = [];
      if (painResponse.ok) {
        const data = await painResponse.json();
        // API returns { feedback: [...] }
        painData = Array.isArray(data.feedback) ? data.feedback : [];
      }

      // Fetch daily check-in data for soreness
      const checkInResponse = await fetch(
        "/api/recovery/daily-check-in?days=7",
      );
      let sorenessCheckData: BodyPartCheck[] = [];
      if (checkInResponse.ok) {
        const checkIns = await checkInResponse.json();
        // Flatten the body part checks from all check-ins
        if (Array.isArray(checkIns)) {
          sorenessCheckData = checkIns.flatMap((checkIn: any) =>
            (checkIn.bodyPartChecks || []).map((check: any) => ({
              bodyPart: check.bodyPart,
              sorenessLevel: check.sorenessLevel,
              createdAt: checkIn.date,
            })),
          );
        }
      }

      // Map body parts to include slug - keep workout and pain separate
      const mappedParts = (workoutData.bodyParts || []).map(
        (part: WorkoutBodyPart) => {
          const slug =
            part.slug || part.name.toLowerCase().replace(/\s+/g, "_");

          return {
            ...part,
            slug,
          };
        },
      );

      setBodyParts(mappedParts);
      setPainFeedback(painData);
      setSorenessData(sorenessCheckData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load workout data",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

  // Check for daily check-in and post-workout check-in on mount
  useEffect(() => {
    const checkDailyCheckIn = async () => {
      try {
        const today = new Date().toISOString().split("T")[0];
        const response = await fetch("/api/recovery/daily-check-in?days=1");
        if (response.ok) {
          const checkIns = await response.json();
          const todayCheckIn = checkIns.find(
            (c: any) => new Date(c.date).toISOString().split("T")[0] === today,
          );

          if (!todayCheckIn) {
            // No check-in today, prompt user
            setTimeout(() => {
              toast({
                title: "Daily Check-In Reminder",
                description:
                  "Don't forget to log your daily recovery status! Track how you're feeling to optimize your training.",
                duration: 6000,
              });
            }, 2000); // Delay to avoid showing immediately
          }
        }
      } catch {
        // Silently fail - don't bother user with errors
      }
    };

    const checkPostWorkoutCheckIn = async () => {
      try {
        // Check for recently completed workouts (within last 2 hours)
        const response = await fetch(
          "/api/workout-tracker/workout-sessions?limit=5",
        );
        if (response.ok) {
          const sessions = await response.json();
          const recentSession = sessions.find((s: any) => {
            if (s.status !== "completed") return false;
            const endTime = new Date(s.endTime || s.startTime);
            const now = new Date();
            const hoursSince =
              (now.getTime() - endTime.getTime()) / (1000 * 60 * 60);
            return hoursSince < 2 && hoursSince > 0;
          });

          if (recentSession) {
            // Check if we already prompted for this session
            const prompted = localStorage.getItem(
              `workout-checkin-prompted-${recentSession.id}`,
            );
            if (!prompted) {
              localStorage.setItem(
                `workout-checkin-prompted-${recentSession.id}`,
                "true",
              );
              setTimeout(() => {
                toast({
                  title: "Post-Workout Check-In",
                  description:
                    "Great workout! How are your muscles feeling? Log any soreness to help plan your next session.",
                  duration: 7000,
                });
              }, 3000);
            }
          }
        }
      } catch {
        // Silently fail
      }
    };

    checkDailyCheckIn();
    checkPostWorkoutCheckIn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter body parts and pain feedback based on selected date
  const filteredData = React.useMemo(() => {
    if (!selectedDate) {
      return {
        filteredBodyParts: bodyParts,
        filteredPainFeedback: painFeedback,
        filteredSoreness: sorenessData,
      };
    }

    const selectedDateString = selectedDate.toISOString().split("T")[0];

    // Filter body parts by lastWorked date
    const filteredParts = bodyParts.filter((part) => {
      if (!part.lastWorked) return false;
      const lastWorkedDate = new Date(part.lastWorked)
        .toISOString()
        .split("T")[0];
      return lastWorkedDate === selectedDateString;
    });

    // Filter pain feedback by date
    const filteredPain = painFeedback.filter((pain) => {
      if (!pain.createdAt) return false;
      const painDate = new Date(pain.createdAt).toISOString().split("T")[0];
      return painDate === selectedDateString;
    });

    // Filter soreness data by date
    const filteredSoreness = sorenessData.filter((soreness) => {
      if (!soreness.createdAt) return false;
      const sorenessDate = new Date(soreness.createdAt)
        .toISOString()
        .split("T")[0];
      return sorenessDate === selectedDateString;
    });

    return {
      filteredBodyParts: filteredParts,
      filteredPainFeedback: filteredPain,
      filteredSoreness: filteredSoreness,
    };
  }, [bodyParts, painFeedback, sorenessData, selectedDate]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Body Workout & Pain Distribution</CardTitle>
          <CardDescription>Loading your recovery data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96 animate-pulse">
            <div className="w-64 h-full bg-muted/30 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return null; // Silently fail - no ugly error message
  }

  // Create soreness body parts for visualization from daily check-in
  const sorenessBodyParts: WorkoutBodyPart[] =
    filteredData.filteredSoreness.map((soreness) => {
      // Normalize the body part name to match the diagram slugs
      const normalizedName = soreness.bodyPart.toLowerCase().trim();
      let slug = normalizedName.replace(/\s+/g, "-");

      // Map common variations to diagram slugs
      const slugMapping: Record<string, string> = {
        chest: "chest",
        back: "upper-back",
        "lower-back": "lower-back",
        "upper-back": "upper-back",
        shoulders: "deltoids",
        shoulder: "deltoids",
        biceps: "biceps",
        triceps: "triceps",
        arms: "biceps",
        core: "abs",
        abs: "abs",
        legs: "quadriceps",
        quads: "quadriceps",
        quadriceps: "quadriceps",
        hamstrings: "hamstring",
        glutes: "gluteal",
        glute: "gluteal",
        butt: "gluteal",
        calves: "calves",
      };

      slug = slugMapping[slug] || slug;

      // Map soreness level (1-10) to intensity
      let intensity: "none" | "light" | "moderate" | "heavy" = "none";
      if (soreness.sorenessLevel <= 3) {
        intensity = "light";
      } else if (soreness.sorenessLevel <= 6) {
        intensity = "moderate";
      } else {
        intensity = "heavy";
      }

      return {
        name: soreness.bodyPart,
        slug,
        intensity,
        sets: soreness.sorenessLevel,
      };
    });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Body Distribution</CardTitle>
            <CardDescription>
              {selectedDate ? (
                <>
                  Activity for{" "}
                  {new Date(selectedDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </>
              ) : (
                "Workout activity and soreness tracking"
              )}
            </CardDescription>
          </div>
          <Tabs
            value={activeView}
            onValueChange={(v) => handleViewChange(v as "workout" | "soreness")}
            className="w-auto"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="workout" className="text-xs gap-1.5">
                <Activity className="size-3.5" />
                Workout
              </TabsTrigger>
              <TabsTrigger value="soreness" className="text-xs gap-1.5">
                <AlertTriangle className="size-3.5" />
                Soreness
                {filteredData.filteredSoreness.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1 h-4 px-1 text-[10px]"
                  >
                    {filteredData.filteredSoreness.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeView === "soreness" &&
          filteredData.filteredSoreness.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-lg">
              <div className="w-full flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-300 mb-1">
                <AlertCircle className="size-4" />
                Muscle Soreness Areas
              </div>
              {filteredData.filteredSoreness.map((soreness, idx) => (
                <Badge
                  key={`${soreness.bodyPart}-${idx}`}
                  variant="outline"
                  className="bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300"
                >
                  {soreness.bodyPart}
                  <span className="ml-1.5 font-semibold">
                    {soreness.sorenessLevel}/10
                  </span>
                </Badge>
              ))}
            </div>
          )}

        <div className="flex items-center justify-center overflow-auto">
          <BodyDiagram
            bodyParts={
              activeView === "workout"
                ? filteredData.filteredBodyParts
                : sorenessBodyParts
            }
            size="lg"
            colors={["#0984e3", "#74b9ff", "#ef4444"]}
            interactive={false}
            dualView={true}
          />
        </div>

        {activeView === "soreness" &&
          filteredData.filteredSoreness.length === 0 && (
            <div className="text-center py-6">
              <CheckCircle2 className="size-10 mx-auto text-emerald-500 mb-2" />
              <p className="text-sm font-medium text-muted-foreground">
                No muscle soreness reported
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                You're feeling fresh and ready to train
              </p>
            </div>
          )}
      </CardContent>
    </Card>
  );
}
