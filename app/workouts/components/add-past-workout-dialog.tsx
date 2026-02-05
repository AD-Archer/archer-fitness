"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Calendar as CalendarIcon,
  ClipboardList,
  Dumbbell,
  Plus,
  Trash2,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { WorkoutTemplateSelector } from "@/components/workout-template-selector";
import { cn } from "@/lib/utils";
import { ExerciseSelector } from "@/app/track/components/exercise-selector";
import { transformTemplateFromAPI } from "@/app/track/utils/workoutUtils";
import type { WorkoutTemplate } from "@/app/track/types/workout";

type ManualSet = {
  id: string;
  reps?: string;
  duration?: string;
  weight?: string;
  restTime?: string;
};

type ManualExercise = {
  id: string;
  exerciseId?: string;
  name: string;
  targetSets: string;
  targetReps: string;
  targetType: "reps" | "time";
  sets: ManualSet[];
};

interface AddPastWorkoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

const buildTimeValue = (date: Date) => {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

const mergeDateAndTime = (date: Date, timeValue: string) => {
  const [hours, minutes] = timeValue
    .split(":")
    .map((val) => Number.parseInt(val, 10));
  const merged = new Date(date);
  merged.setHours(
    Number.isFinite(hours) ? hours : 0,
    Number.isFinite(minutes) ? minutes : 0,
    0,
    0,
  );
  return merged;
};

const parseTargetValue = (targetReps: string, targetType: "reps" | "time") => {
  if (!targetReps) return targetType === "time" ? 30 : 8;
  const match = targetReps.match(/(\d+)/);
  if (!match) return targetType === "time" ? 30 : 8;
  const base = Number.parseInt(match[1], 10);
  if (targetType === "time" && /min/i.test(targetReps)) {
    return base * 60;
  }
  return base;
};

export function AddPastWorkoutDialog({
  open,
  onOpenChange,
  onCreated,
}: AddPastWorkoutDialogProps) {
  const [activeTab, setActiveTab] = useState<"template" | "manual">("template");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>(
    buildTimeValue(new Date()),
  );
  const [durationMinutes, setDurationMinutes] = useState<string>("");
  const [workoutName, setWorkoutName] = useState("");
  const [notes, setNotes] = useState("");
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [autoFillSets, setAutoFillSets] = useState(true);
  const [manualExercises, setManualExercises] = useState<ManualExercise[]>([]);
  const [templateSetOverrides, setTemplateSetOverrides] = useState<
    Record<string, ManualSet[]>
  >({});
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedTemplate = useMemo(
    () =>
      templates.find((template) => template.id === selectedTemplateId) || null,
    [templates, selectedTemplateId],
  );

  useEffect(() => {
    if (!open) return;

    const initDate = new Date();
    setSelectedDate(initDate);
    setSelectedTime(buildTimeValue(initDate));
    setDurationMinutes("");
    setWorkoutName("");
    setNotes("");
    setActiveTab("template");
    setSelectedTemplateId("");
    setAutoFillSets(true);
    setManualExercises([]);
    setTemplateSetOverrides({});
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const loadTemplates = async () => {
      setTemplatesLoading(true);
      try {
        const res = await fetch(
          "/api/workout-tracker/workout-templates?limit=100",
        );
        if (!res.ok) throw new Error("Failed to load workouts");
        const data = await res.json();
        const all = [
          ...(data.userTemplates || []),
          ...(data.predefinedTemplates || []),
        ];
        setTemplates(transformTemplateFromAPI(all));
      } catch {
        toast.error("Unable to load your workouts.");
      } finally {
        setTemplatesLoading(false);
      }
    };

    loadTemplates();
  }, [open]);

  useEffect(() => {
    if (selectedTemplate && activeTab === "template") {
      setWorkoutName(selectedTemplate.name);
    }
  }, [selectedTemplate, activeTab]);

  useEffect(() => {
    setTemplateSetOverrides({});
  }, [selectedTemplateId]);

  const handleAddExercise = (exercise: { id: string; name: string }) => {
    setManualExercises((prev) => [
      ...prev,
      {
        id: `${exercise.id}-${Date.now()}`,
        exerciseId: exercise.id,
        name: exercise.name,
        targetSets: "3",
        targetReps: "8-12",
        targetType: "reps",
        sets: [
          {
            id: `${exercise.id}-set-${Date.now()}`,
            reps: "10",
            weight: "",
            restTime: "",
          },
        ],
      },
    ]);
    setShowExerciseSelector(false);
  };

  const updateManualExercise = (
    exerciseId: string,
    updates: Partial<ManualExercise>,
  ) => {
    setManualExercises((prev) =>
      prev.map((exercise) =>
        exercise.id === exerciseId ? { ...exercise, ...updates } : exercise,
      ),
    );
  };

  const removeManualExercise = (exerciseId: string) => {
    setManualExercises((prev) =>
      prev.filter((exercise) => exercise.id !== exerciseId),
    );
  };

  const addSetToExercise = (exerciseId: string) => {
    setManualExercises((prev) =>
      prev.map((exercise) => {
        if (exercise.id !== exerciseId) return exercise;
        return {
          ...exercise,
          sets: [
            ...exercise.sets,
            {
              id: `${exerciseId}-set-${Date.now()}`,
              reps: "",
              duration: "",
              weight: "",
              restTime: "",
            },
          ],
        };
      }),
    );
  };

  const updateManualSet = (
    exerciseId: string,
    setId: string,
    updates: Partial<ManualSet>,
  ) => {
    setManualExercises((prev) =>
      prev.map((exercise) => {
        if (exercise.id !== exerciseId) return exercise;
        return {
          ...exercise,
          sets: exercise.sets.map((set) =>
            set.id === setId ? { ...set, ...updates } : set,
          ),
        };
      }),
    );
  };

  const removeManualSet = (exerciseId: string, setId: string) => {
    setManualExercises((prev) =>
      prev.map((exercise) => {
        if (exercise.id !== exerciseId) return exercise;
        return {
          ...exercise,
          sets: exercise.sets.filter((set) => set.id !== setId),
        };
      }),
    );
  };

  const addTemplateSet = (exerciseId: string) => {
    setTemplateSetOverrides((prev) => ({
      ...prev,
      [exerciseId]: [
        ...(prev[exerciseId] || []),
        {
          id: `${exerciseId}-set-${Date.now()}`,
          reps: "",
          duration: "",
          weight: "",
          restTime: "",
        },
      ],
    }));
  };

  const updateTemplateSet = (
    exerciseId: string,
    setId: string,
    updates: Partial<ManualSet>,
  ) => {
    setTemplateSetOverrides((prev) => ({
      ...prev,
      [exerciseId]: (prev[exerciseId] || []).map((set) =>
        set.id === setId ? { ...set, ...updates } : set,
      ),
    }));
  };

  const removeTemplateSet = (exerciseId: string, setId: string) => {
    setTemplateSetOverrides((prev) => ({
      ...prev,
      [exerciseId]: (prev[exerciseId] || []).filter((set) => set.id !== setId),
    }));
  };

  const buildPayload = () => {
    const startTime = mergeDateAndTime(selectedDate, selectedTime);
    const durationValue = durationMinutes
      ? Number.parseInt(durationMinutes, 10)
      : NaN;
    const durationSeconds = Number.isFinite(durationValue)
      ? durationValue * 60
      : undefined;
    const endTime =
      durationSeconds && durationSeconds > 0
        ? new Date(startTime.getTime() + durationSeconds * 1000)
        : undefined;

    if (!workoutName.trim()) {
      throw new Error("Workout name is required.");
    }

    if (activeTab === "template") {
      if (!selectedTemplate) {
        throw new Error("Select a workout template first.");
      }

      const exercises = selectedTemplate.exercises.map((exercise) => {
        const targetType = (exercise.targetType || "reps") as "reps" | "time";
        const targetValue = parseTargetValue(exercise.targetReps, targetType);
        const sets = autoFillSets
          ? Array.from({ length: Math.max(exercise.targetSets, 1) }).map(
              (_, index) => ({
                reps: targetType === "time" ? undefined : targetValue,
                duration: targetType === "time" ? targetValue : undefined,
                weight: undefined,
                restTime: undefined,
                notes:
                  index === 0 && exercise.instructions
                    ? exercise.instructions
                    : undefined,
              }),
            )
          : (() => {
              const overrides = templateSetOverrides[exercise.id] || [];
              const cleaned = overrides
                .map((set) => {
                  const reps = set.reps
                    ? Number.parseInt(set.reps, 10)
                    : undefined;
                  const duration = set.duration
                    ? Number.parseInt(set.duration, 10)
                    : undefined;
                  const weight = set.weight
                    ? Number.parseFloat(set.weight)
                    : undefined;
                  const restTime = set.restTime
                    ? Number.parseInt(set.restTime, 10)
                    : undefined;

                  if (!reps && !duration) return null;
                  return {
                    reps: reps || undefined,
                    duration: duration || undefined,
                    weight: Number.isFinite(weight) ? weight : undefined,
                    restTime: Number.isFinite(restTime) ? restTime : undefined,
                  };
                })
                .filter(Boolean);

              if (cleaned.length === 0) {
                throw new Error(`Add at least one set for ${exercise.name}.`);
              }

              return cleaned;
            })();

        return {
          exerciseId: exercise.id,
          name: exercise.name,
          targetSets: exercise.targetSets,
          targetReps: exercise.targetReps,
          targetType,
          notes: exercise.instructions,
          sets,
        };
      });

      return {
        workoutTemplateId: selectedTemplate.id,
        name: workoutName.trim(),
        description: selectedTemplate.description,
        exercises,
        status: "completed",
        startTime: startTime.toISOString(),
        endTime: endTime ? endTime.toISOString() : undefined,
        duration: durationSeconds,
        notes: notes.trim() || undefined,
      };
    }

    if (manualExercises.length === 0) {
      throw new Error("Add at least one exercise.");
    }

    const exercises = manualExercises.map((exercise) => {
      const cleanedSets = exercise.sets
        .map((set) => {
          const reps = set.reps ? Number.parseInt(set.reps, 10) : undefined;
          const duration = set.duration
            ? Number.parseInt(set.duration, 10)
            : undefined;
          const weight = set.weight ? Number.parseFloat(set.weight) : undefined;
          const restTime = set.restTime
            ? Number.parseInt(set.restTime, 10)
            : undefined;

          if (!reps && !duration) return null;
          return {
            reps: reps || undefined,
            duration: duration || undefined,
            weight: Number.isFinite(weight) ? weight : undefined,
            restTime: Number.isFinite(restTime) ? restTime : undefined,
          };
        })
        .filter(Boolean);

      if (cleanedSets.length === 0) {
        throw new Error(`Add at least one set for ${exercise.name}.`);
      }

      const targetSetsValue = Number.parseInt(exercise.targetSets, 10);
      const targetSets =
        Number.isFinite(targetSetsValue) && targetSetsValue > 0
          ? targetSetsValue
          : cleanedSets.length;

      return {
        exerciseId: exercise.exerciseId,
        name: exercise.name,
        targetSets,
        targetReps: exercise.targetReps || "8-12",
        targetType: exercise.targetType,
        sets: cleanedSets,
      };
    });

    return {
      name: workoutName.trim(),
      exercises,
      status: "completed",
      startTime: startTime.toISOString(),
      endTime: endTime ? endTime.toISOString() : undefined,
      duration: durationSeconds,
      notes: notes.trim() || undefined,
    };
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      const payload = buildPayload();

      const response = await fetch("/api/workout-tracker/workout-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to log workout.");
      }

      toast.success("Workout logged to history.");
      onOpenChange(false);
      onCreated?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to log workout.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-3xl md:max-w-4xl lg:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-blue-600" />
            Log a Workout
          </DialogTitle>
          <DialogDescription>
            Add a workout you completed in the past or schedule one for the
            future.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Card className="p-4 sm:p-5 space-y-4">
            <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
              <div className="space-y-2">
                <Label htmlFor="workout-name">Workout name</Label>
                <Input
                  id="workout-name"
                  value={workoutName}
                  onChange={(event) => setWorkoutName(event.target.value)}
                  placeholder="Upper Body Push"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workout-duration">Duration (minutes)</Label>
                <Input
                  id="workout-duration"
                  type="number"
                  min="0"
                  value={durationMinutes}
                  onChange={(event) => setDurationMinutes(event.target.value)}
                  placeholder="45"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate
                        ? format(selectedDate, "MMM d, yyyy")
                        : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="workout-time">Time</Label>
                <Input
                  id="workout-time"
                  type="time"
                  value={selectedTime}
                  onChange={(event) => setSelectedTime(event.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="workout-notes">Notes</Label>
              <Textarea
                id="workout-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Optional notes about this session."
                rows={3}
              />
            </div>
          </Card>

          <Tabs
            value={activeTab}
            onValueChange={(value) =>
              setActiveTab(value as "template" | "manual")
            }
          >
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="template" className="gap-2">
                <Dumbbell className="h-4 w-4" />
                Use existing workout
              </TabsTrigger>
              <TabsTrigger value="manual" className="gap-2">
                <ClipboardList className="h-4 w-4" />
                Manual entry
              </TabsTrigger>
            </TabsList>

            <TabsContent value="template" className="mt-4 space-y-4">
              <Card className="p-4 sm:p-5 space-y-4">
                <div>
                  <h3 className="text-base font-semibold mb-1">
                    Choose a workout
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Pick from your saved or AI-generated routines.
                  </p>
                </div>

                {templatesLoading ? (
                  <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                    Loading your workouts...
                  </div>
                ) : (
                  <WorkoutTemplateSelector
                    templates={templates.map((t) => ({
                      id: t.id,
                      name: t.name,
                      description: t.description,
                      category: t.category,
                      difficulty: t.difficulty,
                      estimatedDuration: t.estimatedDuration,
                      exerciseCount: t.exercises?.length || 0,
                      isPredefined: t.isPredefined,
                    }))}
                    selectedId={selectedTemplateId || undefined}
                    onSelect={(template) => {
                      const selected = templates.find(
                        (t) => t.id === template.id,
                      );
                      if (selected) {
                        setSelectedTemplateId(selected.id);
                      }
                    }}
                    loading={templatesLoading}
                    placeholder="Search for workouts..."
                    showCategories={true}
                    showDifficulty={true}
                    maxHeight="300px"
                  />
                )}

                {selectedTemplate && (
                  <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
                    {selectedTemplate.exercises.length} exercises • Estimated{" "}
                    {selectedTemplate.estimatedDuration} min
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Checkbox
                    id="auto-fill-sets"
                    checked={autoFillSets}
                    onCheckedChange={(checked) =>
                      setAutoFillSets(Boolean(checked))
                    }
                  />
                  <Label htmlFor="auto-fill-sets" className="text-sm">
                    Auto-fill sets using target reps
                  </Label>
                </div>

                {selectedTemplate && !autoFillSets && (
                  <div className="space-y-4 border-t pt-4">
                    <div>
                      <h4 className="text-sm font-semibold">
                        Enter completed sets
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Add each set with reps/time, weight, and rest as needed.
                      </p>
                    </div>

                    <div className="space-y-4">
                      {selectedTemplate.exercises.map((exercise) => {
                        const targetType = (exercise.targetType || "reps") as
                          | "reps"
                          | "time";
                        const sets = templateSetOverrides[exercise.id] || [];

                        return (
                          <Card key={exercise.id} className="p-4 space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h5 className="font-semibold">
                                  {exercise.name}
                                </h5>
                                <p className="text-xs text-muted-foreground">
                                  Target: {exercise.targetSets} sets •{" "}
                                  {exercise.targetReps}
                                </p>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => addTemplateSet(exercise.id)}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Add set
                              </Button>
                            </div>

                            {sets.length === 0 ? (
                              <div className="rounded-lg border border-dashed bg-muted/30 p-4 text-center text-xs text-muted-foreground">
                                No sets added yet.
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {sets.map((set, index) => (
                                  <div
                                    key={set.id}
                                    className="grid gap-2 sm:grid-cols-[60px_1fr_1fr_1fr_auto] items-center"
                                  >
                                    <span className="text-xs text-muted-foreground">
                                      Set {index + 1}
                                    </span>
                                    {targetType === "time" ? (
                                      <Input
                                        type="number"
                                        min="0"
                                        value={set.duration || ""}
                                        onChange={(event) =>
                                          updateTemplateSet(
                                            exercise.id,
                                            set.id,
                                            {
                                              duration: event.target.value,
                                            },
                                          )
                                        }
                                        placeholder="Seconds"
                                      />
                                    ) : (
                                      <Input
                                        type="number"
                                        min="0"
                                        value={set.reps || ""}
                                        onChange={(event) =>
                                          updateTemplateSet(
                                            exercise.id,
                                            set.id,
                                            {
                                              reps: event.target.value,
                                            },
                                          )
                                        }
                                        placeholder="Reps"
                                      />
                                    )}
                                    <Input
                                      type="number"
                                      min="0"
                                      value={set.weight || ""}
                                      onChange={(event) =>
                                        updateTemplateSet(exercise.id, set.id, {
                                          weight: event.target.value,
                                        })
                                      }
                                      placeholder="Weight"
                                    />
                                    <Input
                                      type="number"
                                      min="0"
                                      value={set.restTime || ""}
                                      onChange={(event) =>
                                        updateTemplateSet(exercise.id, set.id, {
                                          restTime: event.target.value,
                                        })
                                      }
                                      placeholder="Rest (sec)"
                                    />
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="text-red-600 hover:text-red-700"
                                      onClick={() =>
                                        removeTemplateSet(exercise.id, set.id)
                                      }
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="manual" className="mt-4 space-y-4">
              <Card className="p-4 sm:p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold">Exercises</h3>
                    <p className="text-sm text-muted-foreground">
                      Add exercises and the sets you completed.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowExerciseSelector(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add exercise
                  </Button>
                </div>

                {manualExercises.length === 0 ? (
                  <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
                    Start by adding your first exercise.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {manualExercises.map((exercise) => (
                      <Card key={exercise.id} className="p-4 space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="font-semibold">{exercise.name}</h4>
                            <p className="text-xs text-muted-foreground">
                              Customize targets and sets below.
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => removeManualExercise(exercise.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-[120px_1fr_1fr]">
                          <div className="space-y-2">
                            <Label className="text-xs uppercase text-muted-foreground">
                              Type
                            </Label>
                            <Select
                              value={exercise.targetType}
                              onValueChange={(value) =>
                                updateManualExercise(exercise.id, {
                                  targetType: value as "reps" | "time",
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="reps">Reps</SelectItem>
                                <SelectItem value="time">Time</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs uppercase text-muted-foreground">
                              Target reps/time
                            </Label>
                            <Input
                              value={exercise.targetReps}
                              onChange={(event) =>
                                updateManualExercise(exercise.id, {
                                  targetReps: event.target.value,
                                })
                              }
                              placeholder={
                                exercise.targetType === "time" ? "30s" : "8-12"
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs uppercase text-muted-foreground">
                              Target sets
                            </Label>
                            <Input
                              type="number"
                              min="1"
                              value={exercise.targetSets}
                              onChange={(event) =>
                                updateManualExercise(exercise.id, {
                                  targetSets: event.target.value,
                                })
                              }
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs uppercase text-muted-foreground">
                              Sets completed
                            </Label>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addSetToExercise(exercise.id)}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add set
                            </Button>
                          </div>

                          <div className="space-y-2">
                            {exercise.sets.map((set, index) => (
                              <div
                                key={set.id}
                                className="grid gap-2 sm:grid-cols-[60px_1fr_1fr_1fr_auto] items-center"
                              >
                                <span className="text-xs text-muted-foreground">
                                  Set {index + 1}
                                </span>
                                {exercise.targetType === "time" ? (
                                  <Input
                                    type="number"
                                    min="0"
                                    value={set.duration || ""}
                                    onChange={(event) =>
                                      updateManualSet(exercise.id, set.id, {
                                        duration: event.target.value,
                                      })
                                    }
                                    placeholder="Seconds"
                                  />
                                ) : (
                                  <Input
                                    type="number"
                                    min="0"
                                    value={set.reps || ""}
                                    onChange={(event) =>
                                      updateManualSet(exercise.id, set.id, {
                                        reps: event.target.value,
                                      })
                                    }
                                    placeholder="Reps"
                                  />
                                )}
                                <Input
                                  type="number"
                                  min="0"
                                  value={set.weight || ""}
                                  onChange={(event) =>
                                    updateManualSet(exercise.id, set.id, {
                                      weight: event.target.value,
                                    })
                                  }
                                  placeholder="Weight"
                                />
                                <Input
                                  type="number"
                                  min="0"
                                  value={set.restTime || ""}
                                  onChange={(event) =>
                                    updateManualSet(exercise.id, set.id, {
                                      restTime: event.target.value,
                                    })
                                  }
                                  placeholder="Rest (sec)"
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() =>
                                    removeManualSet(exercise.id, set.id)
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving..." : "Log workout"}
          </Button>
        </DialogFooter>

        <Dialog
          open={showExerciseSelector}
          onOpenChange={setShowExerciseSelector}
        >
          <DialogContent className="w-[96vw] sm:w-[90vw] lg:w-[75vw] xl:w-[70vw] max-w-6xl p-0 overflow-y-auto rounded-2xl max-h-[95vh]">
            <ExerciseSelector
              onSelect={handleAddExercise}
              onClose={() => setShowExerciseSelector(false)}
            />
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
