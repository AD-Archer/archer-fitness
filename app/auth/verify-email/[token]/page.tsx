"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"

export default function VerifyEmailTokenPage() {
  const router = useRouter()
  const params = useParams()
  const token = params.token as string
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const response = await fetch("/api/auth/verify-email/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        })

        const data = await response.json()

        if (response.ok) {
          setStatus("success")
          setMessage(data.message || "Email verified successfully!")
          
          // Redirect after a delay
          setTimeout(() => {
            router.push("/settings?tab=security")
          }, 3000)
        } else {
          setStatus("error")
          setMessage(data.error || "Verification failed")
        }
      } catch {
        setStatus("error")
        setMessage("An error occurred during verification")
      }
    }

    if (token) {
      void verifyToken()
    } else {
      setStatus("error")
      setMessage("No verification token provided")
    }
  }, [token, router])

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
              {status === "verifying" && (
                <>
                  <Loader2 className="h-6 w-6 animate-spin" />
                  Verifying Email
                </>
              )}
              {status === "success" && (
                <>
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                  Email Verified!
                </>
              )}
              {status === "error" && (
                <>
                  <XCircle className="h-6 w-6 text-destructive" />
                  Verification Failed
                </>
              )}
            </CardTitle>
            <CardDescription className="text-center">
              {status === "verifying" && "Please wait while we verify your email..."}
              {status === "success" && "Your email has been successfully verified"}
              {status === "error" && "We couldn't verify your email"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {status === "verifying" && (
              <div className="flex justify-center py-8">
                <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
              </div>
            )}

            {status === "success" && (
              <Alert className="border-green-600 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-900">
                  {message}
                  <br />
                  <span className="text-sm">Redirecting you to settings...</span>
                </AlertDescription>
              </Alert>
            )}

            {status === "error" && (
              <>
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{message}</AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground text-center">
                    You can try entering the verification code instead
                  </p>
                  <Button
                    onClick={() => router.push("/auth/verify-email")}
                    variant="outline"
                    className="w-full"
                  >
                    Enter Verification Code
                  </Button>
                </div>
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
