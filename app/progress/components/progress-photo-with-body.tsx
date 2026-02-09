"use client";

import React, { useEffect, useMemo, useState } from "react";
import { format, isSameDay } from "date-fns";
import {
  Trash2,
  Calendar as CalendarIcon,
  RotateCcw,
  RotateCw,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BodyDiagram } from "@/components/body-diagram";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";
import { getBodyPartSlug } from "./body-part-mappings";

interface ProgressPhoto {
  id: string;
  url: string;
  notes?: string;
  bodyParts?: string[];
  uploadDate: string;
  createdAt: string;
}

interface WorkoutData {
  date: string;
  exercises: Array<{
    name: string;
    bodyParts: string[];
  }>;
}

interface BodyPartData {
  name: string;
  slug: string;
  intensity: "none" | "light" | "moderate" | "heavy";
}

interface ProgressPhotoWithBodyProps {
  photos: ProgressPhoto[];
  loading?: boolean;
  onPhotoDeleted?: (photoId: string) => void;
}

export function ProgressPhotoWithBody({
  photos,
  loading = false,
  onPhotoDeleted,
}: ProgressPhotoWithBodyProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [bodyView, setBodyView] = useState<"front" | "back">("front");
  const [workoutData, setWorkoutData] = useState<Record<string, WorkoutData>>(
    {},
  );
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [selectedBodyPartFilter, setSelectedBodyPartFilter] = useState<
    string | null
  >(null);
  const { toast } = useToast();

  const isDev = process.env.NODE_ENV !== "production";
  const appLocation =
    typeof window !== "undefined"
      ? {
          pathname: window.location.pathname,
          search: window.location.search,
          hash: window.location.hash,
          href: window.location.href,
        }
      : null;

  // Fetch workout data for the selected date
  useEffect(() => {
    const fetchWorkoutData = async () => {
      try {
        const dateStr = format(selectedDate, "yyyy-MM-dd");

        // Check if we already have this data cached
        if (workoutData[dateStr]) return;

        const response = await fetch(
          `/api/workout-tracker/workout-sessions?date=${dateStr}`,
        );
        if (response.ok) {
          const sessions = await response.json();
          const sessionList = Array.isArray(sessions) ? sessions : [];

          // Extract exercises and body parts from the workout sessions
          const exercises: Array<{ name: string; bodyParts: string[] }> = [];
          for (const session of sessionList) {
            for (const ex of session.exercises || []) {
              const exBodyParts: string[] = [];
              for (const m of ex.exercise?.muscles || []) {
                if (m.muscle?.name) exBodyParts.push(m.muscle.name);
              }
              exercises.push({
                name: ex.exercise?.name || "Unknown",
                bodyParts: exBodyParts,
              });
            }
          }

          setWorkoutData((prev) => ({
            ...prev,
            [dateStr]: { date: dateStr, exercises },
          }));
        }
      } catch (error) {
        logger.error("Failed to fetch workout data for selected date:", error);
      }
    };

    fetchWorkoutData();
  }, [selectedDate, workoutData]);

  // Get photos for the selected date
  const photosForDate = useMemo(() => {
    return photos.filter((photo) =>
      isSameDay(new Date(photo.uploadDate), selectedDate),
    );
  }, [photos, selectedDate]);

  // Reset selected photo and body part filter when date changes or photos change
  useEffect(() => {
    setSelectedBodyPartFilter(null);
    if (
      photosForDate.length > 0 &&
      (!selectedPhotoId || !photosForDate.find((p) => p.id === selectedPhotoId))
    ) {
      setSelectedPhotoId(photosForDate[0].id);
    } else if (photosForDate.length === 0) {
      setSelectedPhotoId(null);
    }
  }, [photosForDate, selectedPhotoId]);

  // Get selected photo and remaining photos
  const selectedPhoto = selectedPhotoId
    ? photosForDate.find((p) => p.id === selectedPhotoId)
    : null;

  const selectedPhotoIndex = selectedPhotoId
    ? photosForDate.findIndex((photo) => photo.id === selectedPhotoId)
    : -1;

  // Get workout data for the selected date
  const workoutForDate = useMemo(() => {
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    return workoutData[dateStr];
  }, [workoutData, selectedDate]);

  // Get body parts data for the selected date (from workout data)
  const bodyPartsForDate = useMemo((): BodyPartData[] => {
    if (!workoutForDate?.exercises) return [];

    // Collect all unique body parts from exercises on that day
    const partsSet = new Set<string>();
    const partsMap: Record<string, BodyPartData> = {};

    workoutForDate.exercises.forEach((exercise) => {
      exercise.bodyParts?.forEach((muscleName) => {
        const slug = getBodyPartSlug(muscleName);

        if (!partsSet.has(slug)) {
          partsSet.add(slug);
          partsMap[slug] = {
            name: muscleName,
            slug,
            intensity: "moderate",
          };
        }
      });
    });

    return Object.values(partsMap);
  }, [workoutForDate]);

  // Get unique exercises for the selected date
  const exercisesForDate = useMemo(() => {
    if (!workoutForDate?.exercises) return [];
    const uniqueExercises = new Set(
      workoutForDate.exercises.map((ex) => ex.name),
    );
    return Array.from(uniqueExercises);
  }, [workoutForDate]);

  // Body parts for the SELECTED PHOTO (not the whole day)
  const bodyPartsForSelectedPhoto = useMemo((): BodyPartData[] => {
    if (!selectedPhoto?.bodyParts?.length) return [];
    return selectedPhoto.bodyParts.map((slug) => ({
      name: slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      slug,
      intensity: "moderate" as const,
    }));
  }, [selectedPhoto]);

  // Which body parts to show on the diagram — selected photo's parts, or the day's parts as fallback
  const diagramBodyParts = useMemo(() => {
    if (selectedBodyPartFilter) {
      // When filtering by a body part, highlight just that part
      return [
        {
          name: selectedBodyPartFilter
            .replace(/-/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase()),
          slug: selectedBodyPartFilter,
          intensity: "moderate" as const,
        },
      ];
    }
    // Show the selected photo's tagged parts, or fall back to all parts worked that day
    return bodyPartsForSelectedPhoto.length > 0
      ? bodyPartsForSelectedPhoto
      : bodyPartsForDate;
  }, [selectedBodyPartFilter, bodyPartsForSelectedPhoto, bodyPartsForDate]);

  // Photos filtered by body part
  const filteredPhotosForDate = useMemo(() => {
    if (!selectedBodyPartFilter) return photosForDate;
    return photosForDate.filter((photo) =>
      photo.bodyParts?.includes(selectedBodyPartFilter),
    );
  }, [photosForDate, selectedBodyPartFilter]);

  const debugPayload = useMemo(() => {
    const photosDetailed = photosForDate.map((photo, index) => ({
      index,
      id: photo.id,
      uploadDate: photo.uploadDate,
      createdAt: photo.createdAt,
      appSource: photo.url || null,
      appSourceKind: photo.url?.startsWith("/api/") ? "api-route" : "direct",
      notes: photo.notes ?? null,
      bodyParts: photo.bodyParts ?? [],
      bodyPartCount: photo.bodyParts?.length ?? 0,
      isSelected: photo.id === selectedPhotoId,
      matchesBodyPartFilter: selectedBodyPartFilter
        ? Boolean(photo.bodyParts?.includes(selectedBodyPartFilter))
        : true,
    }));

    const latestPhotoForDate = photosDetailed
      .slice()
      .sort(
        (a, b) =>
          new Date(b.createdAt || b.uploadDate).getTime() -
          new Date(a.createdAt || a.uploadDate).getTime(),
      )[0];

    return {
      selectedDate: format(selectedDate, "yyyy-MM-dd"),
      appLocation,
      component: "ProgressPhotoWithBody",
      counts: {
        photosForDate: photosForDate.length,
        filteredPhotosForDate: filteredPhotosForDate.length,
        exercisesForDate: exercisesForDate.length,
        workoutBodyParts: bodyPartsForDate.length,
        diagramBodyParts: diagramBodyParts.length,
      },
      selectedState: {
        selectedPhotoId,
        selectedPhotoIndex,
        selectedBodyPartFilter,
        bodyView,
      },
      latestPhotoForDate: latestPhotoForDate ?? null,
      selectedPhoto: selectedPhoto
        ? {
            id: selectedPhoto.id,
            uploadDate: selectedPhoto.uploadDate,
            createdAt: selectedPhoto.createdAt,
            appSource: selectedPhoto.url || null,
            notes: selectedPhoto.notes ?? null,
            bodyParts: selectedPhoto.bodyParts ?? [],
          }
        : null,
      photosDetailed,
      workoutData: workoutForDate
        ? {
            date: workoutForDate.date,
            exercisesCount: workoutForDate.exercises.length,
            exercises: workoutForDate.exercises,
          }
        : null,
      diagram: {
        highlightedBodyPartSlugs: diagramBodyParts.map((part) => part.slug),
        highlightedBodyPartNames: diagramBodyParts.map((part) => part.name),
        workoutBodyPartSlugs: bodyPartsForDate.map((part) => part.slug),
      },
    };
  }, [
    appLocation,
    bodyPartsForDate,
    bodyView,
    diagramBodyParts,
    exercisesForDate.length,
    filteredPhotosForDate.length,
    photosForDate,
    selectedBodyPartFilter,
    selectedDate,
    selectedPhoto,
    selectedPhotoId,
    selectedPhotoIndex,
    workoutForDate,
  ]);

  // When body part filter changes, auto-select first matching photo
  useEffect(() => {
    if (selectedBodyPartFilter && filteredPhotosForDate.length > 0) {
      const currentPhotoInFilter = filteredPhotosForDate.find(
        (p) => p.id === selectedPhotoId,
      );
      if (!currentPhotoInFilter) {
        setSelectedPhotoId(filteredPhotosForDate[0].id);
      }
    }
  }, [selectedBodyPartFilter, filteredPhotosForDate, selectedPhotoId]);

  // Handle body part click on diagram
  const handleBodyPartClick = (part: BodyPartData) => {
    if (selectedBodyPartFilter === part.slug) {
      // Toggle off — clear filter
      setSelectedBodyPartFilter(null);
    } else {
      setSelectedBodyPartFilter(part.slug);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    try {
      const response = await fetch(`/api/progress/photos/${photoId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete photo");
      }

      toast({
        title: "Success",
        description: "Progress photo deleted",
      });

      onPhotoDeleted?.(photoId);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete photo",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Photo & Body Analysis</CardTitle>
          <CardDescription>Loading photos and workout data...</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Photo & Body Analysis</CardTitle>
          <CardDescription>
            View your progress photos with the body parts you worked on that day
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-auto justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(selectedDate, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) {
                      setSelectedDate(date);
                      setCalendarOpen(false);
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <div className="text-sm text-muted-foreground">
              {photosForDate.length} photo
              {photosForDate.length !== 1 ? "s" : ""} •{" "}
              {exercisesForDate.length} exercise
              {exercisesForDate.length !== 1 ? "s" : ""}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Photos and Body Diagram Side by Side */}
      {photosForDate.length > 0 ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Photos for Selected Date */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Progress Photos</CardTitle>
                <CardDescription>
                  Photos uploaded on {format(selectedDate, "MMMM d, yyyy")}
                  {selectedBodyPartFilter && (
                    <span className="ml-1">
                      · filtered by{" "}
                      <strong>
                        {selectedBodyPartFilter
                          .replace(/-/g, " ")
                          .replace(/\b\w/g, (c) => c.toUpperCase())}
                      </strong>
                    </span>
                  )}
                </CardDescription>
              </div>
              {selectedBodyPartFilter && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedBodyPartFilter(null)}
                  className="text-xs"
                >
                  Clear filter
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Body part tags on selected photo */}
              {selectedPhoto?.bodyParts &&
                selectedPhoto.bodyParts.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedPhoto.bodyParts.map((slug) => (
                      <Badge
                        key={slug}
                        variant={
                          selectedBodyPartFilter === slug
                            ? "default"
                            : "secondary"
                        }
                        className="cursor-pointer text-xs"
                        onClick={() =>
                          setSelectedBodyPartFilter(
                            selectedBodyPartFilter === slug ? null : slug,
                          )
                        }
                      >
                        {slug
                          .replace(/-/g, " ")
                          .replace(/\b\w/g, (c) => c.toUpperCase())}
                      </Badge>
                    ))}
                  </div>
                )}

              {/* Main Selected Photo */}
              {selectedPhoto && (
                <div className="relative group rounded-lg overflow-hidden bg-muted/30">
                  {selectedPhoto.url ? (
                    <img
                      src={selectedPhoto.url}
                      alt="Progress"
                      className="w-full h-auto max-h-[32rem] object-contain mx-auto"
                    />
                  ) : (
                    <div className="w-full h-64 flex items-center justify-center text-xs text-muted-foreground">
                      N/A
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogTitle>
                          Delete Progress Photo
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this progress photo?
                          This action cannot be undone.
                        </AlertDialogDescription>
                        <div className="flex gap-2 justify-end">
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeletePhoto(selectedPhoto.id)}
                            className="bg-destructive text-white hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </div>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  {selectedPhoto.notes && (
                    <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-black/80 rounded px-2 py-1 text-xs text-white">
                        {selectedPhoto.notes}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Additional Photos - Clickable Thumbnails */}
              {filteredPhotosForDate.filter((p) => p.id !== selectedPhotoId)
                .length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {selectedBodyPartFilter ? "Matching" : "Other"} Photos (
                    {
                      filteredPhotosForDate.filter(
                        (p) => p.id !== selectedPhotoId,
                      ).length
                    }
                    )
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {filteredPhotosForDate
                      .filter((p) => p.id !== selectedPhotoId)
                      .map((photo) => (
                        <div
                          key={photo.id}
                          className="relative group rounded-lg overflow-hidden bg-muted aspect-square cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                          onClick={() => setSelectedPhotoId(photo.id)}
                        >
                          {photo.url ? (
                            <img
                              src={photo.url}
                              alt="Progress"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                              N/A
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors" />
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* No matching photos message */}
              {selectedBodyPartFilter && filteredPhotosForDate.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  <p className="text-sm">
                    No photos tagged with this body part
                  </p>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setSelectedBodyPartFilter(null)}
                  >
                    Clear filter
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Body Diagram — reflects selected photo's tagged parts */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">
                    {selectedBodyPartFilter
                      ? "Filtered View"
                      : selectedPhoto?.bodyParts?.length
                        ? "Tagged Muscles"
                        : "Muscles Worked"}
                  </CardTitle>
                  <CardDescription>
                    {selectedBodyPartFilter
                      ? `Showing photos for ${selectedBodyPartFilter.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}`
                      : selectedPhoto?.bodyParts?.length
                        ? "Body parts tagged on the selected photo"
                        : `Body parts worked on ${format(selectedDate, "MMMM d, yyyy")}`}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={bodyView === "front" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setBodyView("front")}
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Front
                  </Button>
                  <Button
                    variant={bodyView === "back" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setBodyView("back")}
                  >
                    <RotateCw className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {diagramBodyParts.length > 0 || bodyPartsForDate.length > 0 ? (
                <div className="space-y-6">
                  {/* Interactive Body Diagram — click to filter by body part */}
                  <div className="flex justify-center">
                    <BodyDiagram
                      bodyParts={
                        bodyPartsForDate.length > 0
                          ? // If we have workout data for this day, show all parts and highlight the active ones
                            bodyPartsForDate.map((part) => ({
                              ...part,
                              intensity: diagramBodyParts.some(
                                (dp) => dp.slug === part.slug,
                              )
                                ? ("moderate" as const)
                                : ("none" as const),
                            }))
                          : // If no workout, but we have photo tags, show just the tagged parts
                            diagramBodyParts
                      }
                      size="lg"
                      interactive
                      onBodyPartClick={handleBodyPartClick}
                      view={bodyView}
                      showLegend={false}
                      colors={["#22c55e", "#16a34a", "#15803d"]}
                    />
                  </div>

                  <p className="text-xs text-center text-muted-foreground">
                    Click a muscle group to filter photos
                  </p>

                  {/* Muscles shown */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">
                      {selectedPhoto?.bodyParts?.length
                        ? "Tagged on this photo"
                        : "Muscles worked today"}
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {bodyPartsForDate.map((part) => {
                        const isHighlighted = diagramBodyParts.some(
                          (dp) => dp.slug === part.slug,
                        );
                        const isFiltered = selectedBodyPartFilter === part.slug;
                        return (
                          <Badge
                            key={part.slug}
                            variant={
                              isFiltered
                                ? "default"
                                : isHighlighted
                                  ? "secondary"
                                  : "outline"
                            }
                            className={`cursor-pointer transition-colors ${
                              !isHighlighted && !isFiltered ? "opacity-50" : ""
                            }`}
                            onClick={() =>
                              setSelectedBodyPartFilter(
                                isFiltered ? null : part.slug,
                              )
                            }
                          >
                            {part.name}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>

                  {/* Exercises */}
                  {exercisesForDate.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm">Exercises</h4>
                      <div className="grid gap-1.5">
                        {exercisesForDate.map((exercise, index) => (
                          <div
                            key={index}
                            className="bg-muted/50 rounded-lg px-3 py-2 text-sm"
                          >
                            {exercise}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="mb-2">No workout data found for this day</p>
                  <p className="text-sm">
                    Photos were uploaded but no workout was recorded
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Body Diagram Only (when no photos) */
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  Muscles Worked This Day
                </CardTitle>
                <CardDescription>
                  Body parts targeted during workouts on{" "}
                  {format(selectedDate, "MMMM d, yyyy")}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={bodyView === "front" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setBodyView("front")}
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Front
                </Button>
                <Button
                  variant={bodyView === "back" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setBodyView("back")}
                >
                  <RotateCw className="h-4 w-4 mr-1" />
                  Back
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {bodyPartsForDate.length > 0 ? (
              <div className="space-y-6">
                {/* Body Diagram */}
                <div className="flex justify-center">
                  <BodyDiagram
                    bodyParts={bodyPartsForDate}
                    size="lg"
                    interactive={false}
                    view={bodyView}
                    showLegend={true}
                    colors={["#22c55e", "#16a34a", "#15803d"]}
                    defaultFill="#3b82f6"
                    legendLabels={["Light", "Moderate", "Heavy"]}
                  />
                </div>

                {/* Muscles Targeted */}
                <div className="space-y-3">
                  <h4 className="font-medium">Muscles Targeted</h4>
                  <div className="flex flex-wrap gap-2">
                    {bodyPartsForDate.map((part) => (
                      <Badge key={part.slug} variant="secondary">
                        {part.name}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Exercises */}
                {exercisesForDate.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium">Exercises Performed</h4>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {exercisesForDate.map((exercise, index) => (
                        <div
                          key={index}
                          className="bg-muted/50 rounded-lg p-3 text-sm"
                        >
                          {exercise}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p className="mb-2">No workout data found for this day</p>
                <p className="text-sm">
                  {photosForDate.length > 0
                    ? "Photos were uploaded but no workout was recorded"
                    : "No photos or workouts on this date"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {isDev && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Debug Info</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-2 rounded overflow-auto">
              {JSON.stringify(debugPayload, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
