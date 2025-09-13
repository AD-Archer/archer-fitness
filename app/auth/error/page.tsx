"use client"

import { Suspense, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, RefreshCw, Home, Shield, Mail } from "lucide-react"
import Link from "next/link"
import { logger } from "@/lib/logger"

const errorMessages: Record<string, string> = {
  Configuration: "There is a problem with the server configuration.",
  AccessDenied: "You do not have permission to sign in.",
  Verification: "The verification token has expired or has already been used.",
  Default: "An error occurred during authentication.",
  Callback: "There was an error in the OAuth callback process."
}

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")
  
  const errorMessage = error ? errorMessages[error] || errorMessages.Default : errorMessages.Default

  // Report auth errors to admin
  useEffect(() => {
    if (error) {
      fetch('/api/errors/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: {
            message: `Authentication Error: ${errorMessage}`,
            stack: `Auth Error Code: ${error}`,
            digest: `auth-error-${error}`,
          },
          context: 'Authentication error in Archer Fitness app',
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Server-side',
          url: typeof window !== 'undefined' ? window.location.href : 'Server-side',
          userId: 'Anonymous (Auth Error)',
          timestamp: new Date().toISOString(),
        }),
      }).catch(err => {
        logger.error('Failed to report auth error:', err)
      })
    }
  }, [error, errorMessage])

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-red-500 to-orange-500 rounded-full mb-6 shadow-lg">
            <Shield className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Authentication Error</h1>
          <p className="text-gray-600 text-lg">We encountered an issue while signing you in</p>
        </div>

        {/* Main Error Card */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4 mx-auto">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-xl font-semibold text-gray-900">Sign In Failed</CardTitle>
            <CardDescription className="text-gray-600">
              Something went wrong during the authentication process
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Error Details */}
            <Alert className="border-red-200 bg-red-50/50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <div className="font-medium mb-1">Error Details:</div>
                {errorMessage}
                {error && (
                  <div className="mt-2 text-xs text-red-700 font-mono">
                    Code: {error}
                  </div>
                )}
              </AlertDescription>
            </Alert>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button asChild className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg">
                <Link href="/auth/signin" className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Try Signing In Again
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="w-full h-12 border-gray-300 hover:bg-gray-50">
                <Link href="/" className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Return to Home
                </Link>
              </Button>
            </div>

            {/* Help Section */}
            <div className="pt-4 border-t border-gray-200">
              <div className="text-center space-y-3">
                <p className="text-sm text-gray-600">
                  Still having trouble? Here are some things you can try:
                </p>
                
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                    <RefreshCw className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-left">
                      <div className="font-medium text-blue-900">Clear your browser cache</div>
                      <div className="text-blue-700">Try clearing cookies and cache for this site</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                    <Mail className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="text-left">
                      <div className="font-medium text-green-900">Contact support</div>
                      <div className="text-green-700">Reach out to our support team for help</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Debug Info (Development Only) */}
            {process.env.NODE_ENV === "development" && (
              <div className="mt-6 p-4 bg-gray-100 rounded-lg border">
                <div className="text-xs font-mono text-gray-700">
                  <div className="font-semibold mb-2">Debug Information:</div>
                  <div>Error: {error || 'None'}</div>
                  <div>Timestamp: {new Date().toISOString()}</div>
                  <div>User Agent: {typeof window !== 'undefined' ? window.navigator.userAgent : 'Server'}</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Need help? <Link href="/contact" className="text-blue-600 hover:text-blue-700 font-medium">Contact Support</Link></p>
        </div>
      </div>
    </div>
  )
}

export default function AuthError() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  )
}
