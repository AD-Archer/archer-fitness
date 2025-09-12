'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Home, ArrowLeft, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center space-y-6 pt-6">
          {/* 404 Display */}
          <div className="text-center">
            <h1 className="text-8xl font-bold text-primary/20 mb-2">404</h1>
            <h2 className="text-2xl font-semibold text-foreground mb-2">
              Page Not Found
            </h2>
            <p className="text-muted-foreground text-center max-w-sm">
              The page you&apos;re looking for doesn&apos;t exist or has been moved to a different location.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Button asChild className="flex-1">
              <Link href="/" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Go Home
              </Link>
            </Button>
            <Button variant="outline" asChild className="flex-1">
              <Link href="/workouts" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Browse Workouts
              </Link>
            </Button>
          </div>

          {/* Back Button */}
          <Button 
            variant="ghost" 
            onClick={() => window.history.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>

          {/* Additional Links */}
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Or try these popular sections:
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Link 
                href="/nutrition" 
                className="text-sm text-primary hover:underline"
              >
                Nutrition
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link 
                href="/progress" 
                className="text-sm text-primary hover:underline"
              >
                Progress
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link 
                href="/track" 
                className="text-sm text-primary hover:underline"
              >
                Track Workout
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}