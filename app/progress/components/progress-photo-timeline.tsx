"use client";

import React, { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow, format } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Trash2,
  Calendar,
  Film,
  Pause,
  Play,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProgressPhoto {
  id: string;
  url: string;
  notes?: string;
  bodyParts?: string[];
  uploadDate: string;
  createdAt: string;
}

interface ProgressPhotoTimelineProps {
  onPhotoDeleted?: (photoId: string) => void;
  viewMode?: "grid" | "timeline";
  refreshKey?: number;
}

export function ProgressPhotoTimeline({
  onPhotoDeleted,
  viewMode = "timeline",
  refreshKey,
}: ProgressPhotoTimelineProps) {
  const isDev = process.env.NODE_ENV !== "production";
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [timelapseOpen, setTimelapseOpen] = useState(false);
  const [timelapseIndex, setTimelapseIndex] = useState(0);
  const [timelapsePlaying, setTimelapsePlaying] = useState(true);
  const [timelapseSpeed, setTimelapseSpeed] = useState("1000");
  const [imageLoadError, setImageLoadError] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/progress/photos", {
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch progress photos");
        }

        const data = await response.json();
        setPhotos(data.photos || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load progress photos",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPhotos();
  }, [refreshKey]);

  useEffect(() => {
    setSelectedPhotoIndex((prev) =>
      photos.length === 0 ? 0 : Math.min(prev, photos.length - 1),
    );
  }, [photos.length]);

  const timelapsePhotos = useMemo(
    () =>
      [...photos].sort(
        (a, b) =>
          new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime(),
      ),
    [photos],
  );

  useEffect(() => {
    if (!timelapseOpen) {
      setTimelapsePlaying(false);
      return;
    }

    setTimelapseIndex(0);
    setTimelapsePlaying(true);
  }, [timelapseOpen, timelapsePhotos.length]);

  useEffect(() => {
    if (!timelapseOpen || !timelapsePlaying || timelapsePhotos.length === 0) {
      return;
    }

    const speed = Number(timelapseSpeed);
    const interval = Number.isFinite(speed) ? speed : 1000;
    const timer = window.setInterval(() => {
      setTimelapseIndex((prev) =>
        prev + 1 >= timelapsePhotos.length ? 0 : prev + 1,
      );
    }, interval);

    return () => window.clearInterval(timer);
  }, [timelapseOpen, timelapsePlaying, timelapseSpeed, timelapsePhotos.length]);

  const handleDeletePhoto = async (photoId: string) => {
    try {
      const response = await fetch(`/api/progress/photos/${photoId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete photo");
      }

      setPhotos(photos.filter((p) => p.id !== photoId));
      if (selectedPhotoIndex >= photos.length - 1) {
        setSelectedPhotoIndex(Math.max(0, photos.length - 2));
      }

      toast({
        title: "Success",
        description: "Progress photo deleted",
      });

      onPhotoDeleted?.(photoId);
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to delete photo",
        variant: "destructive",
      });
    }
  };

  const handlePrevious = () => {
    setSelectedPhotoIndex(Math.max(0, selectedPhotoIndex - 1));
  };

  const handleNext = () => {
    setSelectedPhotoIndex(Math.min(photos.length - 1, selectedPhotoIndex + 1));
  };

  const currentPhoto = useMemo(
    () => photos[selectedPhotoIndex],
    [photos, selectedPhotoIndex],
  );
  const timelapsePhoto = timelapsePhotos[timelapseIndex];

  useEffect(() => {
    setImageLoadError(null);
    setImageLoaded(false);
  }, [currentPhoto?.id]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Progress Photos</CardTitle>
          <CardDescription>Your fitness journey timeline</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full h-96 rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-amber-200">
        <CardHeader>
          <CardTitle>Progress Photos</CardTitle>
          <CardDescription className="text-amber-600">{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Unable to load progress photos. Try again later.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (photos.length === 0 || !currentPhoto) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Progress Photos</CardTitle>
          <CardDescription>Your fitness journey timeline</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">No progress photos yet</p>
          <p className="text-sm text-muted-foreground mt-2">
            Upload your first photo to start tracking your progress
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!currentPhoto) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Progress Photos</CardTitle>
          <CardDescription>Your fitness journey timeline</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">No progress photos yet</p>
          <p className="text-sm text-muted-foreground mt-2">
            Upload your first photo to start tracking your progress
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleCopyViewLink = async (photoId: string) => {
    const url = `${window.location.origin}/api/progress/photos/${photoId}/view`;
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copied",
        description: "View link copied to clipboard.",
      });
    } catch {
      toast({
        title: "Copy failed",
        description: "Unable to copy the link. Try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Progress Photos</CardTitle>
        <CardDescription>Your fitness journey timeline</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs text-muted-foreground">
            {photos.length} photo{photos.length === 1 ? "" : "s"} uploaded
          </div>
          <Dialog open={timelapseOpen} onOpenChange={setTimelapseOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Film className="h-4 w-4 mr-2" />
                Play timelapse
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Progress Timelapse</DialogTitle>
                <DialogDescription>
                  Watch your progress evolve from oldest to newest.
                </DialogDescription>
              </DialogHeader>

              {timelapsePhotos.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  Add more progress photos to generate a timelapse.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative bg-muted rounded-lg overflow-hidden aspect-[4/5]">
                    {timelapsePhoto?.url ? (
                      <img
                        src={timelapsePhoto.url}
                        alt="Timelapse frame"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                        Image unavailable
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-4">
                      <p className="text-white text-sm font-medium">
                        {timelapsePhoto
                          ? format(
                              new Date(timelapsePhoto.uploadDate),
                              "MMMM d, yyyy",
                            )
                          : ""}
                      </p>
                      <p className="text-white/80 text-xs">
                        Frame {timelapseIndex + 1} of{" "}
                        {timelapsePhotos.length}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTimelapsePlaying((prev) => !prev)}
                      >
                        {timelapsePlaying ? (
                          <>
                            <Pause className="h-4 w-4 mr-2" /> Pause
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" /> Play
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setTimelapseIndex((prev) =>
                            prev === 0 ? timelapsePhotos.length - 1 : prev - 1,
                          )
                        }
                      >
                        Previous
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setTimelapseIndex((prev) =>
                            prev + 1 >= timelapsePhotos.length ? 0 : prev + 1,
                          )
                        }
                      >
                        Next
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        Speed
                      </span>
                      <Select
                        value={timelapseSpeed}
                        onValueChange={setTimelapseSpeed}
                      >
                        <SelectTrigger size="sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="500">0.5s</SelectItem>
                          <SelectItem value="1000">1s</SelectItem>
                          <SelectItem value="1500">1.5s</SelectItem>
                          <SelectItem value="2000">2s</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
        {viewMode === "timeline" ? (
          <>
            {/* Main Photo Display */}
            <div className="relative bg-muted rounded-lg overflow-hidden h-96">
              {currentPhoto.url ? (
                <img
                  src={currentPhoto.url}
                  alt="Progress photo"
                  className="w-full h-full object-cover"
                  onLoad={() => {
                    setImageLoaded(true);
                    if (isDev) {
                      console.info("Progress image loaded", {
                        id: currentPhoto.id,
                        url: currentPhoto.url,
                      });
                    }
                  }}
                  onError={(event) => {
                    if (isDev) {
                      const target = event.currentTarget;
                      console.error("Progress image failed to load", {
                        id: currentPhoto.id,
                        url: currentPhoto.url,
                        currentSrc: target.currentSrc,
                        naturalWidth: target.naturalWidth,
                        naturalHeight: target.naturalHeight,
                      });
                    }
                    setImageLoadError("Unable to load this image in-page.");
                  }}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Image unavailable
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-4">
                <p className="text-white text-sm font-medium">
                  {format(new Date(currentPhoto.uploadDate), "MMMM d, yyyy")}
                </p>
                <p className="text-white/80 text-xs">
                  {formatDistanceToNow(new Date(currentPhoto.uploadDate), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </div>

            {/* Photo Notes */}
            {currentPhoto.notes && (
              <div className="bg-muted/50 rounded-lg p-3 border border-border">
                <p className="text-sm font-medium mb-1">Notes</p>
                <p className="text-sm text-muted-foreground">
                  {currentPhoto.notes}
                </p>
              </div>
            )}

            {currentPhoto.bodyParts?.length ? (
              <div className="bg-muted/50 rounded-lg p-3 border border-border">
                <p className="text-sm font-medium mb-2">
                  Worked body parts
                </p>
                <div className="flex flex-wrap gap-2">
                  {currentPhoto.bodyParts.map((part) => (
                    <Badge key={part} variant="secondary">
                      {part.replace(/-/g, " ")}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}

            {imageLoadError && (
              <p className="text-xs text-muted-foreground">
                {imageLoadError}
              </p>
            )}
            {isDev && currentPhoto.url && (
              <p className="text-xs text-muted-foreground">
                {imageLoaded ? "Image loaded in-page" : "Image not loaded yet"}
              </p>
            )}

            {isDev && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopyViewLink(currentPhoto.id)}
              >
                Copy view link
              </Button>
            )}
            {isDev && currentPhoto.url && (
              <p className="text-xs text-muted-foreground break-all">
                {currentPhoto.url}
              </p>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                disabled={selectedPhotoIndex === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="text-sm text-muted-foreground">
                {selectedPhotoIndex + 1} of {photos.length}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleNext}
                disabled={selectedPhotoIndex === photos.length - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Thumbnail Strip */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {photos.map((photo, index) => (
                <button
                  key={photo.id}
                  onClick={() => setSelectedPhotoIndex(index)}
                  className={`flex-shrink-0 relative rounded-lg overflow-hidden border-2 transition-colors ${
                    index === selectedPhotoIndex
                      ? "border-primary"
                      : "border-border hover:border-muted-foreground"
                  }`}
                >
                  {photo.url ? (
                    <img
                      src={photo.url}
                      alt={`Progress photo ${index + 1}`}
                      className="w-16 h-20 object-cover"
                    />
                  ) : (
                    <div className="flex h-20 w-16 items-center justify-center bg-muted text-[10px] text-muted-foreground">
                      N/A
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Delete Button */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="w-full">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Photo
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogTitle>Delete Progress Photo</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this progress photo? This
                  action cannot be undone.
                </AlertDialogDescription>
                <div className="flex gap-2 justify-end">
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDeletePhoto(currentPhoto.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </div>
              </AlertDialogContent>
            </AlertDialog>
          </>
        ) : (
          // Grid View
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {photos.map((photo) => (
                <div key={photo.id} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                  {photo.url ? (
                    <img
                      src={photo.url}
                      alt="Progress photo"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                      Image unavailable
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeletePhoto(photo.id)}
                      className="text-white"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(photo.uploadDate), "MMM d, yyyy")}
                </p>
                {isDev && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyViewLink(photo.id)}
                  >
                    Copy view link
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
