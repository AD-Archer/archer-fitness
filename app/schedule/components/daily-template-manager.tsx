"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Moon,
  Dumbbell,
  Zap,
  Bike,
  Footprints,
  Wind,
  Flame,
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
import { Textarea } from "@/components/ui/textarea";
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
import { WorkoutTemplateSelector } from "@/components/workout-template-selector";
import { useDailyTemplates, useWorkoutTemplates } from "../hooks/use-schedule";
import {
  DailyTemplate,
  DailyTemplateInput,
  TEMPLATE_COLORS,
  formatTime,
} from "../types";

export function DailyTemplateManager() {
  const {
    dailyTemplates,
    loading,
    error,
    fetchDailyTemplates,
    createDailyTemplate,
    updateDailyTemplate,
    deleteDailyTemplate,
  } = useDailyTemplates();

  const {
    workoutTemplates,
    loading: loadingWorkouts,
    fetchWorkoutTemplates,
  } = useWorkoutTemplates();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<DailyTemplate | null>(
    null,
  );
  const [templateToDelete, setTemplateToDelete] =
    useState<DailyTemplate | null>(null);
  const [formData, setFormData] = useState<DailyTemplateInput>({
    name: "",
    workoutTemplateId: null,
    startTime: "09:00",
    duration: 60,
    color: "#ef4444",
    isRestDay: false,
    notes: null,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchDailyTemplates();
    fetchWorkoutTemplates();
  }, [fetchDailyTemplates, fetchWorkoutTemplates]);

  const openCreateDialog = () => {
    setEditingTemplate(null);
    setFormData({
      name: "",
      workoutTemplateId: null,
      cardioType: null,
      startTime: "09:00",
      duration: 60,
      color: "#3b82f6",
      isRestDay: false,
      notes: null,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (template: DailyTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      workoutTemplateId: template.workoutTemplateId,
      cardioType: template.cardioType,
      startTime: template.startTime,
      duration: template.duration,
      color: template.color,
      isRestDay: template.isRestDay,
      notes: template.notes,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;
    if (
      !formData.isRestDay &&
      !formData.workoutTemplateId &&
      !formData.cardioType
    ) {
      return; // Require either workout or cardio for non-rest days
    }

    setIsSaving(true);
    try {
      if (editingTemplate) {
        await updateDailyTemplate(editingTemplate.id, formData);
      } else {
        await createDailyTemplate(formData);
      }
      setIsDialogOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!templateToDelete) return;
    await deleteDailyTemplate(templateToDelete.id);
    setIsDeleteDialogOpen(false);
    setTemplateToDelete(null);
  };

  const confirmDelete = (template: DailyTemplate) => {
    setTemplateToDelete(template);
    setIsDeleteDialogOpen(true);
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
          <h2 className="text-2xl font-bold">Daily Templates</h2>
          <p className="text-muted-foreground">
            Create workout days that you can use in your weekly schedule
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          New Daily Template
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
          {error}
        </div>
      )}

      {/* Templates Grid */}
      {dailyTemplates.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="bg-muted/50 p-4 rounded-full mb-6">
              <Dumbbell className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">No daily templates yet</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-sm">
              Create your first daily template to start building your weekly
              schedule.
              <br />
              <span className="text-sm">
                Examples: &quot;Upper Body Day&quot;, &quot;Leg Day&quot;,
                &quot;Cardio Session&quot;
              </span>
            </p>
            <Button
              onClick={openCreateDialog}
              size="lg"
              className="bg-red-600 hover:bg-red-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {dailyTemplates.map((template) => (
            <Card
              key={template.id}
              className="relative overflow-hidden hover:shadow-lg transition-shadow duration-200 group"
              style={{
                borderTop: `4px solid ${template.color}`,
                borderLeftWidth: 0,
              }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3 flex-1">
                    <div
                      className="p-2.5 rounded-lg flex-shrink-0"
                      style={{ backgroundColor: `${template.color}15` }}
                    >
                      {template.isRestDay ? (
                        <Moon className="h-5 w-5 text-amber-600" />
                      ) : (
                        <Dumbbell
                          className="h-5 w-5"
                          style={{ color: template.color }}
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg leading-tight">
                        {template.name}
                      </CardTitle>
                      {template.workoutTemplate && (
                        <CardDescription className="mt-1 text-sm font-medium">
                          {template.workoutTemplate.name}
                        </CardDescription>
                      )}
                      {template.cardioType && (
                        <CardDescription className="mt-1 flex items-center gap-1">
                          {template.cardioType === "bike" && (
                            <>
                              <Bike className="h-3.5 w-3.5" />
                              <span>Bike</span>
                            </>
                          )}
                          {template.cardioType === "walk" && (
                            <>
                              <Footprints className="h-3.5 w-3.5" />
                              <span>Walking</span>
                            </>
                          )}
                          {template.cardioType === "run" && (
                            <>
                              <Wind className="h-3.5 w-3.5" />
                              <span>Running</span>
                            </>
                          )}
                          {template.cardioType === "jump_rope" && (
                            <>
                              <Flame className="h-3.5 w-3.5" />
                              <span>Jump Rope</span>
                            </>
                          )}
                        </CardDescription>
                      )}
                    </div>
                  </div>
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
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {template.isRestDay ? (
                    <Badge
                      variant="secondary"
                      className="bg-amber-100 text-amber-900"
                    >
                      Rest Day
                    </Badge>
                  ) : (
                    <>
                      <Badge
                        variant="outline"
                        style={{
                          borderColor: template.color,
                          color: template.color,
                          backgroundColor: `${template.color}10`,
                        }}
                      >
                        {formatTime(template.startTime)}
                      </Badge>
                      <Badge
                        variant="outline"
                        style={{
                          borderColor: template.color,
                          color: template.color,
                          backgroundColor: `${template.color}10`,
                        }}
                      >
                        {template.duration} min
                      </Badge>
                      {template.cardioType ? (
                        <Badge
                          variant="secondary"
                          style={{
                            backgroundColor: `${template.color}25`,
                            color: template.color,
                          }}
                        >
                          {template.cardioType === "bike" && "Bike"}
                          {template.cardioType === "walk" && "Walking"}
                          {template.cardioType === "run" && "Running"}
                          {template.cardioType === "jump_rope" && "Jump Rope"}
                        </Badge>
                      ) : (
                        <>
                          {template.workoutTemplate?.category && (
                            <Badge
                              variant="secondary"
                              style={{
                                backgroundColor: `${template.color}25`,
                                color: template.color,
                              }}
                            >
                              {template.workoutTemplate.category}
                            </Badge>
                          )}
                          {template.workoutTemplate?.difficulty && (
                            <Badge
                              variant="outline"
                              style={{
                                borderColor: template.color,
                                color: template.color,
                                backgroundColor: `${template.color}10`,
                              }}
                            >
                              {template.workoutTemplate.difficulty}
                            </Badge>
                          )}
                        </>
                      )}
                    </>
                  )}
                </div>
                {template.notes && (
                  <p className="mt-3 text-sm text-muted-foreground line-clamp-2 bg-muted/30 p-2 rounded">
                    💡 {template.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate
                ? "Edit Daily Template"
                : "Create Daily Template"}
            </DialogTitle>
            <DialogDescription>
              {editingTemplate
                ? "Update your daily workout template"
                : "Create a new workout day to use in your weekly schedule"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 px-1 max-h-[60vh] overflow-y-auto scrollbar-hide">
            <div className="space-y-2">
              <Label htmlFor="name">Day Template Name</Label>
              <Input
                id="name"
                placeholder="e.g., Upper Body Day, Leg Day"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="restDay">Rest Day</Label>
                <p className="text-sm text-muted-foreground">
                  Mark as a recovery day with no workout
                </p>
              </div>
              <Switch
                id="restDay"
                checked={formData.isRestDay}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    isRestDay: checked,
                    workoutTemplateId: checked ? null : prev.workoutTemplateId,
                  }))
                }
              />
            </div>

            {!formData.isRestDay && (
              <>
                <div className="space-y-2">
                  <Label>Activity Type</Label>
                  <Select
                    value={
                      formData.workoutTemplateId
                        ? "workout"
                        : formData.cardioType
                          ? "cardio"
                          : "none"
                    }
                    onValueChange={(value) => {
                      if (value === "workout") {
                        setFormData((prev) => ({
                          ...prev,
                          cardioType: null,
                        }));
                      } else if (value === "cardio") {
                        setFormData((prev) => ({
                          ...prev,
                          workoutTemplateId: null,
                          cardioType: "bike",
                        }));
                      } else {
                        setFormData((prev) => ({
                          ...prev,
                          workoutTemplateId: null,
                          cardioType: null,
                        }));
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Activity</SelectItem>
                      <SelectItem value="workout">
                        <div className="flex items-center gap-2">
                          <Dumbbell className="h-4 w-4" />
                          Workout Template
                        </div>
                      </SelectItem>
                      <SelectItem value="cardio">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          Cardio
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {!formData.cardioType && (
                  <div className="space-y-2">
                    <Label>Workout Template</Label>
                    <WorkoutTemplateSelector
                      templates={workoutTemplates}
                      loading={loadingWorkouts}
                      placeholder="Search workouts..."
                      selectedId={formData.workoutTemplateId || undefined}
                      onSelect={(template) =>
                        setFormData((prev) => ({
                          ...prev,
                          workoutTemplateId: template.id,
                        }))
                      }
                      maxHeight="180px"
                    />
                    {formData.workoutTemplateId && (
                      <p className="text-xs text-muted-foreground">
                        Selected:{" "}
                        {
                          workoutTemplates.find(
                            (w) => w.id === formData.workoutTemplateId,
                          )?.name
                        }
                      </p>
                    )}
                  </div>
                )}

                {formData.cardioType && (
                  <div className="space-y-3 p-3 rounded-lg border bg-muted/30">
                    <div className="space-y-2">
                      <Label>Cardio Activity</Label>
                      <Select
                        value={formData.cardioType}
                        onValueChange={(value) =>
                          setFormData((prev) => ({
                            ...prev,
                            cardioType: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bike">
                            <div className="flex items-center gap-2">
                              <Bike className="h-4 w-4" />
                              Bike
                            </div>
                          </SelectItem>
                          <SelectItem value="walk">
                            <div className="flex items-center gap-2">
                              <Footprints className="h-4 w-4" />
                              Walking
                            </div>
                          </SelectItem>
                          <SelectItem value="run">
                            <div className="flex items-center gap-2">
                              <Wind className="h-4 w-4" />
                              Running
                            </div>
                          </SelectItem>
                          <SelectItem value="jump_rope">
                            <div className="flex items-center gap-2">
                              <Flame className="h-4 w-4" />
                              Jump Rope
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Duration set below
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={formData.startTime}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          startTime: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (min)</Label>
                    <Input
                      id="duration"
                      type="number"
                      min={5}
                      max={300}
                      value={formData.duration}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          duration: parseInt(e.target.value) || 60,
                        }))
                      }
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {TEMPLATE_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    className={`h-8 w-8 rounded-full border-2 transition-all ${
                      formData.color === c.value
                        ? "border-foreground scale-110"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: c.value }}
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, color: c.value }))
                    }
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this template..."
                value={formData.notes || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    notes: e.target.value || null,
                  }))
                }
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                !formData.name.trim() ||
                (!formData.isRestDay &&
                  !formData.workoutTemplateId &&
                  !formData.cardioType) ||
                isSaving
              }
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
            <AlertDialogTitle>Delete Daily Template?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{templateToDelete?.name}
              &quot;? This will also remove it from any weekly templates that
              use it.
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
