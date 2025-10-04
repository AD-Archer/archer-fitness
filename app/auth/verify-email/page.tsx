"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Mail, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

export default function VerifyEmailPage() {
  const router = useRouter()
  const [code, setCode] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [verified, setVerified] = useState(false)
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const checkPendingVerification = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/verify-email")
      if (response.ok) {
        const data = await response.json()
        if (data.hasPendingVerification) {
          setPendingEmail(data.email)
        } else {
          // No pending verification - user might have already verified
          // or doesn't have a verification in progress
          // Don't redirect automatically, let them see the page
          setPendingEmail(null)
        }
      }
    } catch {
      toast.error("Failed to load verification status")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void checkPendingVerification()
  }, [checkPendingVerification])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()

    if (code.length !== 6) {
      toast.error("Please enter a valid 6-digit code")
      return
    }

    setIsVerifying(true)

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Verification failed")
      }

      setVerified(true)
      toast.success("Email verified successfully!")

      // Redirect after a short delay
      setTimeout(() => {
        router.push("/settings?tab=security")
      }, 2000)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Verification failed")
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResend = async () => {
    setIsResending(true)

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "PUT",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to resend email")
      }

      toast.success("Verification email resent! Check your inbox.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to resend email")
    } finally {
      setIsResending(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Show message if no pending verification
  if (!pendingEmail && !verified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <Link href="/" className="transition-transform hover:scale-105">
              <Image
                src="/android-chrome-512x512.png"
                alt="Archer Fitness Logo"
                width={120}
                height={120}
                className="rounded-2xl shadow-lg"
                priority
              />
            </Link>
          </div>

          <Card className="w-full">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
                <Mail className="h-6 w-6" />
                No Pending Verification
              </CardTitle>
              <CardDescription className="text-center">
                You don&apos;t have any pending email verification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>
                  Your email might already be verified, or you haven&apos;t initiated a verification yet.
                </AlertDescription>
              </Alert>

              <div className="pt-4 text-center space-y-2">
                <Link 
                  href="/settings?tab=security" 
                  className="block"
                >
                  <Button className="w-full">
                    Go to Settings
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center space-y-4">
          <Link href="/" className="transition-transform hover:scale-105">
            <Image
              src="/android-chrome-512x512.png"
              alt="Archer Fitness Logo"
              width={120}
              height={120}
              className="rounded-2xl shadow-lg"
              priority
            />
          </Link>
        </div>

        <Card className="w-full">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
              {verified ? (
                <>
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                  Email Verified!
                </>
              ) : (
                <>
                  <Mail className="h-6 w-6" />
                  Verify Your Email
                </>
              )}
            </CardTitle>
            <CardDescription className="text-center">
              {verified
                ? "Your email has been successfully verified"
                : `We sent a verification code to ${pendingEmail || "your email"}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {verified ? (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  Redirecting you back to settings...
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <form onSubmit={handleVerify} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">Verification Code</Label>
                    <Input
                      id="code"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="000000"
                      value={code}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "").slice(0, 6)
                        setCode(value)
                      }}
                      disabled={isVerifying}
                      maxLength={6}
                      className="text-center text-2xl tracking-widest"
                      autoComplete="one-time-code"
                      autoFocus
                    />
                    <p className="text-xs text-muted-foreground text-center">
                      Enter the 6-digit code from your email
                    </p>
                  </div>

                  <Button type="submit" className="w-full" disabled={isVerifying || code.length !== 6}>
                    {isVerifying ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Verify Email"
                    )}
                  </Button>
                </form>

                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Didn&apos;t receive the code?
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleResend}
                    disabled={isResending}
                    className="text-sm"
                  >
                    {isResending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Resending...
                      </>
                    ) : (
                      "Resend verification email"
                    )}
                  </Button>
                </div>

                <Alert>
                  <AlertDescription className="text-sm">
                    <strong>Tip:</strong> You can also click the verification link in the email we sent you.
                  </AlertDescription>
                </Alert>
              </>
            )}

            <div className="pt-4 text-center">
              <Link 
                href="/settings?tab=security" 
                className="text-sm text-muted-foreground hover:text-primary"
              >
                Back to settings
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
