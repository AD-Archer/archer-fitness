"use client";

import React, { useEffect, useState } from "react";
import { formatDistanceToNow, format } from "date-fns";
import { ChevronLeft, ChevronRight, Trash2, Calendar } from "lucide-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ProgressPhoto {
  id: string;
  url: string;
  notes?: string;
  uploadDate: string;
  createdAt: string;
}

interface ProgressPhotoTimelineProps {
  onPhotoDeleted?: (photoId: string) => void;
  viewMode?: "grid" | "timeline";
}

export function ProgressPhotoTimeline({
  onPhotoDeleted,
  viewMode = "timeline",
}: ProgressPhotoTimelineProps) {
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
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
  }, []);

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

  if (photos.length === 0) {
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

  const currentPhoto = photos[selectedPhotoIndex];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Progress Photos</CardTitle>
        <CardDescription>Your fitness journey timeline</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentViewMode === "timeline" ? (
          <>
            {/* Main Photo Display */}
            <div className="relative bg-muted rounded-lg overflow-hidden h-96">
              <img
                src={currentPhoto.url}
                alt="Progress photo"
                className="w-full h-full object-cover"
              />
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
                  <img
                    src={photo.url}
                    alt={`Progress photo ${index + 1}`}
                    className="w-16 h-20 object-cover"
                  />
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
                  <img
                    src={photo.url}
                    alt="Progress photo"
                    className="w-full h-full object-cover"
                  />
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
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
