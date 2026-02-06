"use client";

import type React from "react";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Search,
  Plus,
  PlusCircle,
  Trash2,
  Eye,
  Target,
  SlidersHorizontal,
} from "lucide-react";
import Fuse from "fuse.js";
import { logger } from "@/lib/logger";

interface Exercise {
  id: string;
  name: string;
  description?: string;
  instructions?: string;
  bodyParts?: Array<{ bodyPart: { id: string; name: string } }>;
  muscles?: Array<{ muscle: { id: string; name: string }; isPrimary: boolean }>;
  equipments?: Array<{ equipment: { id: string; name: string } }>;
  isCustom?: boolean;
  gifUrl?: string;
  // Additional possible fields for debugging
  bodyPartId?: string;
  bodyPartIds?: string[];
  [key: string]: unknown; // Allow additional properties
}

interface BodyPart {
  id: string;
  name: string;
}

interface Equipment {
  id: string;
  name: string;
}

interface Muscle {
  id: string;
  name: string;
  bodyPartId?: string; // Add bodyPartId to the muscle interface
}

interface ExerciseSelectorProps {
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
}

const normalizeSearchToken = (value: string): string => {
  const cleaned = value.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (cleaned.length > 3 && cleaned.endsWith("s")) {
    return cleaned.slice(0, -1);
  }
  return cleaned;
};

const tokenizeSearch = (value: string): string[] =>
  value
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .map(normalizeSearchToken)
    .filter(Boolean);

const computeSearchBonus = (exercise: Exercise, rawTerm: string): number => {
  const normalizedTerm = normalizeSearchToken(rawTerm);
  if (!normalizedTerm) {
    return 0;
  }

  const normalizedName = normalizeSearchToken(exercise.name);
  let bonus = 0;

  if (normalizedName === normalizedTerm) {
    bonus += 6;
  } else if (normalizedName.startsWith(normalizedTerm)) {
    bonus += 4;
  } else if (normalizedName.includes(normalizedTerm)) {
    bonus += 2;
  }

  const tokenPool = new Set<string>(tokenizeSearch(exercise.name));

  exercise.muscles?.forEach((muscle) => {
    tokenizeSearch(muscle.muscle.name).forEach((token) => tokenPool.add(token));
  });

  exercise.bodyParts?.forEach((bodyPart) => {
    if (bodyPart.bodyPart?.name) {
      tokenizeSearch(bodyPart.bodyPart.name).forEach((token) =>
        tokenPool.add(token),
      );
    }
  });

  exercise.equipments?.forEach((equipment) => {
    if (equipment.equipment?.name) {
      tokenizeSearch(equipment.equipment.name).forEach((token) =>
        tokenPool.add(token),
      );
    }
  });

  if (tokenPool.has(normalizedTerm)) {
    bonus += 2.5;
  }

  return bonus;
};

