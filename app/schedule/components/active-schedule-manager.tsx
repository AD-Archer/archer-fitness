"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Play,
  Pause,
  Trash2,
  Calendar,
  CalendarCheck,
  Infinity,
  Clock,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useActiveSchedules, useWeeklyTemplates } from "../hooks/use-schedule";
import {
  ActiveSchedule,
  WeeklyTemplate,
  DAY_NAMES_SHORT,
  formatDateForAPI,
} from "../types";

export function ActiveScheduleManager() {
  const {
    activeSchedules,
    loading,
    error,
    fetchActiveSchedules,
    activateSchedule,
    updateActiveSchedule,
    deleteActiveSchedule,
  } = useActiveSchedules();

  const {
    weeklyTemplates,
    loading: loadingWeekly,
    fetchWeeklyTemplates,
  } = useWeeklyTemplates();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] =
    useState<ActiveSchedule | null>(null);
  const [showInactive, setShowInactive] = useState(true);

  // Helper to get tomorrow's date
  const getTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  };

  const [formData, setFormData] = useState({
    weeklyTemplateId: "",
    name: "",
    startDate: formatDateForAPI(getTomorrow()),
    hasEndDate: false,
    endDate: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchActiveSchedules(false);
    fetchWeeklyTemplates();
  }, [fetchActiveSchedules, fetchWeeklyTemplates]);

  const openCreateDialog = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setFormData({
      weeklyTemplateId: weeklyTemplates[0]?.id || "",
      name: "",
      startDate: formatDateForAPI(tomorrow),
      hasEndDate: false,
      endDate: "",
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.weeklyTemplateId) return;

    setIsSaving(true);
    try {
      await activateSchedule({
        weeklyTemplateId: formData.weeklyTemplateId,
        name: formData.name || undefined,
        startDate: formData.startDate,
        endDate:
          formData.hasEndDate && formData.endDate ? formData.endDate : null,
      });
      setIsDialogOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (schedule: ActiveSchedule) => {
    await updateActiveSchedule(schedule.id, { isActive: !schedule.isActive });
  };

  const handleDelete = async () => {
    if (!scheduleToDelete) return;
    await deleteActiveSchedule(scheduleToDelete.id);
    setIsDeleteDialogOpen(false);
    setScheduleToDelete(null);
  };

  const confirmDelete = (schedule: ActiveSchedule) => {
    setScheduleToDelete(schedule);
    setIsDeleteDialogOpen(true);
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getSelectedTemplate = (): WeeklyTemplate | undefined => {
    return weeklyTemplates.find((t) => t.id === formData.weeklyTemplateId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Schedules</h2>
          <p className="text-muted-foreground">
            Manage your workout schedules and templates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowInactive(!showInactive)}
          >
            {showInactive ? (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                Hide Inactive
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Show Inactive
              </>
            )}
          </Button>
          <Button
            onClick={openCreateDialog}
            disabled={weeklyTemplates.length === 0}
          >
            <Plus className="h-4 w-4 mr-2" />
            Activate Schedule
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
          {error}
        </div>
      )}

      {weeklyTemplates.length === 0 && (
        <div className="p-4 bg-muted/50 rounded-lg text-center">
          <p className="text-muted-foreground">
            You need to create a weekly template first before activating a
            schedule.
          </p>
        </div>
      )}

      {/* Active Schedules List */}
      {activeSchedules.filter((schedule) => showInactive || schedule.isActive)
        .length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CalendarCheck className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {showInactive ? "No schedules" : "No active schedules"}
            </h3>

            <p className="text-muted-foreground text-center mb-4">
              {showInactive
                ? "Create and activate weekly templates to schedule your workouts."
                : "Activate a weekly template to start scheduling your workouts."}
              <br />
              Your workouts will automatically appear on your calendar.
            </p>
            {weeklyTemplates.length > 0 && (
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Activate Your First Schedule
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {activeSchedules
            .filter((schedule) => showInactive || schedule.isActive)
            .map((schedule) => (
              <Card
                key={schedule.id}
                className={schedule.isActive ? "" : "opacity-60"}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          schedule.isActive
                            ? "bg-green-100 dark:bg-green-900/30"
                            : "bg-muted"
                        }`}
                      >
                        {schedule.isActive ? (
                          <Play className="h-5 w-5 text-green-600" />
                        ) : (
                          <Pause className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {schedule.name || schedule.weeklyTemplate.name}
                          {schedule.isActive && (
                            <Badge className="bg-green-500">Active</Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {schedule.weeklyTemplate.name}
                          {schedule.weeklyTemplate.description &&
                            ` • ${schedule.weeklyTemplate.description}`}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={schedule.isActive ? "outline" : "default"}
                        size="sm"
                        onClick={() => handleToggleActive(schedule)}
                        className={
                          schedule.isActive
                            ? ""
                            : "bg-blue-600 hover:bg-blue-700 text-white"
                        }
                      >
                        {schedule.isActive ? (
                          <>
                            <Pause className="h-4 w-4 mr-1" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-1" />
                            Resume
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => confirmDelete(schedule)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Starts: {formatDate(schedule.startDate)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {schedule.endDate ? (
                        <>
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>Ends: {formatDate(schedule.endDate)}</span>
                        </>
                      ) : (
                        <>
                          <Infinity className="h-4 w-4 text-muted-foreground" />
                          <span>Repeats indefinitely</span>
                        </>
                      )}
                    </div>
                  </div>
                  {/* Mini Week Preview */}
                  <div className="mt-4 grid grid-cols-7 gap-1">
                    {schedule.weeklyTemplate.days.map((day) => {
                      const dt = day.dailyTemplate;
                      const isRest = dt?.isRestDay ?? true;
                      return (
                        <div
                          key={day.dayOfWeek}
                          className={`p-1 rounded text-center text-xs ${
                            isRest ? "bg-muted/50" : ""
                          }`}
                          style={{
                            backgroundColor:
                              !isRest && dt?.color
                                ? `${dt.color}20`
                                : undefined,
                          }}
                        >
                          <div className="font-medium text-muted-foreground">
                            {DAY_NAMES_SHORT[day.dayOfWeek]}
                          </div>
                          <div
                            className="truncate"
                            style={{ color: !isRest ? dt?.color : undefined }}
                          >
                            {isRest ? "Rest" : dt?.name?.split(" ")[0]}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {/* Activate Schedule Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Activate Schedule</DialogTitle>
            <DialogDescription>
              Choose a weekly template and set when it should start
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="template">Weekly Template</Label>
              <Select
                value={formData.weeklyTemplateId}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, weeklyTemplateId: value }))
                }
                disabled={loadingWeekly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a template..." />
                </SelectTrigger>
                <SelectContent>
                  {weeklyTemplates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      <div className="flex flex-col">
                        <span>{t.name}</span>
                        {t.description && (
                          <span className="text-xs text-muted-foreground">
                            {t.description}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Preview selected template */}
            {getSelectedTemplate() && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="grid grid-cols-7 gap-1 text-xs">
                  {getSelectedTemplate()!.days.map((day) => {
                    const dt = day.dailyTemplate;
                    const isRest = dt?.isRestDay ?? true;
                    return (
                      <div key={day.dayOfWeek} className="text-center">
                        <div className="font-medium">
                          {DAY_NAMES_SHORT[day.dayOfWeek]}
                        </div>
                        <div
                          className={`mt-1 mx-auto flex h-6 w-6 items-center justify-center rounded text-sm leading-none sm:h-7 sm:w-7 sm:text-base ${isRest ? "bg-muted" : ""}`}
                          style={{
                            backgroundColor:
                              !isRest && dt?.color
                                ? `${dt.color}30`
                                : undefined,
                          }}
                        >
                          {isRest ? "🌙" : "💪"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Custom Name (optional)</Label>
              <Input
                id="name"
                placeholder="e.g., January Training Block"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="startDate">Start Date</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-auto py-1 px-2 text-xs"
                  onClick={() => {
                    const today = new Date();
                    setFormData((prev) => ({
                      ...prev,
                      startDate: formatDateForAPI(today),
                    }));
                  }}
                >
                  Start Today
                </Button>
              </div>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    startDate: e.target.value,
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Defaults to tomorrow. Click "Start Today" to begin immediately.
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="hasEndDate">Set End Date</Label>
                <p className="text-sm text-muted-foreground">
                  Leave off to repeat indefinitely
                </p>
              </div>
              <Switch
                id="hasEndDate"
                checked={formData.hasEndDate}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, hasEndDate: checked }))
                }
              />
            </div>

            {formData.hasEndDate && (
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  min={formData.startDate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      endDate: e.target.value,
                    }))
                  }
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.weeklyTemplateId || isSaving}
            >
              {isSaving ? "Activating..." : "Activate Schedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Schedule?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this active schedule? The
              underlying weekly template will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
