"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Dumbbell,
  Clock,
  ArrowRight,
  CheckCircle2,
  Moon,
} from "lucide-react";
import { useEffect, useState, useMemo, useCallback } from "react";
import { logger } from "@/lib/logger";
import Link from "next/link";
import {
  formatTimeForDisplay,
  type TimeFormatPreference,
} from "@/lib/time-utils";
import { useUserPreferences } from "@/hooks/use-user-preferences";

// Types matching the new /api/schedule/calendar endpoint
interface CalendarWorkout {
  date: string;
  dayOfWeek: number;
  dailyTemplateId: string | null;
  dailyTemplateName: string | null;
  workoutTemplateId: string | null;
  workoutTemplateName: string | null;
  workoutCategory: string | null;
  workoutDifficulty: string | null;
  startTime: string;
  duration: number;
  color: string;
  isRestDay: boolean;
  activeScheduleId: string;
  activeScheduleName: string | null;
  isCompleted?: boolean;
  completionStatus?: string | null;
  completionNotes?: string | null;
}

interface CalendarResponse {
  workouts: CalendarWorkout[];
  startDate: string;
  endDate: string;
  totalDays: number;
  activeScheduleCount: number;
}

interface DayData {
  date: string;
  dayOfWeek: number;
  workouts: CalendarWorkout[];
}

