"use client"

import React, { useRef, useState } from "react"
import { Upload, X, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ProgressPhotoUploadProps {
  onPhotoUploaded?: (photoData: any) => void
  maxSize?: number // in MB
}

export function ProgressPhotoUpload({
  onPhotoUploaded,
  maxSize = 10,
}: ProgressPhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [notes, setNotes] = useState("")
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]

    if (!selectedFile) return

    // Validate file type
    if (!selectedFile.type.startsWith("image/")) {
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
    setFile(selectedFile)

    // Create preview
    const reader = new FileReader()
    reader.onload = (event) => {
      setPreview(event.target?.result as string)
    }
    reader.readAsDataURL(selectedFile)
  }

  const handleRemoveFile = () => {
    setFile(null)
    setPreview(null)
    setNotes("")
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

      const response = await fetch("/api/progress/upload-photo", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to upload photo")
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
            className="border-2 border-dashed border-muted rounded-lg p-8 text-center cursor-pointer hover:border-primary hover:bg-accent/30 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="font-medium mb-1">Click to upload or drag and drop</p>
            <p className="text-sm text-muted-foreground">
              PNG, JPG, GIF up to {maxSize}MB
            </p>
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative inline-block w-full">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-auto rounded-lg border border-border object-cover max-h-96"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 bg-black/50 hover:bg-black/70"
                onClick={handleRemoveFile}
              >
                <X className="h-4 w-4 text-white" />
              </Button>
            </div>

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
