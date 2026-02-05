"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Moon,
  Check,
  Play,
  Calendar as CalendarIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCalendar } from "../hooks/use-schedule";
import {
  CalendarWorkout,
  DAY_NAMES,
  DAY_NAMES_SHORT,
  formatTime,
  getWeekStartDate,
  getWeekEndDate,
  formatDateForAPI,
  addWeeks,
} from "../types";
import Link from "next/link";

interface DayCell {
  date: Date;
  dateStr: string;
  dayOfWeek: number;
  isToday: boolean;
  workouts: CalendarWorkout[];
}

export function ScheduleCalendar() {
  const { calendarData, loading, error, fetchCalendar } = useCalendar();
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(
    getWeekStartDate(new Date()),
  );
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [pickedDate, setPickedDate] = useState<string>(
    formatDateForAPI(currentWeekStart),
  );

  const loadWeek = useCallback(
    async (weekStart: Date) => {
      const start = formatDateForAPI(weekStart);
      const end = formatDateForAPI(getWeekEndDate(weekStart));
      await fetchCalendar(start, end);
    },
    [fetchCalendar],
  );

  useEffect(() => {
    loadWeek(currentWeekStart);
  }, [currentWeekStart, loadWeek]);

  const goToPreviousWeek = () => {
    setCurrentWeekStart((prev) => addWeeks(prev, -1));
  };

  const goToNextWeek = () => {
    setCurrentWeekStart((prev) => addWeeks(prev, 1));
  };

  const goToToday = () => {
    setCurrentWeekStart(getWeekStartDate(new Date()));
  };

  const handleDatePickerOpen = () => {
    setPickedDate(formatDateForAPI(currentWeekStart));
    setIsDatePickerOpen(true);
  };

  const handleDatePickerConfirm = () => {
    const selectedDate = new Date(pickedDate);
    const weekStart = getWeekStartDate(selectedDate);
    setCurrentWeekStart(weekStart);
    setIsDatePickerOpen(false);
  };

  const buildWeekDays = (): DayCell[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = formatDateForAPI(today);

    const days: DayCell[] = [];
    const workoutsByDate = new Map<string, CalendarWorkout[]>();

    // Group workouts by date
    if (calendarData?.workouts) {
      for (const workout of calendarData.workouts) {
        const existing = workoutsByDate.get(workout.date) || [];
        workoutsByDate.set(workout.date, [...existing, workout]);
      }
    }

    // Build 7 days starting from week start
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(date.getDate() + i);
      const dateStr = formatDateForAPI(date);

      days.push({
        date,
        dateStr,
        dayOfWeek: i,
        isToday: dateStr === todayStr,
        workouts: workoutsByDate.get(dateStr) || [],
      });
    }

    return days;
  };

  const weekDays = buildWeekDays();

  const formatWeekRange = (): string => {
    const end = getWeekEndDate(currentWeekStart);
    const startMonth = currentWeekStart.toLocaleDateString("en-US", {
      month: "short",
    });
    const endMonth = end.toLocaleDateString("en-US", { month: "short" });
    const startDay = currentWeekStart.getDate();
    const endDay = end.getDate();
    const year = currentWeekStart.getFullYear();

    if (startMonth === endMonth) {
      return `${startMonth} ${startDay} - ${endDay}, ${year}`;
    }
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
  };

  if (loading && !calendarData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Title and schedule count */}
            <div>
              <h2 className="text-2xl font-bold">Calendar</h2>
              <p className="text-muted-foreground text-sm">
                {calendarData?.activeScheduleCount || 0} active schedule
                {(calendarData?.activeScheduleCount || 0) !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Navigation controls - responsive layout */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
              <div className="flex items-center justify-center gap-1">
                <Button variant="ghost" size="icon" onClick={goToPreviousWeek}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDatePickerOpen}
                  className="gap-2"
                >
                  <CalendarIcon className="h-4 w-4" />
                  {formatWeekRange()}
                </Button>
                <Button variant="ghost" size="icon" onClick={goToNextWeek}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
          {error}
        </div>
      )}

      {/* No Active Schedules */}
      {calendarData?.activeScheduleCount === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground text-center mb-4">
              No active schedules. Activate a weekly template to see your
              workouts here.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Week View */}
      <div className="grid grid-cols-7 gap-2">
        {/* Day Headers */}
        {DAY_NAMES.map((day, i) => (
          <div
            key={day}
            className="text-center font-medium text-sm text-muted-foreground py-2"
          >
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{DAY_NAMES_SHORT[i]}</span>
          </div>
        ))}

        {/* Day Cells */}
        {weekDays.map((day) => (
          <Card
            key={day.dateStr}
            className={`min-h-[120px] ${
              day.isToday ? "ring-2 ring-primary" : ""
            }`}
          >
            <CardHeader className="p-2 pb-0">
              <CardTitle
                className={`text-sm ${
                  day.isToday ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {day.date.getDate()}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 pt-1 space-y-1">
              {day.workouts.length === 0 ? (
                <div className="text-xs text-muted-foreground italic text-center py-2">
                  Rest Day
                </div>
              ) : (
                day.workouts.map((workout, idx) => (
                  <WorkoutCard
                    key={`${workout.activeScheduleId}-${workout.date}-${idx}`}
                    workout={workout}
                    isToday={day.isToday}
                  />
                ))
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Loading overlay for navigation */}
      {loading && calendarData && (
        <div className="fixed inset-0 bg-background/50 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      )}

      {/* Date Picker Dialog */}
      <Dialog open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Jump to a week</DialogTitle>
            <DialogDescription>
              Select any date to view that week
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="datePicker">Select a date</Label>
              <Input
                id="datePicker"
                type="date"
                value={pickedDate}
                onChange={(e) => setPickedDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDatePickerOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleDatePickerConfirm}>Go to Week</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function WorkoutCard({
  workout,
  isToday,
}: {
  workout: CalendarWorkout;
  isToday: boolean;
}) {
  if (workout.isRestDay) {
    return (
      <div className="flex items-center gap-1 p-1.5 rounded bg-muted/50 text-xs">
        <Moon className="h-3 w-3 text-muted-foreground" />
        <span className="truncate text-muted-foreground">Rest</span>
      </div>
    );
  }

  return (
    <div
      className="relative p-1.5 rounded text-xs"
      style={{
        backgroundColor: `${workout.color}20`,
        borderLeft: `3px solid ${workout.color}`,
      }}
    >
      <div className="flex items-center gap-1">
        {workout.isCompleted ? (
          <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
        ) : (
          <Dumbbell
            className="h-3 w-3 flex-shrink-0"
            style={{ color: workout.color }}
          />
        )}
        <span className="font-medium truncate" style={{ color: workout.color }}>
          {workout.dailyTemplateName || workout.workoutTemplateName}
        </span>
      </div>
      <div className="text-[10px] text-muted-foreground mt-0.5">
        {formatTime(workout.startTime)} • {workout.duration}min
      </div>
      {/* Start Workout Button for today's incomplete workouts */}
      {isToday && !workout.isCompleted && workout.workoutTemplateId && (
        <Link
          href={`/track?templateId=${workout.workoutTemplateId}`}
          className="absolute -right-1 -top-1"
        >
          <Badge
            variant="default"
            className="h-5 w-5 p-0 flex items-center justify-center rounded-full"
          >
            <Play className="h-2.5 w-2.5" />
          </Badge>
        </Link>
      )}
    </div>
  );
}