const SHORT_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatDateForAPI(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function ScheduleOverview() {
  const [calendarData, setCalendarData] = useState<CalendarResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(() =>
    new Date().getDay(),
  );
  const { timeFormat } = useUserPreferences();

  const getWeekRange = useCallback(() => {
    const today = new Date();
    const day = today.getDay();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - day); // Sunday
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // Saturday

    // Also compute a "next 7 days" end for the upcoming stat
    const next7End = new Date(today);
    next7End.setDate(today.getDate() + 6);

    return { weekStart, weekEnd, today, next7End };
  }, []);

  useEffect(() => {
    const fetchCalendar = async () => {
      try {
        setLoading(true);
        setError(null);

        const { weekStart, next7End } = getWeekRange();
        // Fetch from week start through next 7 days (whichever is later)
        const fetchEnd =
          next7End > new Date(weekStart.getTime() + 6 * 86400000)
            ? next7End
            : new Date(weekStart.getTime() + 6 * 86400000);
        const startStr = formatDateForAPI(weekStart);
        const endStr = formatDateForAPI(fetchEnd);

        logger.info("Fetching calendar for dashboard:", { startStr, endStr });

        const res = await fetch(
          `/api/schedule/calendar?start=${startStr}&end=${endStr}`,
        );

        if (!res.ok) {
          throw new Error("Failed to load schedule");
        }

        const data: CalendarResponse = await res.json();
        setCalendarData(data);
      } catch (err) {
        logger.error("Error fetching calendar:", err);
        setError("Failed to load schedule data");
      } finally {
        setLoading(false);
      }
    };

    fetchCalendar();
  }, [getWeekRange]);

  // Organize workouts into days of the current week
  const weekDays = useMemo((): DayData[] => {
    const { weekStart } = getWeekRange();
    const days: DayData[] = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      return {
        date: formatDateForAPI(date),
        dayOfWeek: i,
        workouts: [],
      };
    });

    if (calendarData?.workouts) {
      for (const workout of calendarData.workouts) {
        const dayEntry = days.find((d) => d.date === workout.date);
        if (dayEntry) {
          dayEntry.workouts.push(workout);
        }
      }
      // Sort each day's workouts by start time
      for (const day of days) {
        day.workouts.sort((a, b) => a.startTime.localeCompare(b.startTime));
      }
    }

    return days;
  }, [calendarData, getWeekRange]);

  // Calculate stats from calendar data
  const stats = useMemo(() => {
    const currentDay = new Date().getDay();
    const todayStr = formatDateForAPI(new Date());

    // Planned: non-rest-day workouts this week
    const totalWorkouts = weekDays.reduce(
      (sum, day) => sum + day.workouts.filter((w) => !w.isRestDay).length,
      0,
    );

    // Upcoming 7 days: non-rest-day workouts from today onward in our fetched data
    const upcoming7Days = calendarData?.workouts
      ? calendarData.workouts.filter((w) => !w.isRestDay && w.date >= todayStr)
          .length
      : 0;

    // Total duration in minutes for the week (non-rest days only)
    const totalDuration = weekDays.reduce(
      (sum, day) =>
        sum +
        day.workouts
          .filter((w) => !w.isRestDay)
          .reduce((ds, w) => ds + (w.duration || 0), 0),
      0,
    );

    // Active schedule count
    const activeSchedules = calendarData?.activeScheduleCount ?? 0;

    return {
      totalWorkouts,
      upcoming7Days,
      totalDuration,
      activeSchedules,
      currentDay,
    };
  }, [weekDays, calendarData]);

  const currentDay = stats.currentDay;
  const selectedDayData = weekDays[selectedDay];
  // Filter to only actual workouts (non-rest) for the selected day
  const selectedDayWorkouts =
    selectedDayData?.workouts.filter((w) => !w.isRestDay) ?? [];
  const selectedDayIsRest = selectedDayWorkouts.length === 0;

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="h-6 bg-muted rounded animate-pulse w-48"></div>
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 bg-muted rounded animate-pulse"
              ></div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <p>{error}</p>
            <Button asChild variant="outline" className="mt-4" size="sm">
              <Link href="/schedule">
                <Calendar className="h-4 w-4 mr-2" />
                View Schedule
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2 sm:space-y-3">
      {/* Weekly Stats Card */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm sm:text-base">
              This Week&apos;s Schedule
            </CardTitle>
            <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
              <Link href="/schedule">
                View All
                <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          {stats.activeSchedules === 0 ? (
            <div className="text-center py-3 space-y-2">
              <p className="text-xs text-muted-foreground">
                No active schedule. Set one up to see your week here.
              </p>
              <Button
                asChild
                size="sm"
                variant="outline"
                className="h-7 text-xs"
              >
                <Link href="/schedule">
                  <Calendar className="h-3 w-3 mr-1" />
                  Set Up Schedule
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                <div className="text-xl sm:text-2xl font-bold text-blue-600">
                  {stats.totalWorkouts}
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                  Planned
                </p>
              </div>
              <div className="text-center p-2 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                <div className="text-xl sm:text-2xl font-bold text-green-600">
                  {stats.upcoming7Days}
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                  Upcoming 7d
                </p>
              </div>
              <div className="text-center p-2 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
                <div className="text-xl sm:text-2xl font-bold text-purple-600">
                  {Math.round(stats.totalDuration / 60)}h
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                  Duration
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Week at a Glance Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Week at a Glance</CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((day, index) => {
              const isToday = index === currentDay;
              const isSelected = index === selectedDay;
              const nonRestWorkouts = day.workouts.filter((w) => !w.isRestDay);
              const hasWorkouts = nonRestWorkouts.length > 0;
              // Pick the first workout's color for a subtle accent
              const accentColor = hasWorkouts
                ? nonRestWorkouts[0].color
                : undefined;
              return (
                <button
                  type="button"
                  key={index}
                  onClick={() => setSelectedDay(index)}
                  className={`group relative flex flex-col items-center justify-center rounded-md border p-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring
                    ${isSelected ? "bg-primary/10 border-primary" : isToday ? "bg-blue-50 dark:bg-blue-950 border-blue-300 dark:border-blue-700" : "bg-card border-muted"}
                  `}
                  aria-label={`${SHORT_DAYS[index]}: ${nonRestWorkouts.length} workout${nonRestWorkouts.length !== 1 ? "s" : ""}`}
                >
                  <span
                    className={`text-[10px] font-medium ${isSelected ? "text-primary" : isToday ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"}`}
                  >
                    {SHORT_DAYS[index]}
                  </span>
                  <span
                    className={`text-sm font-semibold leading-none mt-0.5 ${hasWorkouts ? (isSelected ? "text-primary" : "") : "text-muted-foreground/40"}`}
                  >
                    {nonRestWorkouts.length}
                  </span>
                  {hasWorkouts && (
                    <span
                      className="mt-0.5 h-0.5 w-4 rounded-full"
                      style={{
                        backgroundColor: isSelected ? undefined : accentColor,
                      }}
                    />
                  )}
                  {hasWorkouts && !isSelected && !accentColor && (
                    <span
                      className={`mt-0.5 h-0.5 w-4 rounded-full ${isToday ? "bg-blue-600" : "bg-primary/60"}`}
                    />
                  )}
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            Tap a day to view details below.
          </p>
        </CardContent>
      </Card>

      {/* Selected Day Details Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
            {selectedDay === currentDay
              ? "Today's Workouts"
              : `${SHORT_DAYS[selectedDay]} Workouts`}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pb-3">
          {!selectedDayIsRest ? (
            selectedDayWorkouts.map((workout, i) => (
              <div
                key={`${workout.activeScheduleId}-${workout.dailyTemplateId}-${i}`}
                className="flex items-start gap-2 p-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                {/* Color dot */}
                <div className="flex-shrink-0 mt-1">
                  <div
                    className="h-3 w-3 rounded-full border"
                    style={{ backgroundColor: workout.color }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="font-medium text-xs truncate">
                      {workout.dailyTemplateName ||
                        workout.workoutTemplateName ||
                        "Workout"}
                    </p>
                    {workout.workoutCategory && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1 py-0 h-3.5"
                      >
                        {workout.workoutCategory}
                      </Badge>
                    )}
                    {workout.workoutDifficulty && (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1 py-0 h-3.5"
                      >
                        {workout.workoutDifficulty}
                      </Badge>
                    )}
                    {workout.isCompleted && (
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {formatTimeForDisplay(
                        workout.startTime,
                        timeFormat as TimeFormatPreference,
                      )}
                    </span>
                    {workout.duration > 0 && (
                      <span>{workout.duration} min</span>
                    )}
                    {workout.activeScheduleName && (
                      <span
                        className="truncate max-w-[80px]"
                        title={workout.activeScheduleName}
                      >
                        {workout.activeScheduleName}
                      </span>
                    )}
                  </div>
                </div>
                {/* Link to start tracking if today */}
                {selectedDay === currentDay && !workout.isCompleted && (
                  <Button
                    asChild
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-[10px]"
                  >
                    <Link href="/track">
                      <Dumbbell className="h-2.5 w-2.5 mr-1" />
                      Start
                    </Link>
                  </Button>
                )}
              </div>
            ))
          ) : (
            <div className="text-center text-muted-foreground py-2">
              <Moon className="h-5 w-5 mx-auto mb-1 opacity-50" />
              <p className="text-xs mb-2">Rest day. Nothing planned.</p>
              <div className="flex flex-wrap justify-center gap-2">
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                >
                  <Link href="/schedule">Add Workout</Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  variant="secondary"
                  className="h-7 text-xs"
                >
                  <Link href="/generate">Generate Plan</Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
