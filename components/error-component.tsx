'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RefreshCw, Home, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

interface ErrorComponentProps {
  title?: string
  message?: string
  error?: Error
  onRetry?: () => void
  showHomeButton?: boolean
  showRetryButton?: boolean
  className?: string
}

export function ErrorComponent({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  error,
  onRetry,
  showHomeButton = true,
  showRetryButton = true,
  className = ''
}: ErrorComponentProps) {
  const isDevelopment = process.env.NODE_ENV === 'development'

  return (
    <div className={`flex items-center justify-center p-4 ${className}`}>
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-destructive/10 rounded-full">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-xl font-semibold">
            {title}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-muted-foreground text-sm">
              {message}
            </p>
          </div>

          {/* Error Details (Development Only) */}
          {isDevelopment && error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="font-mono text-xs">
                <div className="mt-1">
                  <strong>Error:</strong> {error.message}
                </div>
                {error.stack && (
                  <details className="mt-2">
                    <summary className="cursor-pointer hover:underline text-xs">
                      View Stack Trace
                    </summary>
                    <pre className="mt-2 text-xs whitespace-pre-wrap break-all max-h-32 overflow-y-auto">
                      {error.stack}
                    </pre>
                  </details>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            {showRetryButton && onRetry && (
              <Button 
                onClick={onRetry}
                className="flex-1 flex items-center gap-2"
                size="sm"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            )}
            {showHomeButton && (
              <Button variant="outline" asChild className="flex-1" size="sm">
                <Link href="/" className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Go Home
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}