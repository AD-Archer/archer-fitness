import { ProgressAnalytics } from "@/app/progress/components/progress-analytics"
import { ProgressPhotoUpload } from "@/app/progress/components/progress-photo-upload"
import { ProgressPhotoTimeline } from "@/app/progress/components/progress-photo-timeline"
import { Sidebar } from "@/components/sidebar"

export default function ProgressPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 p-4 md:p-6 lg:p-8 lg:ml-0">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 pt-12 lg:pt-0">
            <h1 className="text-3xl font-bold tracking-tight text-balance">Progress Analytics</h1>
            <p className="text-muted-foreground text-pretty mt-2">
              Comprehensive insights into your fitness journey and performance trends
            </p>
          </div>

          <div className="space-y-8">
            {/* Photo Upload and Timeline Section */}
            <div className="grid gap-6 lg:grid-cols-2">
              <ProgressPhotoUpload />
              <ProgressPhotoTimeline />
            </div>

            {/* Analytics Section */}
            <ProgressAnalytics />
          </div>
        </div>
      </main>
    </div>
  )
}
