'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RefreshCw, Home, AlertTriangle, Bug, Mail, Settings } from 'lucide-react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { logger } from "@/lib/logger"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  const { data: session } = useSession()
  const userId = session?.user?.id
  const [adminNotificationsEnabled, setAdminNotificationsEnabled] = useState<boolean>(true)
  const [emailSent, setEmailSent] = useState<boolean>(false)
  const [isReporting, setIsReporting] = useState<boolean>(false)

  useEffect(() => {
    // Fetch user preferences to check admin notifications setting
    const fetchPreferences = async () => {
      if (!userId) return
      try {
        const response = await fetch('/api/user/preferences')
        if (response.ok) {
          const data = await response.json()
          const enabled = data?.preferences?.appPrefs?.adminNotifications?.enabled ?? true
          setAdminNotificationsEnabled(enabled)
        }
      } catch (err) {
        logger.error('Failed to fetch user preferences:', err)
      }
    }

    fetchPreferences()
  }, [userId])

  const reportError = useCallback(async () => {
    setIsReporting(true)
    try {
      const response = await fetch('/api/errors/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: {
            message: error.message,
            stack: error.stack,
            digest: error.digest,
          },
          context: 'Client-side error in Archer Fitness app',
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Server-side',
          url: typeof window !== 'undefined' ? window.location.href : 'Server-side',
          userId: userId || 'Anonymous',
          timestamp: new Date().toISOString(),
        }),
      })
      if (response.ok) {
        setEmailSent(true)
      } else {
        logger.error('Failed to report error to admin')
      }
    } catch (err) {
      logger.error('Failed to report error to admin:', err)
    } finally {
      setIsReporting(false)
    }
  }, [error.message, error.stack, error.digest, userId])

  useEffect(() => {
    // Log the error to an error reporting service
    logger.error('Application error:', error)

    // Report error to admin if enabled
    if (adminNotificationsEnabled) {
      reportError()
    }
  }, [error, userId, adminNotificationsEnabled, reportError])

  const isDevelopment = process.env.NODE_ENV === 'development'

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-destructive/10 rounded-full">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-2xl font-semibold">
            Something went wrong!
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-muted-foreground">
              We&apos;re sorry, but something unexpected happened. This error has been logged and we&apos;ll look into it.
            </p>
          </div>

          {/* Error Details (Development Only) */}
          {isDevelopment && (
            <Alert variant="destructive">
              <Bug className="h-4 w-4" />
              <AlertDescription className="font-mono text-sm">
                <div className="mt-2">
                  <strong>Error:</strong> {error.message}
                </div>
                {error.digest && (
                  <div className="mt-1">
                    <strong>Digest:</strong> {error.digest}
                  </div>
                )}
                {error.stack && (
                  <details className="mt-2">
                    <summary className="cursor-pointer hover:underline">
                      View Stack Trace
                    </summary>
                    <pre className="mt-2 text-xs whitespace-pre-wrap break-all">
                      {error.stack}
                    </pre>
                  </details>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={reset}
              className="flex-1 flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            <Button variant="outline" asChild className="flex-1">
              <Link href="/" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Go Home
              </Link>
            </Button>
          </div>

          {/* Email Notification */}
          {emailSent && (
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                An email has been sent to the owners with details about this error.
              </AlertDescription>
            </Alert>
          )}

          {/* Manual Send Email */}
          {!adminNotificationsEnabled && !emailSent && (
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={reportError}
                disabled={isReporting}
                variant="outline"
                className="flex-1 flex items-center gap-2"
              >
                <Mail className="h-4 w-4" />
                {isReporting ? 'Sending...' : 'Send Error Report'}
              </Button>
            </div>
          )}

          {/* Additional Help */}
          <div className="text-center space-y-3 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              If this problem persists, try these steps:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <div className="p-3 bg-muted/50 rounded-lg">
                <strong className="block">Refresh the page</strong>
                <span className="text-muted-foreground">
                  Sometimes a simple refresh fixes temporary issues
                </span>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <strong className="block">Clear your cache</strong>
                <span className="text-muted-foreground">
                  Try clearing your browser cache and cookies
                </span>
              </div>
            </div>
            
            <div className="pt-2">
              <p className="text-xs text-muted-foreground">
                Error ID: {error.digest || 'Unknown'} • 
                Time: {new Date().toLocaleString()}
              </p>
              <Button variant="link" asChild className="text-xs p-0 h-auto">
                <Link href="/settings?tab=privacy" className="flex items-center gap-1">
                  <Settings className="h-3 w-3" />
                  Manage error reporting settings
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}