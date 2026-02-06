"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Calendar,
  GripVertical,
  Moon,
  Dumbbell,
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
import { useWeeklyTemplates, useDailyTemplates } from "../hooks/use-schedule";
import {
  WeeklyTemplate,
  WeeklyTemplateInput,
  DailyTemplate,
  DAY_NAMES,
  DAY_NAMES_SHORT,
} from "../types";

interface DayAssignment {
  dayOfWeek: number;
  dailyTemplateId: string | null;
  overrideTime: string | null;
}

const DEFAULT_DAYS: DayAssignment[] = Array.from({ length: 7 }, (_, i) => ({
  dayOfWeek: i,
  dailyTemplateId: null,
  overrideTime: null,
}));

export function WeeklyTemplateBuilder() {
  const {
    weeklyTemplates,
    loading,
    error,
    fetchWeeklyTemplates,
    createWeeklyTemplate,
    updateWeeklyTemplate,
    deleteWeeklyTemplate,
  } = useWeeklyTemplates();

  const { dailyTemplates, fetchDailyTemplates } = useDailyTemplates();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WeeklyTemplate | null>(
    null,
  );
  const [templateToDelete, setTemplateToDelete] =
    useState<WeeklyTemplate | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    description: string | null;
    days: DayAssignment[];
  }>({
    name: "",
    description: null,
    days: [...DEFAULT_DAYS],
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchWeeklyTemplates();
    fetchDailyTemplates();
  }, [fetchWeeklyTemplates, fetchDailyTemplates]);

  const openCreateDialog = () => {
    setEditingTemplate(null);
    setFormData({
      name: "",
      description: null,
      days: [...DEFAULT_DAYS],
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (template: WeeklyTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description,
      days: template.days.map((d) => ({
        dayOfWeek: d.dayOfWeek,
        dailyTemplateId: d.dailyTemplateId,
        overrideTime: d.overrideTime,
      })),
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;

    setIsSaving(true);
    try {
      const input: WeeklyTemplateInput = {
        name: formData.name,
        description: formData.description,
        days: formData.days,
      };

      if (editingTemplate) {
        await updateWeeklyTemplate(editingTemplate.id, input);
      } else {
        await createWeeklyTemplate(input);
      }
      setIsDialogOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!templateToDelete) return;
    await deleteWeeklyTemplate(templateToDelete.id);
    setIsDeleteDialogOpen(false);
    setTemplateToDelete(null);
  };

  const confirmDelete = (template: WeeklyTemplate) => {
    setTemplateToDelete(template);
    setIsDeleteDialogOpen(true);
  };

  const updateDayAssignment = (
    dayOfWeek: number,
    dailyTemplateId: string | null,
  ) => {
    setFormData((prev) => ({
      ...prev,
      days: prev.days.map((d) =>
        d.dayOfWeek === dayOfWeek ? { ...d, dailyTemplateId } : d,
      ),
    }));
  };

  const getDailyTemplateById = (
    id: string | null,
  ): DailyTemplate | undefined => {
    if (!id) return undefined;
    return dailyTemplates.find((dt) => dt.id === id);
  };

  const getWorkoutDaysCount = (template: WeeklyTemplate): number => {
    return template.days.filter(
      (d) => d.dailyTemplate && !d.dailyTemplate.isRestDay,
    ).length;
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
          <h2 className="text-2xl font-bold">Weekly Templates</h2>
          <p className="text-muted-foreground">
            Build your perfect week by assigning daily templates to each day
          </p>
        </div>
        <Button
          onClick={openCreateDialog}
          disabled={dailyTemplates.length === 0}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Weekly Template
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
          {error}
        </div>
      )}

      {dailyTemplates.length === 0 && (
        <div className="p-4 bg-muted/50 rounded-lg text-center">
          <p className="text-muted-foreground">
            You need to create some daily templates first before building a
            weekly schedule.
          </p>
        </div>
      )}

      {/* Templates Grid */}
      {weeklyTemplates.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="bg-muted/50 p-4 rounded-full mb-6">
              <Calendar className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">No weekly templates yet</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-sm">
              Create a weekly template to organize your daily workouts into a
              repeatable schedule.
              <br />
              <span className="text-sm">
                Examples: &quot;Push Pull Legs&quot;, &quot;Upper Lower
                Split&quot;, &quot;5-Day Bro Split&quot;
              </span>
            </p>
            {dailyTemplates.length > 0 && (
              <Button
                onClick={openCreateDialog}
                size="lg"
                className="bg-red-600 hover:bg-red-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Weekly Template
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {weeklyTemplates.map((template) => (
            <Card
              key={template.id}
              className="overflow-hidden hover:shadow-lg transition-shadow duration-200 group"
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="p-2.5 rounded-lg bg-red-50">
                      <Calendar className="h-5 w-5 text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {template.name}
                      </CardTitle>
                      {template.description && (
                        <CardDescription className="mt-1">
                          {template.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge className="bg-red-100 text-red-900 border-red-200">
                      <Dumbbell className="h-3 w-3 mr-1" />
                      {getWorkoutDaysCount(template)} workout days
                    </Badge>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEditDialog(template)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => confirmDelete(template)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-2">
                  {template.days.map((day) => {
                    const dt = day.dailyTemplate;
                    const isRest = dt?.isRestDay ?? true;
                    return (
                      <div
                        key={day.dayOfWeek}
                        className={`p-3 rounded-lg border-2 text-center transition-all hover:shadow-md ${
                          isRest
                            ? "bg-muted/40 border-muted-foreground/20"
                            : "border-2 hover:shadow-lg"
                        }`}
                        style={{
                          borderColor: !isRest
                            ? dt?.color || "#ef4444"
                            : undefined,
                          backgroundColor:
                            !isRest && dt?.color ? `${dt.color}08` : undefined,
                        }}
                      >
                        <div className="text-xs font-bold text-muted-foreground mb-2 tracking-wide uppercase">
                          {DAY_NAMES_SHORT[day.dayOfWeek]}
                        </div>
                        {dt ? (
                          <div className="flex flex-col items-center gap-2">
                            <div
                              className={`p-2 rounded-lg ${
                                isRest ? "bg-amber-100" : ""
                              }`}
                              style={{
                                backgroundColor:
                                  !isRest && dt?.color
                                    ? `${dt.color}20`
                                    : undefined,
                              }}
                            >
                              {isRest ? (
                                <Moon className="h-5 w-5 text-amber-600" />
                              ) : (
                                <Dumbbell
                                  className="h-5 w-5"
                                  style={{ color: dt.color }}
                                />
                              )}
                            </div>
                            <div className="w-full">
                              <div
                                className="text-xs font-bold truncate leading-tight"
                                style={{
                                  color: !isRest ? dt?.color : "#6b7280",
                                }}
                              >
                                {dt.name}
                              </div>
                              {!isRest && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {dt.duration}min
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground italic py-1">
                            Rest
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate
                ? "Edit Weekly Template"
                : "Create Weekly Template"}
            </DialogTitle>
            <DialogDescription>
              Assign your daily templates to each day of the week
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Push Pull Legs"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Input
                  id="description"
                  placeholder="Brief description..."
                  value={formData.description || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value || null,
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Weekly Schedule</Label>
              <div className="grid gap-2">
                {formData.days.map((day) => {
                  const selectedDaily = getDailyTemplateById(
                    day.dailyTemplateId,
                  );
                  return (
                    <div
                      key={day.dayOfWeek}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <div className="w-24 font-medium">
                        {DAY_NAMES[day.dayOfWeek]}
                      </div>
                      <Select
                        value={day.dailyTemplateId || "rest"}
                        onValueChange={(value) =>
                          updateDayAssignment(
                            day.dayOfWeek,
                            value === "rest" ? null : value,
                          )
                        }
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select a daily template..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rest">
                            <div className="flex items-center gap-2">
                              <Moon className="h-4 w-4" />
                              <span>Rest Day</span>
                            </div>
                          </SelectItem>
                          {dailyTemplates.map((dt) => (
                            <SelectItem key={dt.id} value={dt.id}>
                              <div className="flex items-center gap-2">
                                {dt.isRestDay ? (
                                  <Moon className="h-4 w-4" />
                                ) : (
                                  <Dumbbell
                                    className="h-4 w-4"
                                    style={{ color: dt.color }}
                                  />
                                )}
                                <span>{dt.name}</span>
                                {dt.workoutTemplate && (
                                  <span className="text-xs text-muted-foreground">
                                    ({dt.workoutTemplate.name})
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedDaily && !selectedDaily.isRestDay && (
                        <Badge
                          variant="outline"
                          style={{
                            borderColor: selectedDaily.color,
                            color: selectedDaily.color,
                          }}
                        >
                          {selectedDaily.duration} min
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.name.trim() || isSaving}
            >
              {isSaving
                ? "Saving..."
                : editingTemplate
                  ? "Save Changes"
                  : "Create Template"}
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
            <AlertDialogTitle>Delete Weekly Template?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{templateToDelete?.name}
              &quot;? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
