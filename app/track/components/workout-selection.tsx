"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Dumbbell, Plus, ListPlus, Zap } from "lucide-react";
import { CustomWorkoutForm } from "./custom-workout-form";
import {
  WorkoutTemplateSelector,
  type WorkoutTemplate as SelectorTemplate,
} from "@/components/workout-template-selector";
import type { WorkoutTemplate } from "../types/workout";

interface WorkoutSelectionProps {
  availableWorkouts: WorkoutTemplate[];
  onStartWorkout: (workout: WorkoutTemplate) => void;
  onSaveCustomWorkout: (workout: WorkoutTemplate) => void;
  onEditCustomWorkout?: (workout: WorkoutTemplate) => void;
}

export function WorkoutSelection({
  availableWorkouts,
  onStartWorkout,
  onSaveCustomWorkout,
  onEditCustomWorkout,
}: WorkoutSelectionProps) {
  const [showCustomWorkoutDialog, setShowCustomWorkoutDialog] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<WorkoutTemplate | null>(
    null,
  );

  // Filter workouts for the template selector - AI-generated and custom workouts
  const selectorWorkouts = useMemo<SelectorTemplate[]>(() => {
    return availableWorkouts
      .filter(
        (workout) =>
          workout.isAIGenerated ||
          workout.isCustom ||
          workout.name.toLowerCase().includes("ai-generated"),
      )
      .map((workout) => ({
        id: workout.id,
        name: workout.name,
        description: workout.description,
        category: workout.category,
        difficulty: workout.difficulty,
        estimatedDuration: workout.estimatedDuration,
        exerciseCount: workout.exercises?.length || 0,
        usageCount: 0,
        isPredefined:
          workout.isAIGenerated ||
          workout.name.toLowerCase().includes("ai-generated"),
        isPublic: false,
      }));
  }, [availableWorkouts]);

  const startBlankWorkout = () => {
    const blankWorkout: WorkoutTemplate = {
      id: `blank-${Date.now()}`,
      name: "Blank Workout",
      description: "Empty workout session - add exercises as you go",
      estimatedDuration: 0,
      exercises: [],
      isCustom: true,
      isAIGenerated: false,
    };
    onStartWorkout(blankWorkout);
  };

  const handleTemplateSelect = (template: SelectorTemplate) => {
    const workout = availableWorkouts.find((w) => w.id === template.id);
    if (workout) {
      onStartWorkout(workout);
    }
  };

  return (
    <div className="space-y-8 md:space-y-12">
      {/* Header Section */}
      <div className="text-center space-y-3 pt-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Dumbbell className="w-8 h-8 text-primary" />
          <h1 className="text-4xl font-bold tracking-tight">Your Workouts</h1>
        </div>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Select a saved workout or{" "}
          <a
            href="/generate"
            className="text-primary hover:underline font-semibold"
          >
            generate one with AI
          </a>
        </p>
      </div>

      <div className="space-y-8">
        {/* Quick Actions */}
        <Card className="bg-gradient-to-r from-primary/5 to-purple-500/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">Get Started</CardTitle>
            <CardDescription>Choose how you want to begin</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <Button
                onClick={startBlankWorkout}
                size="lg"
                className="flex-1 bg-primary hover:bg-primary/90 rounded-lg"
              >
                <ListPlus className="w-4 h-4 mr-2" />
                Start Blank Workout
              </Button>

              <Dialog
                open={showCustomWorkoutDialog}
                onOpenChange={(open) => {
                  if (!open) {
                    setEditingWorkout(null);
                  }
                  setShowCustomWorkoutDialog(open);
                }}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex-1 rounded-lg"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Custom Template
                  </Button>
                </DialogTrigger>
                <DialogContent
                  className="w-[98vw] sm:w-[98vw] md:w-[96vw] lg:w-[95vw] xl:w-[92vw] 2xl:w-[1600px]
                             h-[96vh]
                             max-w-none sm:max-w-[98vw] md:max-w-[96vw] lg:max-w-[95vw] xl:max-w-[92vw] 2xl:max-w-[1600px]
                             overflow-y-auto p-0 rounded-xl"
                >
                  <CustomWorkoutForm
                    initialWorkout={
                      editingWorkout
                        ? {
                            ...editingWorkout,
                            exercises: editingWorkout.exercises.map((ex) => ({
                              id: ex.id,
                              exerciseId: ex.id,
                              name: ex.name,
                              targetSets: ex.targetSets,
                              targetReps: ex.targetReps,
                              targetType: ex.targetType ?? "reps",
                              instructions: ex.instructions,
                              exercise: ex.exercise,
                            })),
                          }
                        : undefined
                    }
                    onSave={(workout) => {
                      if (editingWorkout) {
                        onEditCustomWorkout?.(workout);
                      } else {
                        onSaveCustomWorkout(workout);
                      }
                      setShowCustomWorkoutDialog(false);
                      setEditingWorkout(null);
                    }}
                    onCancel={() => setShowCustomWorkoutDialog(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Saved Workouts */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-600" />
              <div>
                <CardTitle>Your Saved Workouts</CardTitle>
                <CardDescription>
                  Browse and start your templates
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <WorkoutTemplateSelector
              templates={selectorWorkouts}
              onSelect={handleTemplateSelect}
              placeholder="Search workouts by name..."
              showCategories={true}
              showDifficulty={true}
              maxHeight="500px"
            />
            {selectorWorkouts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Dumbbell className="w-12 h-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground font-medium">
                  No saved workouts yet
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Create a custom template or generate one with AI to get
                  started
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
