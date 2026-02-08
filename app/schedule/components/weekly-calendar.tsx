"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Trash2,
  Clock,
  Dumbbell,
  CalendarDays,
} from "lucide-react";
import { WeeklySchedule, ScheduleItem } from "../types/schedule";
import {
  formatTimeRangeForDisplay,
  type TimeFormatPreference,
} from "@/lib/time-utils";
import { cn } from "@/lib/utils";
import { DeleteScheduleItemDialog } from "./delete-schedule-item-dialog";

interface WeeklyCalendarProps {
  schedule: WeeklySchedule;
  onNavigateWeek: (direction: "prev" | "next") => void;
  onItemDelete: (
    itemId: string,
    deleteOption?: "this" | "future" | "all",
  ) => void;
  onClearWeek: () => void;
  onGoToCurrentWeek?: () => void;
  isLoading: boolean;
  completedSessions?: Array<{
    id: string;
    name: string;
    startTime: string;
    status: string;
  }>;
  timeFormat?: TimeFormatPreference;
}

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function WeeklyCalendar({
  schedule,
  onNavigateWeek,
  onItemDelete,
  onClearWeek,
  onGoToCurrentWeek,
  isLoading,
  completedSessions = [],
  timeFormat = "24h",
}: WeeklyCalendarProps) {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<ScheduleItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const isCurrentWeek = () => {
    const today = new Date();
    const todayWeekStart = getWeekStart(today);
    return todayWeekStart.toDateString() === schedule.weekStart.toDateString();
  };

  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - day); // Sunday = 0
    return d;
  };

  const isWorkoutCompleted = (item: { title: string; startTime: string }) => {
    // Check if there's a completed session that matches this scheduled workout
    return completedSessions.some((session) => {
      if (session.status !== "completed") return false;

      const sessionDate = new Date(session.startTime);
      // Compare dates (ignoring time)
      const itemDate = new Date(
        `${schedule.weekStart.toDateString()} ${item.startTime}`,
      );

      return (
        sessionDate.toDateString() === itemDate.toDateString() &&
        (session.name.toLowerCase().includes(item.title.toLowerCase()) ||
          item.title.toLowerCase().includes(session.name.toLowerCase()))
      );
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const formatTimeRange = (startTime: string, endTime: string) =>
    formatTimeRangeForDisplay(startTime, endTime, timeFormat);

  const getItemIcon = (type: string) => {
    switch (type) {
      case "workout":
        return <Dumbbell className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const getItemColor = (type: string) => {
    switch (type) {
      case "workout":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const weekRangeText = () => {
    const endDate = new Date(schedule.weekStart);
    endDate.setDate(endDate.getDate() + 6);

    return `${formatDate(schedule.weekStart)} - ${formatDate(endDate)}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Clock className="h-8 w-8 mx-auto mb-2 text-muted-foreground animate-spin" />
              <p className="text-muted-foreground">Loading schedule...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Weekly Schedule</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {weekRangeText()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigateWeek("prev")}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {!isCurrentWeek() && onGoToCurrentWeek && (
              <Button
                variant="outline"
                size="sm"
                onClick={onGoToCurrentWeek}
                className="hidden sm:flex"
              >
                <CalendarDays className="h-4 w-4 mr-1" />
                This Week
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigateWeek("next")}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={onClearWeek}
              className="ml-2"
            >
              <Trash2 className="h-4 w-4" />
              Clear Week
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
          {schedule.days.map((day, index) => (
            <div key={index} className="space-y-2">
              <div className="text-center p-2 bg-muted rounded-lg">
                <h3 className="font-semibold text-sm">{DAYS[day.dayOfWeek]}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDate(day.date)}
                </p>
              </div>

              <div className="space-y-2">
                {day.items.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground text-xs border border-dashed rounded-lg bg-muted/30">
                    Rest day
                  </div>
              ) : (
                  day.items.map((item) => {
                      const completed = isWorkoutCompleted(item);

                      return (
                  <div
                    key={item.id}
                    className={cn(
                      "p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md",
                      completed
                        ? "bg-green-100 border-green-300 dark:bg-green-900 dark:border-green-700"
                        : getItemColor(item.type),
                      selectedItem === item.id && "ring-2 ring-primary",
                    )}
                    onClick={() =>
                      setSelectedItem(
                        selectedItem === item.id ? null : item.id,
                      )
                    }
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 mt-0.5">
                        {getItemIcon(item.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm">{item.title}</div>
                        <div className="flex items-center gap-2 flex-wrap mt-1">
                          {completed && (
                            <Badge className="text-xs bg-green-200 text-green-900">✓ Done</Badge>
                          )}
                          {item.isFromGenerator && !completed && (
                            <Badge variant="secondary" className="text-xs">
                              AI
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2 pl-6">
                      {formatTimeRange(item.startTime, item.endTime)}
                    </div>
                    {item.duration && (
                      <div className="text-xs text-muted-foreground mt-1 pl-6">
                        {item.duration} min
                      </div>
                    )}
                    {selectedItem === item.id && (
                      <div className="mt-3 pt-3 border-t space-y-2 pl-6">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs text-red-600 hover:text-red-700 h-auto p-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            setItemToDelete(item);
                            setDeleteDialogOpen(true);
                            setSelectedItem(null);
                          }}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                        {item.description && (
                          <p className="text-xs text-muted-foreground">
                            {item.description}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>

      <DeleteScheduleItemDialog
        item={itemToDelete}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={(deleteOption) => {
          if (itemToDelete) {
            onItemDelete(itemToDelete.id, deleteOption);
            setItemToDelete(null);
          }
        }}
      />
    </Card>
  );
}
