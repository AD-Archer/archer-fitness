"use client"

import React, { useMemo, useRef, useState } from "react"
import { Upload, X, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BodyDiagram } from "@/components/body-diagram"
import { Badge } from "@/components/ui/badge"

interface ProgressPhotoUploadProps {
  onPhotoUploaded?: (photoData: any) => void
  maxSize?: number // in MB
}

export function ProgressPhotoUpload({
  onPhotoUploaded,
  maxSize = 10,
}: ProgressPhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [previewWarning, setPreviewWarning] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [notes, setNotes] = useState("")
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedBodyParts, setSelectedBodyParts] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const selectableBodyParts = useMemo(
    () => [
      { name: "Chest", slug: "chest" },
      { name: "Abs", slug: "abs" },
      { name: "Biceps", slug: "biceps" },
      { name: "Triceps", slug: "triceps" },
      { name: "Forearms", slug: "forearms" },
      { name: "Front Deltoids", slug: "front-deltoids" },
      { name: "Back Deltoids", slug: "back-deltoids" },
      { name: "Trapezius", slug: "trapezius" },
      { name: "Lats", slug: "lats" },
      { name: "Upper Back", slug: "upper-back" },
      { name: "Lower Back", slug: "lower-back" },
      { name: "Glutes", slug: "gluteal" },
      { name: "Quads", slug: "quadriceps" },
      { name: "Hamstrings", slug: "hamstring" },
      { name: "Calves", slug: "calf" },
    ],
    [],
  )

  const bodyMapParts = useMemo(
    () =>
      selectableBodyParts.map((part) => ({
        name: part.name,
        slug: part.slug,
        intensity: selectedBodyParts.includes(part.slug)
          ? "moderate"
          : "none",
      })),
    [selectableBodyParts, selectedBodyParts],
  )

  const bodyPartLabelMap = useMemo(
    () =>
      new Map(
        selectableBodyParts.map((part) => [part.slug, part.name] as const),
      ),
    [selectableBodyParts],
  )

  const handleBodyPartToggle = (part: { slug: string }) => {
    setSelectedBodyParts((prev) =>
      prev.includes(part.slug)
        ? prev.filter((item) => item !== part.slug)
        : [...prev, part.slug],
    )
  }

  const MAX_DIMENSION = 1600
  const JPEG_QUALITY = 0.82

  const compressImage = async (selectedFile: File) => {
    const bitmap = await createImageBitmap(selectedFile)
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
    const width = Math.round(bitmap.width * scale)
    const height = Math.round(bitmap.height * scale)

    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      return selectedFile
    }

    ctx.drawImage(bitmap, 0, 0, width, height)

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(
        (b) => resolve(b),
        "image/jpeg",
        JPEG_QUALITY,
      ),
    )

    if (!blob) return selectedFile

    return new File([blob], selectedFile.name.replace(/\.[^/.]+$/, ".jpg"), {
      type: "image/jpeg",
    })
  }

  const handleIncomingFile = async (selectedFile: File) => {
    if (!selectedFile) return

    // Validate file type
    const isImageType = selectedFile.type.startsWith("image/")
    const isHeicExtension = /\.(heic|heif)$/i.test(selectedFile.name)
    if (!isImageType && !isHeicExtension) {
      setError("Please select an image file")
      return
    }

    // Validate file size
    const fileSizeMB = selectedFile.size / (1024 * 1024)
    if (fileSizeMB > maxSize) {
      setError(`File size must be less than ${maxSize}MB`)
      return
    }

    setError(null)
    setPreviewWarning(null)

    try {
      const compressedFile = await compressImage(selectedFile)
      setFile(compressedFile)

      // Create preview
      const reader = new FileReader()
      reader.onload = (event) => {
        setPreview(event.target?.result as string)
      }
      reader.readAsDataURL(compressedFile)
    } catch {
      // Some formats (HEIC/HEIF) may not preview in-browser.
      setFile(selectedFile)
      setPreview(null)
      setPreviewWarning(
        "Preview unavailable for this format. Your photo will still upload.",
      )
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]

    if (!selectedFile) return
    void handleIncomingFile(selectedFile)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile) {
      void handleIncomingFile(droppedFile)
    }
  }

  const handleRemoveFile = () => {
    setFile(null)
    setPreview(null)
    setPreviewWarning(null)
    setNotes("")
    setSelectedBodyParts([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file first")
      return
    }

    try {
      setUploading(true)
      setError(null)

      const formData = new FormData()
      formData.append("file", file)
      formData.append("notes", notes)
      formData.append("uploadDate", new Date().toISOString())
      formData.append("bodyParts", JSON.stringify(selectedBodyParts))

      const response = await fetch("/api/progress/upload-photo", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        let detail = ""
        try {
          const errorBody = await response.json()
          detail = errorBody?.detail ? ` (${errorBody.detail})` : ""
        } catch {
          detail = ""
        }
        throw new Error(`Failed to upload photo${detail}`)
      }

      const data = await response.json()
      toast({
        title: "Success",
        description: "Progress photo uploaded successfully",
      })

      onPhotoUploaded?.(data)
      handleRemoveFile()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to upload photo"
      setError(message)
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Progress Photo</CardTitle>
        <CardDescription>
          Document your fitness journey with before and after photos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!preview ? (
          <div
            className="relative border-2 border-dashed border-muted rounded-lg p-8 text-center cursor-pointer hover:border-primary hover:bg-accent/30 transition-colors"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                fileInputRef.current?.click()
              }
            }}
          >
            <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="font-medium mb-1">Click to upload or drag and drop</p>
            <p className="text-sm text-muted-foreground">
              PNG, JPG, GIF, HEIC up to {maxSize}MB
            </p>
            <div className="mt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  fileInputRef.current?.click()
                }}
              >
                Choose file
              </Button>
            </div>
            <Input
              ref={fileInputRef}
              id="progress-photo-file"
              type="file"
              accept="image/*,.heic,.heif"
              onChange={handleFileSelect}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              disabled={uploading}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative inline-block w-full">
              {preview ? (
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-auto rounded-lg border border-border object-cover max-h-96"
                />
              ) : (
                <div className="flex items-center justify-center rounded-lg border border-border bg-muted/40 h-64 text-sm text-muted-foreground">
                  Preview not available
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 bg-black/50 hover:bg-black/70"
                onClick={handleRemoveFile}
              >
                <X className="h-4 w-4 text-white" />
              </Button>
            </div>
            {previewWarning && (
              <p className="text-xs text-muted-foreground">{previewWarning}</p>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this photo (e.g., what you're focusing on, goals, measurements)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="resize-none"
                rows={3}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Body parts worked (optional)</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedBodyParts([])}
                  disabled={selectedBodyParts.length === 0}
                >
                  Clear
                </Button>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <BodyDiagram
                  bodyParts={bodyMapParts}
                  size="md"
                  interactive
                  dualView
                  showLegend={false}
                  colors={["#7dd3fc", "#38bdf8", "#0ea5e9"]}
                  onBodyPartClick={handleBodyPartToggle}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedBodyParts.length === 0 ? (
                  <span className="text-xs text-muted-foreground">
                    Tap a body part to add it to today&apos;s focus.
                  </span>
                ) : (
                  selectedBodyParts.map((part) => (
                    <Badge key={part} variant="secondary">
                      {bodyPartLabelMap.get(part) || part.replace(/-/g, " ")}
                    </Badge>
                  ))
                )}
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Photos are optimized before upload to save space.
            </p>

            <div className="flex gap-2">
              <Button
                onClick={handleUpload}
                disabled={uploading}
                className="flex-1"
              >
                {uploading ? "Uploading..." : "Upload Photo"}
              </Button>
              <Button
                variant="outline"
                onClick={handleRemoveFile}
                disabled={uploading}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
