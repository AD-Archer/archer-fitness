"use client"

import { useState } from "react"
import { ProgressPhotoUpload } from "./progress-photo-upload"
import { ProgressPhotoTimeline } from "./progress-photo-timeline"

export function ProgressPhotoSection() {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleUploaded = () => {
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ProgressPhotoUpload onPhotoUploaded={handleUploaded} />
      <ProgressPhotoTimeline refreshKey={refreshKey} />
    </div>
  )
}
