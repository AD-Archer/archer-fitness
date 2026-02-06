"use client";

import React, { useRef, useState } from "react";
import {
  Upload,
  X,
  AlertCircle,
  Calendar,
  Plus,
  ImageIcon,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { useWorkoutBodyParts } from "@/hooks/use-workout-body-parts";
import { BODY_PARTS } from "./body-part-mappings";
import { BodyDiagram } from "@/components/body-diagram";

interface PhotoEntry {
  id: string;
  file: File;
  preview: string | null;
  previewWarning: string | null;
  notes: string;
  bodyParts: string[];
}

interface ProgressPhotoUploadProps {
  onPhotoUploaded?: (photoData: any) => void;
  maxSize?: number; // in MB
}

export function ProgressPhotoUpload({
  onPhotoUploaded,
  maxSize = 10,
}: ProgressPhotoUploadProps) {
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadDate, setUploadDate] = useState<Date>(new Date());
  const [isLegacyUpload, setIsLegacyUpload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Automatically fetch workout body parts for the selected date
  const {
    bodyParts: workoutBodyParts,
    exercises: workoutExercises,
    loading: workoutLoading,
    error: workoutError,
  } = useWorkoutBodyParts(isLegacyUpload ? uploadDate : new Date());

  const activePhoto = photos[activePhotoIndex] ?? null;

  const MAX_DIMENSION = 1600;
  const JPEG_QUALITY = 0.82;

  const compressImage = async (selectedFile: File) => {
    const bitmap = await createImageBitmap(selectedFile);
    const scale = Math.min(
      1,
      MAX_DIMENSION / Math.max(bitmap.width, bitmap.height),
    );
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return selectedFile;
    }

    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", JPEG_QUALITY),
    );

    if (!blob) return selectedFile;

    return new File([blob], selectedFile.name.replace(/\.[^/.]+$/, ".jpg"), {
      type: "image/jpeg",
    });
  };

  const handleIncomingFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    const newPhotos: PhotoEntry[] = [];

    for (const selectedFile of files) {
      // Validate file type
      const isImageType = selectedFile.type.startsWith("image/");
      const isHeicExtension = /\.(heic|heif)$/i.test(selectedFile.name);
      if (!isImageType && !isHeicExtension) {
        continue; // skip non-image files silently
      }

      // Validate file size
      const fileSizeMB = selectedFile.size / (1024 * 1024);
      if (fileSizeMB > maxSize) {
        toast({
          title: "File too large",
          description: `${selectedFile.name} exceeds ${maxSize}MB limit`,
          variant: "destructive",
        });
        continue;
      }

      try {
        const compressedFile = await compressImage(selectedFile);
        const preview = await new Promise<string | null>((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target?.result as string);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(compressedFile);
        });

        newPhotos.push({
          id: crypto.randomUUID(),
          file: compressedFile,
          preview,
          previewWarning: null,
          notes: "",
          bodyParts: [...workoutBodyParts], // Pre-fill from workout data
        });
      } catch {
        // HEIC/HEIF may not preview
        newPhotos.push({
          id: crypto.randomUUID(),
          file: selectedFile,
          preview: null,
          previewWarning:
            "Preview unavailable for this format. Your photo will still upload.",
          notes: "",
          bodyParts: [...workoutBodyParts],
        });
      }
    }

    if (newPhotos.length === 0 && files.length > 0) {
      setError("No valid image files found. Please select image files.");
      return;
    }

    setError(null);
    setPhotos((prev) => {
      const updated = [...prev, ...newPhotos];
      // Set active to the first newly added photo
      setActivePhotoIndex(prev.length);
      return updated;
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;
    void handleIncomingFiles(selectedFiles);
    // Reset input so the same file(s) can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      void handleIncomingFiles(droppedFiles);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      // Adjust activePhotoIndex
      if (updated.length === 0) {
        setActivePhotoIndex(0);
      } else if (activePhotoIndex >= updated.length) {
        setActivePhotoIndex(updated.length - 1);
      } else if (index < activePhotoIndex) {
        setActivePhotoIndex((prev) => prev - 1);
      }
      return updated;
    });
  };

  const handleRemoveAll = () => {
    setPhotos([]);
    setActivePhotoIndex(0);
    setError(null);
    setIsLegacyUpload(false);
    setUploadDate(new Date());
  };

  const updateActivePhoto = (updates: Partial<PhotoEntry>) => {
    setPhotos((prev) =>
      prev.map((photo, i) =>
        i === activePhotoIndex ? { ...photo, ...updates } : photo,
      ),
    );
  };

  const toggleBodyPart = (slug: string) => {
    if (!activePhoto) return;
    const current = activePhoto.bodyParts;
    const updated = current.includes(slug)
      ? current.filter((s) => s !== slug)
      : [...current, slug];
    updateActivePhoto({ bodyParts: updated });
  };

  const handleUpload = async () => {
    if (photos.length === 0) {
      setError("Please select at least one file");
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setUploadProgress(0);

      const dateStr = isLegacyUpload
        ? format(uploadDate, "yyyy-MM-dd") + "T12:00:00"
        : new Date().toISOString();

      let lastData: any = null;

      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        setUploadProgress(Math.round((i / photos.length) * 100));

        const formData = new FormData();
        formData.append("file", photo.file);
        formData.append("notes", photo.notes);
        formData.append("uploadDate", dateStr);
        formData.append("bodyParts", JSON.stringify(photo.bodyParts));

        const response = await fetch("/api/progress/upload-photo", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          let detail = "";
          try {
            const errorBody = await response.json();
            detail = errorBody?.detail ? ` (${errorBody.detail})` : "";
          } catch {
            detail = "";
          }
          throw new Error(
            `Failed to upload photo ${i + 1} of ${photos.length}${detail}`,
          );
        }

        lastData = await response.json();
      }

      setUploadProgress(100);

      toast({
        title: "Success",
        description: `${photos.length} photo${photos.length !== 1 ? "s" : ""} uploaded successfully`,
      });

      onPhotoUploaded?.(lastData);
      handleRemoveAll();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to upload photos";
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Progress Photos</CardTitle>
        <CardDescription>
          Select multiple photos and tag each with the body parts they show
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {photos.length === 0 ? (
          /* ── Drop zone (no photos yet) ── */
          <div
            className="relative border-2 border-dashed border-muted rounded-lg p-8 text-center cursor-pointer hover:border-primary hover:bg-accent/30 transition-colors"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                fileInputRef.current?.click();
              }
            }}
          >
            <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="font-medium mb-1">Click to upload or drag and drop</p>
            <p className="text-sm text-muted-foreground">
              Select one or more images · PNG, JPG, GIF, HEIC up to {maxSize}MB
              each
            </p>
            <div className="mt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                Choose files
              </Button>
            </div>
            <Input
              ref={fileInputRef}
              id="progress-photo-file"
              type="file"
              accept="image/*,.heic,.heif"
              multiple
              onChange={handleFileSelect}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              disabled={uploading}
            />
          </div>
        ) : (
          /* ── Photos selected ── */
          <div className="space-y-4">
            {/* ── Photo gallery strip ── */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  {photos.length} photo{photos.length !== 1 ? "s" : ""} selected
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-7 text-xs gap-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add More
                </Button>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.heic,.heif"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={uploading}
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {photos.map((photo, idx) => (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => setActivePhotoIndex(idx)}
                    className={`relative shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                      idx === activePhotoIndex
                        ? "border-primary ring-2 ring-primary/30 scale-[1.02]"
                        : "border-border hover:border-primary/50 opacity-70 hover:opacity-100"
                    }`}
                  >
                    {photo.preview ? (
                      <img
                        src={photo.preview}
                        alt={`Photo ${idx + 1}`}
                        className="h-20 w-auto max-w-28 object-contain bg-muted/30"
                      />
                    ) : (
                      <div className="h-20 w-20 flex items-center justify-center bg-muted">
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    {/* Index label */}
                    <span className="absolute top-0.5 left-0.5 bg-black/60 text-white text-[9px] font-bold rounded px-1 leading-relaxed">
                      {idx + 1}
                    </span>
                    {/* Body part count badge */}
                    {photo.bodyParts.length > 0 && (
                      <span className="absolute bottom-0.5 right-0.5 bg-primary text-primary-foreground text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                        {photo.bodyParts.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Active photo editor ── */}
            {activePhoto && (
              <div className="space-y-4">
                {/* Preview + body diagram side by side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Full preview */}
                  <div className="relative">
                    {activePhoto.preview ? (
                      <img
                        src={activePhoto.preview}
                        alt={`Photo ${activePhotoIndex + 1}`}
                        className="w-full h-auto rounded-lg border border-border object-contain max-h-[28rem] bg-muted/20"
                      />
                    ) : (
                      <div className="flex items-center justify-center rounded-lg border border-border bg-muted/40 h-64 text-sm text-muted-foreground">
                        Preview not available
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="bg-black/50 hover:bg-black/70 h-8 w-8"
                        onClick={() => handleRemovePhoto(activePhotoIndex)}
                        title="Remove this photo"
                      >
                        <X className="h-4 w-4 text-white" />
                      </Button>
                    </div>
                    <div className="absolute top-2 left-2">
                      <Badge
                        variant="secondary"
                        className="text-xs bg-black/60 text-white border-0"
                      >
                        Photo {activePhotoIndex + 1} of {photos.length}
                      </Badge>
                    </div>
                    {activePhoto.previewWarning && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {activePhoto.previewWarning}
                      </p>
                    )}
                  </div>

                  {/* Interactive body diagram — click to tag */}
                  <div className="space-y-2">
                    <Label className="text-sm">
                      Click body parts to tag this photo
                    </Label>
                    <div className="rounded-lg border border-border bg-muted/20 p-2">
                      <BodyDiagram
                        bodyParts={BODY_PARTS.map((part) => ({
                          name: part.name,
                          slug: part.slug,
                          intensity: activePhoto.bodyParts.includes(part.slug)
                            ? ("moderate" as const)
                            : ("none" as const),
                        }))}
                        size="md"
                        interactive
                        onBodyPartClick={(part) => toggleBodyPart(part.slug)}
                        dualView
                        showLegend={false}
                        colors={["#22c55e", "#16a34a", "#15803d"]}
                      />
                    </div>
                    {activePhoto.bodyParts.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {activePhoto.bodyParts.map((slug) => {
                          const part = BODY_PARTS.find((p) => p.slug === slug);
                          return (
                            <Badge
                              key={slug}
                              variant="secondary"
                              className="text-xs cursor-pointer hover:bg-destructive/20 hover:text-destructive transition-colors"
                              onClick={() => toggleBodyPart(slug)}
                              title="Click to remove"
                            >
                              {part?.name ?? slug}
                              <X className="h-3 w-3 ml-1" />
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes for this photo */}
                <div className="space-y-2">
                  <Label htmlFor="photo-notes">
                    Notes for this photo (optional)
                  </Label>
                  <Textarea
                    id="photo-notes"
                    placeholder="e.g. front pose, flexing, relaxed..."
                    value={activePhoto.notes}
                    onChange={(e) =>
                      updateActivePhoto({ notes: e.target.value })
                    }
                    className="resize-none"
                    rows={2}
                  />
                </div>

                {/* Body parts checkbox grid + workout info */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Or select from the list</Label>
                    {workoutLoading && (
                      <span className="text-xs text-muted-foreground">
                        Loading workout data...
                      </span>
                    )}
                  </div>

                  {workoutError && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        Could not load workout data: {workoutError}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5">
                    {BODY_PARTS.map((part) => {
                      const isChecked = activePhoto.bodyParts.includes(
                        part.slug,
                      );
                      const isFromWorkout = workoutBodyParts.includes(
                        part.slug,
                      );
                      return (
                        <label
                          key={part.slug}
                          className={`flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs cursor-pointer transition-colors ${
                            isChecked
                              ? "bg-primary/10 border-primary/50 font-medium"
                              : "hover:bg-accent/50 border-border"
                          }`}
                        >
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => toggleBodyPart(part.slug)}
                            className="h-3.5 w-3.5"
                          />
                          <span className="flex-1 truncate">
                            {part.name}
                            {isFromWorkout && (
                              <span
                                className="ml-1 text-primary"
                                title="Worked today"
                              >
                                ★
                              </span>
                            )}
                          </span>
                        </label>
                      );
                    })}
                  </div>

                  {workoutExercises.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        Today&apos;s exercises:
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {workoutExercises.slice(0, 4).join(", ")}
                        {workoutExercises.length > 4 &&
                          ` and ${workoutExercises.length - 4} more`}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Date picker ── */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="upload-date">Photo Date</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsLegacyUpload(!isLegacyUpload)}
                  className="text-xs h-auto py-1 px-2"
                >
                  {isLegacyUpload ? "Use Today" : "Use Past Date"}
                </Button>
              </div>
              {isLegacyUpload ? (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="upload-date"
                    type="date"
                    value={format(uploadDate, "yyyy-MM-dd")}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (!value) return;
                      const [year, month, day] = value.split("-").map(Number);
                      const newDate = new Date(
                        year,
                        month - 1,
                        day,
                        12,
                        0,
                        0,
                        0,
                      );
                      setUploadDate(newDate);
                    }}
                    max={format(new Date(), "yyyy-MM-dd")}
                    className="flex-1"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 border border-border rounded-md bg-muted/30">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Today: {format(new Date(), "MMMM d, yyyy")}
                  </span>
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              <b>Note: </b>Photos are optimized before upload to save space and
              encrypted at rest. You can delete them anytime.
            </p>

            {/* ── Action buttons ── */}
            <div className="flex gap-2">
              <Button
                onClick={handleUpload}
                disabled={uploading}
                className="flex-1"
              >
                {uploading
                  ? `Uploading... ${uploadProgress}%`
                  : `Upload ${photos.length} Photo${photos.length !== 1 ? "s" : ""}`}
              </Button>
              <Button
                variant="outline"
                onClick={handleRemoveAll}
                disabled={uploading}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
