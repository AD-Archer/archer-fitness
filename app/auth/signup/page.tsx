"use client"

import { useState, useEffect } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Chrome, Check, X } from "lucide-react"

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Always show privacy modal for new account creation
    setShowPrivacyModal(true)
  }, [])

  const handleAcceptPrivacy = () => {
    setPrivacyAccepted(true)
    setShowPrivacyModal(false)
  }

  const handleRejectPrivacy = () => {
    alert("You must accept the privacy policy to create an account.")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong")
      }

      // Auto sign in after successful registration
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.error) {
        setError("Account created but sign in failed. Please try signing in manually.")
      } else {
        router.push("/")
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/" })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Create an account</CardTitle>
            <CardDescription className="text-center">
              Enter your information to create your account
            </CardDescription>
          </CardHeader>
          {privacyAccepted ? (
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                variant="outline"
                type="button"
                className="w-full"
                onClick={handleGoogleSignIn}
              >
                <Chrome className="mr-2 h-4 w-4" />
                Continue with Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with email
                  </span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Create account"}
                </Button>
              </form>
            </CardContent>
          ) : (
            <CardContent className="space-y-4">
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  Before creating your account, please review and accept our privacy policy.
                </p>
                <Button onClick={() => setShowPrivacyModal(true)} className="w-full">
                  Review Privacy Policy
                </Button>
              </div>
            </CardContent>
          )}
          <CardFooter className="flex flex-col space-y-2">
            <p className="text-center text-sm text-gray-600">
              By creating an account, you agree to our{" "}
              <Link href="/privacy" className="font-medium text-blue-600 hover:text-blue-500">
                Privacy Policy
              </Link>
            </p>
            <p className="text-center text-sm text-gray-600 w-full">
              Already have an account?{" "}
              <Link href="/auth/signin" className="font-medium text-blue-600 hover:text-blue-500">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>

      <Dialog open={showPrivacyModal} onOpenChange={() => {}}>
        <DialogContent className="max-w-4xl max-h-[80vh]" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Privacy Policy</DialogTitle>
            <DialogDescription>
              Your privacy is important to us. Please read this policy carefully before creating an account.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="prose max-w-none">
              <h2 className="text-xl font-semibold mb-4">What Data We Collect</h2>
              <p className="mb-4">
                Archer Fitness collects the following types of data to provide you with personalized fitness and nutrition tracking:
              </p>

              <h3 className="text-lg font-medium mb-2">Account Information</h3>
              <ul className="list-disc list-inside mb-4 space-y-1">
                <li>Name, email address, and password</li>
                <li>Profile picture (if provided)</li>
                <li>Account creation and last update timestamps</li>
                <li>Authentication provider data (Google, etc.)</li>
                <li>Session tokens and verification tokens</li>
              </ul>

              <h3 className="text-lg font-medium mb-2">Personal Fitness Profile</h3>
              <ul className="list-disc list-inside mb-4 space-y-1">
                <li>Height, weight, age, gender</li>
                <li>Fitness goals and objectives</li>
                <li>Activity level and experience level</li>
                <li>Weight tracking history with dates and notes</li>
              </ul>

              <h3 className="text-lg font-medium mb-2">Workout Data</h3>
              <ul className="list-disc list-inside mb-4 space-y-1">
                <li>Workout templates (custom and AI-generated)</li>
                <li>Workout sessions with start/end times and duration</li>
                <li>Exercise performance data (sets, reps, weights, rest times)</li>
                <li>Exercise completion status and perfection scores</li>
                <li>Workout notes and progress tracking</li>
                <li>Saved workout states for resuming paused sessions</li>
                <li>Completed workout days calendar</li>
              </ul>

              <h3 className="text-lg font-medium mb-2">Nutrition Data</h3>
              <ul className="list-disc list-inside mb-4 space-y-1">
                <li>Daily nutrition logs (calories, protein, carbs, fat)</li>
                <li>Meal entries with detailed food composition</li>
                <li>Custom foods and recipes with nutritional information</li>
                <li>Meal planning and scheduling data</li>
                <li>Food database usage and custom food additions</li>
              </ul>

              <h3 className="text-lg font-medium mb-2">Schedule Data</h3>
              <ul className="list-disc list-inside mb-4 space-y-1">
                <li>Weekly workout and meal schedules</li>
                <li>Schedule templates for recurring plans</li>
                <li>Calendar integration for planned activities</li>
              </ul>

              <h3 className="text-lg font-medium mb-2">Preferences and Settings</h3>
              <ul className="list-disc list-inside mb-4 space-y-1">
                <li>App preferences (theme, units, notifications)</li>
                <li>Workout preferences (difficulty, equipment, duration)</li>
                <li>Nutrition preferences (daily targets, dietary restrictions)</li>
                <li>Notification settings and schedules</li>
                <li>Admin notification preferences for error reporting</li>
              </ul>

              <h3 className="text-lg font-medium mb-2">Technical Data</h3>
              <ul className="list-disc list-inside mb-4 space-y-1">
                <li>Push notification subscriptions</li>
                <li>Authentication tokens and sessions</li>
                <li>Anonymous usage analytics (if enabled)</li>
                <li>Error reports and crash logs (if enabled)</li>
                <li>Device and browser information for compatibility</li>
              </ul>

              <h2 className="text-xl font-semibold mb-4">How We Use Your Data</h2>
              <ul className="list-disc list-inside mb-4 space-y-1">
                <li>To provide personalized fitness and nutrition recommendations</li>
                <li>To track your progress and generate performance reports</li>
                <li>To send notifications and reminders for workouts/meals</li>
                <li>To calculate nutrition targets based on your profile</li>
                <li>To generate AI-powered workout and meal plans</li>
                <li>To improve our app through anonymous analytics</li>
                <li>To troubleshoot issues and provide technical support</li>
                <li>To maintain account security and prevent unauthorized access</li>
              </ul>

              <h2 className="text-xl font-semibold mb-4">Data Security</h2>
              <p className="mb-4">
                We take data security seriously. All data is encrypted in transit and at rest.
                We use industry-standard security practices including secure authentication,
                data encryption, and regular security audits to protect your information.
              </p>

              <h2 className="text-xl font-semibold mb-4">Data Sharing</h2>
              <p className="mb-4">
                We do not sell your personal data to third parties. We may share anonymous,
                aggregated data for research purposes only if you explicitly opt-in to data sharing.
                Your data is never shared with advertisers or marketing companies.
              </p>

              <h2 className="text-xl font-semibold mb-4">Your Rights</h2>
              <ul className="list-disc list-inside mb-4 space-y-1">
                <li>Access your data at any time through the app</li>
                <li>Export your data in JSON format</li>
                <li>Delete your account and all associated data permanently</li>
                <li>Opt-out of data sharing and analytics at any time</li>
                <li>Update your preferences and notification settings</li>
                <li>Request data correction or deletion</li>
              </ul>
            </div>
          </ScrollArea>
          <div className="flex gap-4 justify-end mt-4">
            <Button variant="outline" onClick={handleRejectPrivacy} className="flex items-center gap-2">
              <X className="h-4 w-4" />
              Reject
            </Button>
            <Button onClick={handleAcceptPrivacy} className="flex items-center gap-2">
              <Check className="h-4 w-4" />
              Accept & Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
