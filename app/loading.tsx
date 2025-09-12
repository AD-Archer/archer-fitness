import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center space-y-6 pt-6">
          {/* Loading Spinner */}
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>

          {/* Loading Text */}
          <div className="text-center space-y-2">
            <h2 className="text-lg font-semibold">Loading...</h2>
            <p className="text-sm text-muted-foreground">
              Please wait while we prepare this page
            </p>
          </div>

          {/* Loading Skeleton Content */}
          <div className="w-full space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}