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
  Heart,
  Dumbbell,
  TrendingUp,
  Calendar,
  Zap,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getBodyPartSlug } from "../../progress/components/body-part-mappings";

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

interface BodyPartRecoveryStatus {
  name: string;
  status: "ready" | "caution" | "rest" | "worked-recently";
  lastWorked?: string | null;
  hoursUntilReady?: number;
  recommendedRest?: number;
  sets?: number;
}

interface RecentSession {
  id: string;
  name: string;
  performedAt: string;
  bodyParts: string[];
  durationMinutes: number | null;
}

interface RecoveryBodyDiagramProps {
  timeRange?: "7days" | "30days";
  selectedDate?: Date;
}

export function RecoveryBodyDiagram({
  timeRange = "7days",
  selectedDate,
}: RecoveryBodyDiagramProps) {
  const [bodyParts, setBodyParts] = useState<WorkoutBodyPart[]>([]);
  const [painFeedback, setPainFeedback] = useState<PainFeedback[]>([]);
  const [sorenessData, setSorenessData] = useState<BodyPartCheck[]>([]);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [detailedRecoveryStatus, setDetailedRecoveryStatus] = useState<
    BodyPartRecoveryStatus[]
  >([]);
  const [mappedParts, setMappedParts] = useState<WorkoutBodyPart[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Always default to recovery tab, no localStorage persistence
  const [activeView, setActiveView] = useState<
    "workout" | "soreness" | "recovery"
  >("recovery");

  // Load saved insights tab from localStorage
  const [insightsTab, setInsightsTab] = useState<
    "recent" | "planning" | "readiness"
  >(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("recovery-insights-tab");
      return saved === "recent" || saved === "planning" || saved === "readiness"
        ? saved
        : "recent";
    }
    return "recent";
  });

  const { toast } = useToast();

  // Check if viewing today
  const isViewingToday = React.useMemo(() => {
    if (!selectedDate) return true;
    const today = new Date();
    const selected = new Date(selectedDate);
    return (
      today.getDate() === selected.getDate() &&
      today.getMonth() === selected.getMonth() &&
      today.getFullYear() === selected.getFullYear()
    );
  }, [selectedDate]);

  // Auto-switch to workout tab when viewing historical dates
  useEffect(() => {
    if (!isViewingToday && activeView === "recovery") {
      setActiveView("workout");
    }
  }, [isViewingToday, activeView]);

  // Handle view change without localStorage persistence
  const handleViewChange = (view: "workout" | "soreness" | "recovery") => {
    setActiveView(view);
  };

  // Save insights tab to localStorage when it changes
  const handleInsightsTabChange = (
    tab: "recent" | "planning" | "readiness",
  ) => {
    setInsightsTab(tab);
    if (typeof window !== "undefined") {
      localStorage.setItem("recovery-insights-tab", tab);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch detailed workout session data (like the progress page does)
      const daysBack = timeRange === "30days" ? 30 : 7;
      const workoutResponse = await fetch(
        `/api/workout-tracker/workout-sessions?timeRange=${daysBack}days`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!workoutResponse.ok) {
        throw new Error("Failed to fetch workout session data");
      }

      const workoutSessions = await workoutResponse.json();
      const sessionList = Array.isArray(workoutSessions) ? workoutSessions : [];

      // Extract detailed muscle information from workout sessions
      const muscleMap = new Map<
        string,
        {
          name: string;
          intensity: "none" | "light" | "moderate" | "heavy";
          lastWorked?: string;
          sets?: number;
          sessionCount?: number;
          slug?: string;
        }
      >();

      for (const session of sessionList) {
        for (const ex of session.exercises || []) {
          // Use detailed muscle names like the progress page
          for (const m of ex.exercise?.muscles || []) {
            if (m.muscle?.name) {
              const muscleName = m.muscle.name;

              if (!muscleMap.has(muscleName)) {
                muscleMap.set(muscleName, {
                  name: muscleName,
                  intensity: "none",
                  sets: 0,
                  sessionCount: 0,
                });
              }

              const data = muscleMap.get(muscleName)!;
              // Calculate completedSets from the sets array
              // Fall back to total sets count if none marked completed,
              // minimum 1 since the exercise was in the session
              const completedSets = (ex.sets || []).filter(
                (set: any) => set.completed,
              ).length;
              const totalSets = (ex.sets || []).length;
              data.sets = (data.sets || 0) + (completedSets || totalSets || 1);
              data.sessionCount = (data.sessionCount || 0) + 1;
              data.lastWorked = session.startTime;

              // Calculate intensity based on sets and frequency
              const intensity =
                (data.sets || 0) > 15
                  ? "heavy"
                  : (data.sets || 0) > 9
                    ? "moderate"
                    : "light";
              data.intensity = intensity as "light" | "moderate" | "heavy";
            }
          }
        }
      }

      const muscleData = Array.from(muscleMap.values());

      // Calculate recovery status for detailed muscles
      const allMuscleNames = [
        "chest",
        "pectorals",
        "back",
        "lower back",
        "lats",
        "shoulders",
        "deltoids",
        "biceps",
        "triceps",
        "forearms",
        "abs",
        "obliques",
        "quadriceps",
        "quads",
        "hamstrings",
        "glutes",
        "calves",
        "trapezius",
        "rhomboids",
      ];

      const detailedRecoveryStatus = allMuscleNames.map((muscleName) => {
        const muscleWorkoutData = muscleData.find(
          (m) =>
            m.name.toLowerCase().includes(muscleName) ||
            muscleName.includes(m.name.toLowerCase()),
        );

        if (!muscleWorkoutData || !muscleWorkoutData.lastWorked) {
          return {
            name: muscleName,
            status: "ready" as const,
          };
        }

        const lastWorked = new Date(muscleWorkoutData.lastWorked);
        const now = new Date();
        const hoursSinceLast = Math.max(
          0,
          (now.getTime() - lastWorked.getTime()) / (1000 * 60 * 60),
        );

        // Get recommended rest based on muscle group size
        const getRecommendedRest = (muscle: string): number => {
          const muscleLower = muscle.toLowerCase();

          // Large Muscle Groups: 48-72 hours
          if (
            muscleLower.includes("back") ||
            muscleLower.includes("chest") ||
            muscleLower.includes("pectorals") ||
            muscleLower.includes("lats") ||
            muscleLower.includes("quadriceps") ||
            muscleLower.includes("quads") ||
            muscleLower.includes("hamstrings") ||
            muscleLower.includes("hamstring") ||
            muscleLower.includes("glutes") ||
            muscleLower.includes("gluteal")
          ) {
            return 60; // 48-72h range, use 60h as middle
          }

          // Core/Abs: 24-48 hours
          if (
            muscleLower.includes("abs") ||
            muscleLower.includes("obliques") ||
            muscleLower.includes("core")
          ) {
            return 36; // 24-48h range, use 36h as middle
          }

          // Small Muscle Groups: 24-48 hours
          // (biceps, triceps, calves, shoulders, forearms)
          return 36; // 24-48h range, use 36h as middle
        };

        const recommendedRest = getRecommendedRest(muscleName);
        const hoursUntilReady = Math.max(0, recommendedRest - hoursSinceLast);

        let status: "ready" | "caution" | "rest" | "worked-recently";
        if (hoursUntilReady <= 0) {
          status = "ready";
        } else if (hoursUntilReady < 24) {
          status = "caution";
        } else {
          status = "rest";
        }

        return {
          name: muscleName,
          status,
          lastWorked: muscleWorkoutData.lastWorked,
          hoursUntilReady,
          recommendedRest,
          sets: muscleWorkoutData.sets,
        };
      });

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

      // Use recent workout sessions from the detailed data we already fetched
      const sessionsData: RecentSession[] = sessionList
        .slice(0, 5) // Limit to 5 most recent
        .map((session: any) => {
          // Extract detailed muscle names for each session
          const muscles = new Set<string>();

          for (const ex of session.exercises || []) {
            for (const m of ex.exercise?.muscles || []) {
              if (m.muscle?.name) {
                muscles.add(m.muscle.name);
              }
            }
          }

          return {
            id: session.id,
            name: session.workoutTemplate?.name || "Workout",
            performedAt: session.startTime,
            durationMinutes: session.durationMinutes,
            bodyParts: Array.from(muscles), // Use detailed muscle names
          };
        });

      // Map detailed muscle data to include slug for body diagram
      const mappedPartsData = muscleData.map((muscle: any) => {
        const slug = getBodyPartSlug(muscle.name);

        return {
          ...muscle,
          slug,
        };
      });

      setBodyParts(mappedPartsData);
      setMappedParts(mappedPartsData);
      setPainFeedback(painData);
      setSorenessData(sorenessCheckData);
      setRecentSessions(sessionsData);
      setDetailedRecoveryStatus(detailedRecoveryStatus);
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
        filteredMuscleData: mappedParts,
        filteredPainFeedback: painFeedback,
        filteredSoreness: sorenessData,
        filteredSessions: recentSessions,
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

    // Filter muscle data by lastWorked date for workout view
    const filteredMuscleData = mappedParts.filter((muscle) => {
      if (!muscle.lastWorked) return false;
      const lastWorkedDate = new Date(muscle.lastWorked)
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

    // Filter recent sessions by date
    const filteredSessions = recentSessions.filter((session) => {
      if (!session.performedAt) return false;
      const sessionDate = new Date(session.performedAt)
        .toISOString()
        .split("T")[0];
      return sessionDate === selectedDateString;
    });

    return {
      filteredBodyParts: filteredParts,
      filteredMuscleData: filteredMuscleData,
      filteredPainFeedback: filteredPain,
      filteredSoreness: filteredSoreness,
      filteredSessions: filteredSessions,
    };
  }, [
    bodyParts,
    painFeedback,
    sorenessData,
    recentSessions,
    mappedParts,
    selectedDate,
  ]);

  // Get sessions to display (all for today, filtered for historical dates)
  const displaySessions = React.useMemo(() => {
    if (!selectedDate || isViewingToday) {
      return recentSessions;
    }
    return filteredData.filteredSessions;
  }, [
    selectedDate,
    isViewingToday,
    recentSessions,
    filteredData.filteredSessions,
  ]);

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
        "lower back": "lower-back",
        "upper-back": "upper-back",
        "upper back": "upper-back",
        shoulders: "deltoids",
        shoulder: "deltoids",
        biceps: "biceps",
        triceps: "triceps",
        arms: "biceps",
        forearms: "forearm",
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

  // Create recovery body parts for visualization from recovery status
  const recoveryBodyParts: WorkoutBodyPart[] = detailedRecoveryStatus.map(
    (status) => {
      // Normalize the body part name to match the diagram slugs
      const normalizedName = status.name.toLowerCase().trim();
      let slug = normalizedName.replace(/\s+/g, "-");

      // Map common variations to diagram slugs
      const slugMapping: Record<string, string> = {
        chest: "chest",
        back: "upper-back",
        "lower-back": "lower-back",
        "lower back": "lower-back",
        "upper-back": "upper-back",
        shoulders: "deltoids",
        shoulder: "deltoids",
        biceps: "biceps",
        triceps: "triceps",
        arms: "biceps",
        forearms: "forearm",
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

      // Map recovery status to intensity (for color mapping)
      // Green = ready (light), Yellow = caution (moderate), Red = rest/worked-recently (heavy)
      let intensity: "none" | "light" | "moderate" | "heavy" = "none";
      if (status.status === "ready") {
        intensity = "light"; // Will map to colors[0] = green
      } else if (status.status === "caution") {
        intensity = "moderate"; // Will map to colors[1] = yellow
      } else if (
        status.status === "rest" ||
        status.status === "worked-recently"
      ) {
        intensity = "heavy"; // Will map to colors[2] = red
      }

      return {
        name: status.name,
        slug,
        intensity,
        sets: status.sets,
      };
    },
  );

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
            value={
              isViewingToday
                ? activeView
                : activeView === "recovery"
                  ? "workout"
                  : activeView
            }
            onValueChange={(v) =>
              handleViewChange(v as "workout" | "soreness" | "recovery")
            }
            className="w-auto"
          >
            <TabsList
              className={`grid w-full ${isViewingToday ? "grid-cols-3" : "grid-cols-2"}`}
            >
              {isViewingToday && (
                <TabsTrigger value="recovery" className="text-xs gap-1 px-2">
                  <Heart className="size-3 hidden sm:block" />
                  Recovery
                </TabsTrigger>
              )}
              <TabsTrigger value="workout" className="text-xs gap-1 px-2">
                <Activity className="size-3 hidden sm:block" />
                Workout
              </TabsTrigger>
              <TabsTrigger value="soreness" className="text-xs gap-1 px-2">
                <AlertTriangle className="size-3 hidden sm:block" />
                Soreness
                {filteredData.filteredSoreness.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1 h-4 px-1 text-[10px] hidden sm:inline-flex"
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
            key={`body-diagram-${selectedDate?.toISOString() || "today"}-${activeView}`}
            bodyParts={
              activeView === "workout"
                ? filteredData.filteredMuscleData // Use filtered muscle data that updates with date
                : activeView === "recovery"
                  ? recoveryBodyParts
                  : sorenessBodyParts
            }
            size="lg"
            colors={
              activeView === "recovery"
                ? ["#22c55e", "#eab308", "#ef4444"] // Green, Yellow, Red for recovery
                : activeView === "soreness"
                  ? ["#fca5a5", "#f87171", "#dc2626"] // Light red, medium red, dark red for soreness
                  : ["#0984e3", "#74b9ff", "#ef4444"] // Blue shades for workout
            }
            interactive={false}
            dualView={true}
            legendLabels={
              activeView === "recovery"
                ? ["Ready", "Caution", "Needs Rest"]
                : activeView === "soreness"
                  ? ["Mild (1-3)", "Moderate (4-6)", "Severe (7-10)"]
                  : undefined
            }
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

        {activeView === "recovery" && detailedRecoveryStatus.length === 0 && (
          <div className="text-center py-6">
            <CheckCircle2 className="size-10 mx-auto text-emerald-500 mb-2" />
            <p className="text-sm font-medium text-muted-foreground">
              All muscle groups ready
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Complete a workout to track your recovery
            </p>
          </div>
        )}
      </CardContent>

      {/* Insights Section with Tabs */}
      <CardContent className="border-t pt-6">
        <Tabs
          value={isViewingToday ? insightsTab : "recent"}
          onValueChange={(v) =>
            handleInsightsTabChange(v as "recent" | "planning" | "readiness")
          }
          className="w-full"
        >
          <TabsList
            className={`grid w-full mb-4 ${isViewingToday ? "grid-cols-3" : "grid-cols-1"}`}
          >
            <TabsTrigger value="recent" className="text-xs gap-1 px-2">
              <Calendar className="size-3 hidden sm:block" />
              Recent Sessions
            </TabsTrigger>
            {isViewingToday && (
              <>
                <TabsTrigger value="planning" className="text-xs gap-1 px-2">
                  <TrendingUp className="size-3 hidden sm:block" />
                  Planning Insights
                </TabsTrigger>
                <TabsTrigger value="readiness" className="text-xs gap-1 px-2">
                  <Dumbbell className="size-3 hidden sm:block" />
                  Body Readiness
                </TabsTrigger>
              </>
            )}
          </TabsList>

          {/* Recent Sessions Tab */}
          {(insightsTab === "recent" || !isViewingToday) && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {isViewingToday
                  ? "Most recent workouts and the areas they targeted."
                  : `Workouts on ${selectedDate?.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}`}
              </p>
              {displaySessions.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="size-10 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {isViewingToday
                      ? "No recent workouts found"
                      : "No workouts on this date"}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {displaySessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-primary/10">
                          <Dumbbell className="size-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{session.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatRelativeTime(session.performedAt)}
                            {session.durationMinutes && (
                              <span className="ml-2">
                                • {session.durationMinutes} min
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 justify-end max-w-[150px]">
                        {session.bodyParts.slice(0, 3).map((part) => (
                          <Badge
                            key={part}
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0"
                          >
                            {part}
                          </Badge>
                        ))}
                        {session.bodyParts.length > 3 && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0"
                          >
                            +{session.bodyParts.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Planning Insights Tab */}
          {insightsTab === "planning" && isViewingToday && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Plan your next workout around areas with the highest readiness
                score.
              </p>

              {/* Recommended Focus */}
              <div className="p-4 rounded-lg border bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="size-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                    Recommended Focus
                  </span>
                </div>
                {detailedRecoveryStatus.filter((s) => s.status === "ready")
                  .length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {detailedRecoveryStatus
                      .filter((s) => s.status === "ready")
                      .slice(0, 5)
                      .map((part) => (
                        <Badge
                          key={part.name}
                          className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200"
                        >
                          {part.name}
                        </Badge>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No areas ready yet—check again soon.
                  </p>
                )}
              </div>

              {/* Next Up After Rest */}
              {detailedRecoveryStatus.filter(
                (s) => s.status === "rest" || s.status === "caution",
              ).length > 0 && (
                <div className="p-4 rounded-lg border">
                  <p className="text-sm font-medium mb-3">
                    Next up after rest:
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {detailedRecoveryStatus
                      .filter(
                        (s) => s.status === "rest" || s.status === "caution",
                      )
                      .sort(
                        (a, b) =>
                          (a.hoursUntilReady || 0) - (b.hoursUntilReady || 0),
                      )
                      .slice(0, 4)
                      .map((part) => (
                        <div
                          key={part.name}
                          className="flex items-center justify-between p-2 rounded bg-muted/50"
                        >
                          <span className="text-sm">{part.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {part.hoursUntilReady?.toFixed(1)}h
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Body Readiness Tab */}
          {insightsTab === "readiness" && isViewingToday && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Detailed recovery status for each muscle group.
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {detailedRecoveryStatus.map((part) => {
                  const statusColors = {
                    ready: {
                      bg: "bg-emerald-50 dark:bg-emerald-950/20",
                      border: "border-emerald-200 dark:border-emerald-900/50",
                      text: "text-emerald-600 dark:text-emerald-400",
                      badge:
                        "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200",
                    },
                    caution: {
                      bg: "bg-amber-50 dark:bg-amber-950/20",
                      border: "border-amber-200 dark:border-amber-900/50",
                      text: "text-amber-600 dark:text-amber-400",
                      badge:
                        "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-200",
                    },
                    rest: {
                      bg: "bg-rose-50 dark:bg-rose-950/20",
                      border: "border-rose-200 dark:border-rose-900/50",
                      text: "text-rose-600 dark:text-rose-400",
                      badge:
                        "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-200",
                    },
                    "worked-recently": {
                      bg: "bg-blue-50 dark:bg-blue-950/20",
                      border: "border-blue-200 dark:border-blue-900/50",
                      text: "text-blue-600 dark:text-blue-400",
                      badge:
                        "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200",
                    },
                  };
                  const colors = statusColors[part.status];
                  const statusLabel = {
                    ready: "Ready",
                    caution: "Caution",
                    rest: "Rest",
                    "worked-recently": "Recent",
                  };

                  return (
                    <div
                      key={part.name}
                      className={`p-3 rounded-lg border ${colors.bg} ${colors.border}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{part.name}</span>
                        <Badge className={colors.badge}>
                          {statusLabel[part.status]}
                        </Badge>
                      </div>
                      {part.status !== "ready" && (
                        <div className="space-y-1 text-xs text-muted-foreground">
                          {part.lastWorked && (
                            <p>
                              Last trained {formatRelativeTime(part.lastWorked)}
                            </p>
                          )}
                          {part.sets && <p>Avg. {part.sets} sets</p>}
                          {part.recommendedRest && (
                            <p>Recommended rest: {part.recommendedRest}h</p>
                          )}
                          {part.hoursUntilReady && part.hoursUntilReady > 0 && (
                            <p className={colors.text}>
                              Ready in {part.hoursUntilReady.toFixed(1)}h
                            </p>
                          )}
                        </div>
                      )}
                      {part.status === "ready" && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="size-3" />
                          Good to train
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Helper function to format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) {
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    return `about ${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} ago`;
  } else if (diffHours < 24) {
    return `about ${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  } else if (diffDays < 7) {
    return `about ${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }
}