export function ExerciseSelector({ onSelect, onClose }: ExerciseSelectorProps) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]); // Store all exercises for client-side search
  const [bodyParts, setBodyParts] = useState<BodyPart[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [muscles, setMuscles] = useState<Muscle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedBodyPart, setSelectedBodyPart] = useState<string>("all");
  const [selectedEquipment, setSelectedEquipment] = useState<string>("all");
  const [selectedMuscle, setSelectedMuscle] = useState<string>("all");
  const [showCustomExercises, setShowCustomExercises] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState("");
  const [newExerciseDescription, setNewExerciseDescription] = useState("");
  const [savingCustomExercise, setSavingCustomExercise] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showGifModal, setShowGifModal] = useState(false);
  const [selectedGifExercise, setSelectedGifExercise] =
    useState<Exercise | null>(null);

  // Create Fuse instance with all exercises - memoized with stable options
  const fuse = useMemo(() => {
    if (allExercises.length === 0) return null;

    const fuseOptions = {
      keys: [
        { name: "name", weight: 0.7 },
        { name: "description", weight: 0.3 },
        { name: "bodyParts.bodyPart.name", weight: 0.1 },
        { name: "muscles.muscle.name", weight: 0.1 },
        { name: "equipments.equipment.name", weight: 0.1 },
      ],
      threshold: 0.4,
      distance: 100,
      minMatchCharLength: 2,
      includeScore: true,
      ignoreLocation: true,
      findAllMatches: true,
    };
    return new Fuse(allExercises, fuseOptions);
  }, [allExercises]);

  // Function to fetch ALL exercises initially (for client-side search)
  const fetchAllExercises = async () => {
    setLoading(true);
    try {
      // Fetch a large number of exercises initially
      const response = await fetch(
        `/api/workout-tracker/exercises?limit=1000&offset=0`,
      );
      const data = await response.json();

      const allExercisesList = [
        ...data.userExercises,
        ...data.predefinedExercises,
      ].sort((a, b) => a.name.localeCompare(b.name));

      // Debug: Log the structure of the first few exercises
      logger.info("Raw exercise data sample:", allExercisesList.slice(0, 3));
      logger.info(
        "First exercise complete structure:",
        JSON.stringify(allExercisesList[0], null, 2),
      );

      setAllExercises(allExercisesList);
      setExercises(allExercisesList.slice(0, 20)); // Show first 20 initially
    } catch (error) {
      logger.error("Error fetching all exercises:", error);
    } finally {
      setLoading(false);
    }
  };

  // Function to filter exercises based on search and filters
  const filterExercises = useCallback(() => {
    if (allExercises.length === 0) return;

    setIsSearching(true);

    // Use setTimeout to prevent blocking the UI during filtering
    setTimeout(() => {
      let filteredExercises = allExercises;

      // Filter out custom exercises if toggle is off
      if (!showCustomExercises) {
        filteredExercises = filteredExercises.filter(
          (exercise) => !isCustomExercise(exercise),
        );
      }

      logger.info("Filtering exercises:", {
        totalExercises: allExercises.length,
        selectedEquipment,
        selectedMuscle,
        debouncedSearchTerm,
      });

      // Apply filters first
      if (selectedBodyPart !== "all") {
        logger.info("Filtering by body part:", selectedBodyPart);
        logger.info("Available muscles:", muscles);

        filteredExercises = filteredExercises.filter((exercise) => {
          // Filter by body part: show exercises that target muscles belonging to the selected body part
          // First, check if the exercise has direct body part associations
          const hasDirectBodyPart = exercise.bodyParts?.some(
            (bp) => bp.bodyPart?.id === selectedBodyPart,
          );

          logger.info(
            `Exercise "${exercise.name}" - Direct body part match:`,
            hasDirectBodyPart,
          );

          // Since muscles don't have bodyPartId in the API, let's use a different approach
          // We'll create a mapping based on common muscle-to-body-part relationships
          const muscleToBodyPartMap: Record<string, string[]> = {
            // Common muscle name patterns to body part mappings
            chest: ["chest", "pectorals", "pecs"],
            back: [
              "lats",
              "latissimus",
              "rhomboids",
              "trapezius",
              "traps",
              "rear delt",
            ],
            shoulders: [
              "deltoids",
              "delts",
              "front delt",
              "side delt",
              "rear delt",
            ],
            arms: ["biceps", "triceps", "forearms"],
            legs: ["quadriceps", "quads", "hamstrings", "calves", "glutes"],
            core: ["abs", "abdominals", "obliques", "core"],
            // Add more mappings as needed
          };

          // Find the selected body part name
          const selectedBodyPartData = bodyParts.find(
            (bp) => bp.id === selectedBodyPart,
          );
          const selectedBodyPartName =
            selectedBodyPartData?.name?.toLowerCase() || "";

          // Check if any of the exercise's muscles belong to this body part
          const hasMuscleInBodyPart = exercise.muscles?.some(
            (exerciseMuscle) => {
              const muscleName = exerciseMuscle.muscle.name.toLowerCase();
              logger.info(
                `  Checking muscle "${exerciseMuscle.muscle.name}" for body part "${selectedBodyPartName}"`,
              );

              // Get the muscle keywords for this body part
              const bodyPartMuscles =
                muscleToBodyPartMap[selectedBodyPartName] || [];

              // Check if the muscle name contains any of the body part keywords
              const belongsToBodyPart =
                bodyPartMuscles.some((keyword) =>
                  muscleName.includes(keyword.toLowerCase()),
                ) || muscleName.includes(selectedBodyPartName);

              logger.info(
                `    Muscle "${muscleName}" belongs to "${selectedBodyPartName}":`,
                belongsToBodyPart,
              );
              return belongsToBodyPart;
            },
          );

          logger.info(
            `Exercise "${exercise.name}" - Muscle in body part match:`,
            hasMuscleInBodyPart,
          );
          const shouldInclude = hasDirectBodyPart || hasMuscleInBodyPart;
          logger.info(
            `Exercise "${exercise.name}" - Final decision:`,
            shouldInclude,
          );

          return shouldInclude;
        });
      }

      if (selectedEquipment !== "all") {
        filteredExercises = filteredExercises.filter((exercise) =>
          exercise.equipments?.some(
            (eq) => eq.equipment.id === selectedEquipment,
          ),
        );
      }

      if (selectedMuscle !== "all") {
        filteredExercises = filteredExercises.filter((exercise) =>
          exercise.muscles?.some((m) => m.muscle.id === selectedMuscle),
        );
      }

      // Apply search if there's a search term
      if (debouncedSearchTerm.trim() && fuse) {
        const searchResults = fuse.search(debouncedSearchTerm);
        const prioritized = searchResults
          .map((result) => ({
            exercise: result.item,
            fuseScore: result.score ?? 0,
            bonus: computeSearchBonus(result.item, debouncedSearchTerm),
          }))
          .sort((a, b) => {
            if (b.bonus !== a.bonus) {
              return b.bonus - a.bonus;
            }
            return a.fuseScore - b.fuseScore;
          })
          .map((entry) => entry.exercise);

        const filteredIds = new Set(
          filteredExercises.map((exercise) => exercise.id),
        );
        filteredExercises = prioritized.filter((exercise) =>
          filteredIds.has(exercise.id),
        );
      }

      logger.info("Final filtered exercises:", filteredExercises.length);
      setExercises(filteredExercises.slice(0, 50)); // Show more results
      setIsSearching(false);
    }, 0);
  }, [
    allExercises,
    showCustomExercises,
    selectedBodyPart,
    selectedEquipment,
    selectedMuscle,
    debouncedSearchTerm,
    fuse,
    muscles,
    bodyParts,
  ]);

  // Function to fetch filter options (body parts, equipment, muscles)
  const fetchFilterOptions = async () => {
    try {
      const [bodyPartsRes, equipmentRes, musclesRes] = await Promise.all([
        fetch("/api/workout-tracker/body-parts"),
        fetch("/api/workout-tracker/equipment"),
        fetch("/api/workout-tracker/muscles"),
      ]);

      const bodyPartsData = await bodyPartsRes.json();
      setBodyParts(bodyPartsData);

      const equipmentData = await equipmentRes.json();
      setEquipment(equipmentData);

      const musclesData = await musclesRes.json();
      logger.info("Muscles from API:", musclesData);
      logger.info(
        "Sample muscle structure:",
        JSON.stringify(musclesData[0], null, 2),
      ); // Debug muscle structure
      logger.info("Total muscles loaded:", musclesData.length);
      setMuscles(musclesData);
    } catch (error) {
      logger.error("Error fetching filter options:", error);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchFilterOptions();
    fetchAllExercises();
  }, []);

  // Separate debounced search effect
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 1000); // Increased back to 1 second

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  // Filter exercises when search parameters change (only when debouncedSearchTerm changes)
  useEffect(() => {
    filterExercises();
  }, [
    debouncedSearchTerm,
    selectedBodyPart,
    selectedEquipment,
    selectedMuscle,
    showCustomExercises,
    filterExercises,
  ]);

  // Since we're doing client-side filtering, we don't need the old fetchExercises function

  const handleCreateCustomExercise = async () => {
    if (!newExerciseName.trim()) return;

    setSavingCustomExercise(true);
    try {
      const response = await fetch("/api/workout-tracker/exercises/custom", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newExerciseName,
          description: newExerciseDescription,
        }),
      });

      if (response.ok) {
        const newExercise = await response.json();
        setExercises((prev) => [...prev, newExercise]);
        setNewExerciseName("");
        setNewExerciseDescription("");
        setShowCreateForm(false);
      } else {
        logger.error("Failed to create custom exercise");
      }
    } catch (error) {
      logger.error("Error creating custom exercise:", error);
    } finally {
      setSavingCustomExercise(false);
    }
  };

  const handleDeleteExercise = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this custom exercise? This will permanently remove it from your exercise library and you won't be able to use it in future workouts.",
      )
    )
      return;

    try {
      const response = await fetch(
        `/api/workout-tracker/exercises/custom/${id}`,
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        setExercises((prev) => prev.filter((ex) => ex.id !== id));
      } else {
        logger.error("Failed to delete custom exercise");
      }
    } catch (error) {
      logger.error("Error deleting custom exercise:", error);
    }
  };

  const handleViewGif = (exercise: Exercise) => {
    setSelectedGifExercise(exercise);
    setShowGifModal(true);
  };

  const isCustomExercise = (exercise: Exercise) => {
    // An exercise is custom if:
    // 1. It has the isCustom flag explicitly set to true
    // 2. OR it doesn't have any body parts, muscles, or equipment associations (likely user-created)
    return Boolean(
      exercise.isCustom ||
      (!exercise.bodyParts?.length &&
        !exercise.muscles?.length &&
        !exercise.equipments?.length),
    );
  };

  if (loading) {
    return (
      <Card className="w-full h-full flex items-center justify-center">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading exercises...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      <DialogHeader className="px-4 py-3 md:px-6 md:py-4 border-b flex-shrink-0">
        <DialogTitle className="flex items-center gap-2 text-lg md:text-xl">
          <Target className="w-5 h-5 text-blue-600" />
          Select Exercise
        </DialogTitle>
        <DialogDescription className="text-sm md:text-base">
          Choose an exercise to add to your workout.
        </DialogDescription>
      </DialogHeader>

      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row gap-0 lg:gap-6 p-0 lg:p-6">
        {/* Left Sidebar - Filters */}
        <div className="w-full lg:w-64 flex-shrink-0 border-b lg:border-b-0 lg:border-r p-3 lg:py-0 lg:pr-6 lg:pl-0 overflow-y-auto scrollbar-hide space-y-3 lg:space-y-4">
          {/* Search - always visible */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search
                className={`absolute left-3 top-2.5 h-4 w-4 ${isSearching ? "text-blue-500 animate-pulse" : "text-muted-foreground"}`}
              />
              <Input
                ref={searchInputRef}
                key="exercise-search"
                placeholder="Search exercises..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-2.5 lg:hidden flex-shrink-0"
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              title="Toggle filters"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </Button>
          </div>

          {/* Filters - collapsible on mobile, always visible on desktop */}
          <div
            className={`space-y-3 ${showMobileFilters ? "block" : "hidden"} lg:block`}
          >
            {/* Create Custom Exercise Button */}
            {showCreateForm ? (
              <Card className="p-3 border-blue-500 border-2 bg-blue-50/50">
                <h3 className="text-sm font-semibold mb-2 text-blue-700 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  New Exercise
                </h3>
                <div className="space-y-2">
                  <Input
                    id="new-exercise-name"
                    value={newExerciseName}
                    onChange={(e) => setNewExerciseName(e.target.value)}
                    placeholder="Exercise name"
                    autoFocus
                    className="h-8 text-sm"
                  />
                  <Input
                    id="new-exercise-description"
                    value={newExerciseDescription}
                    onChange={(e) => setNewExerciseDescription(e.target.value)}
                    placeholder="Brief description (optional)"
                    className="h-8 text-sm"
                  />
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowCreateForm(false);
                        setNewExerciseName("");
                        setNewExerciseDescription("");
                      }}
                      size="sm"
                      className="h-7 text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateCustomExercise}
                      disabled={!newExerciseName.trim() || savingCustomExercise}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white h-7 text-xs"
                    >
                      {savingCustomExercise ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <Button
                onClick={() => setShowCreateForm(true)}
                variant="outline"
                size="sm"
                className="w-full h-8 text-xs"
              >
                <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
                Create Custom
              </Button>
            )}

            {/* Filters in a compact grid on mobile, stacked on desktop */}
            <div className="grid grid-cols-3 lg:grid-cols-1 gap-2 lg:gap-3">
              <Select
                value={selectedBodyPart}
                onValueChange={setSelectedBodyPart}
              >
                <SelectTrigger className="h-8 lg:h-9 text-xs lg:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Body Parts</SelectItem>
                  {bodyParts.map((bodyPart) => (
                    <SelectItem key={bodyPart.id} value={bodyPart.id}>
                      {bodyPart.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedEquipment}
                onValueChange={setSelectedEquipment}
              >
                <SelectTrigger className="h-8 lg:h-9 text-xs lg:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Equipment</SelectItem>
                  {equipment.map((eq) => (
                    <SelectItem key={eq.id} value={eq.id}>
                      {eq.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedMuscle} onValueChange={setSelectedMuscle}>
                <SelectTrigger className="h-8 lg:h-9 text-xs lg:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Muscles</SelectItem>
                  {muscles.map((muscle) => (
                    <SelectItem key={muscle.id} value={muscle.id}>
                      {muscle.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Custom exercises toggle */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="show-custom"
                checked={showCustomExercises}
                onCheckedChange={(checked) =>
                  setShowCustomExercises(checked === true)
                }
              />
              <Label
                htmlFor="show-custom"
                className="text-xs font-medium cursor-pointer select-none"
              >
                Show custom exercises
              </Label>
            </div>
          </div>
        </div>

        {/* Right Content - Exercise List */}
        <div className="flex-1 min-w-0 overflow-y-auto scrollbar-hide p-4 lg:p-0">
          {exercises.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
              <div className="text-4xl mb-2">🔍</div>
              <p className="font-medium text-muted-foreground">
                No exercises found
              </p>
              <p className="text-sm text-muted-foreground">
                Try adjusting your filters or search term
              </p>
            </div>
          ) : (
            <div className="space-y-1.5 lg:space-y-3">
              {exercises.map((exercise) => (
                <div
                  key={exercise.id}
                  className={`p-2.5 lg:p-4 cursor-pointer rounded-lg transition-all duration-200 border hover:border-blue-300 hover:shadow-sm ${
                    isCustomExercise(exercise)
                      ? "border-purple-200 bg-purple-50/50"
                      : "border-muted hover:bg-muted/50"
                  }`}
                  onClick={() => onSelect(exercise)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 lg:gap-2">
                        <h4 className="font-medium text-xs lg:text-sm truncate">
                          {exercise.name}
                        </h4>
                        {isCustomExercise(exercise) && (
                          <span className="text-[10px] lg:text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded whitespace-nowrap">
                            Custom
                          </span>
                        )}
                      </div>
                      {exercise.description && (
                        <p className="hidden lg:block text-xs text-muted-foreground mt-1 line-clamp-1">
                          {exercise.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1 mt-1">
                        {exercise.bodyParts?.slice(0, 2).map((bp) => (
                          <span
                            key={bp.bodyPart.id}
                            className="text-[10px] lg:text-xs bg-blue-100 text-blue-700 px-1.5 lg:px-2 py-0.5 rounded"
                          >
                            {bp.bodyPart.name}
                          </span>
                        ))}
                        {exercise.muscles
                          ?.filter((m) => m.isPrimary)
                          .slice(0, 2)
                          .map((m) => (
                            <span
                              key={m.muscle.id}
                              className="text-[10px] lg:text-xs bg-green-100 text-green-700 px-1.5 lg:px-2 py-0.5 rounded"
                            >
                              {m.muscle.name}
                            </span>
                          ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {exercise.gifUrl && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 lg:h-8 lg:w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewGif(exercise);
                          }}
                          title="View demo"
                        >
                          <Eye className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                        </Button>
                      )}
                      {isCustomExercise(exercise) && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 lg:h-8 lg:w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteExercise(exercise.id);
                          }}
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="border-t px-4 py-3 md:px-6 md:py-4 flex-shrink-0">
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto h-10"
          >
            Cancel
          </Button>
        </DialogFooter>
      </div>

      {/* GIF Modal */}
      <Dialog open={showGifModal} onOpenChange={setShowGifModal}>
        <DialogContent className="w-[95vw] mx-auto max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg md:text-xl">
              <Target className="w-5 h-5 text-green-600" />
              {selectedGifExercise?.name} - Exercise Demo
            </DialogTitle>
            <DialogDescription>
              Watch the proper form for this exercise
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-center py-4">
            {selectedGifExercise?.gifUrl ? (
              <div className="relative w-full max-w-2xl">
                <img
                  src={selectedGifExercise.gifUrl}
                  alt={`${selectedGifExercise.name} exercise demonstration`}
                  className="w-full h-auto rounded-lg shadow-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    const parent = target.parentElement;
                    if (parent) {
                      const errorDiv = document.createElement("div");
                      errorDiv.className =
                        "text-center py-12 text-muted-foreground";
                      errorDiv.innerHTML = `
                        <div class="text-lg mb-2">GIF not available</div>
                        <div class="text-sm">The demonstration video for this exercise is not currently available.</div>
                      `;
                      parent.appendChild(errorDiv);
                    }
                  }}
                />
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <div className="text-lg mb-2">GIF not available</div>
                <div className="text-sm">
                  The demonstration video for this exercise is not currently
                  available.
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              onClick={() => setShowGifModal(false)}
              className="w-full sm:w-auto"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
