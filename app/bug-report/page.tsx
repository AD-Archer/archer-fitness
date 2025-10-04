"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Bug, CheckCircle2, Loader2, AlertCircle } from "lucide-react"
import { toast } from "sonner"

export default function BugReportPage() {
  const { data: session } = useSession()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    severity: "",
    description: "",
    stepsToReproduce: "",
    expectedBehavior: "",
    actualBehavior: "",
    browserInfo: typeof window !== "undefined" ? window.navigator.userAgent : "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.category || !formData.severity || !formData.description) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/bug-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          userEmail: session?.user?.email,
          userName: session?.user?.name,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit bug report")
      }

      setSubmitted(true)
      toast.success("Bug report submitted successfully!")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit bug report")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-6 py-8">
              <CheckCircle2 className="h-16 w-16 text-green-600" />
              <h2 className="text-2xl font-bold text-center">Bug Report Submitted!</h2>
              <p className="text-muted-foreground text-center">
                Thank you for helping us improve Archer Fitness. We&apos;ll review your report shortly.
              </p>
              <div className="flex gap-4 w-full max-w-sm">
                <Button
                  onClick={() => {
                    setFormData({
                      title: "",
                      category: "",
                      severity: "",
                      description: "",
                      stepsToReproduce: "",
                      expectedBehavior: "",
                      actualBehavior: "",
                      browserInfo: typeof window !== "undefined" ? window.navigator.userAgent : "",
                    })
                    setSubmitted(false)
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Submit Another
                </Button>
                <Button
                  onClick={() => window.location.href = "/"}
                  className="flex-1"
                >
                  Go to Homepage
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Bug className="h-8 w-8" />
          Report a Bug
        </h1>
        <p className="text-muted-foreground mt-2">
          Help us improve by reporting any issues you encounter
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Bug Details</CardTitle>
            <CardDescription>
              Please provide as much detail as possible to help us resolve the issue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Bug Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Brief description of the issue"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">
                Category <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="workout">Workout Tracking</SelectItem>
                  <SelectItem value="schedule">Schedule</SelectItem>
                  <SelectItem value="progress">Progress/Statistics</SelectItem>
                  <SelectItem value="recovery">Recovery</SelectItem>
                  <SelectItem value="nutrition">Nutrition</SelectItem>
                  <SelectItem value="settings">Settings</SelectItem>
                  <SelectItem value="auth">Authentication</SelectItem>
                  <SelectItem value="ui">User Interface</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Severity */}
            <div className="space-y-2">
              <Label htmlFor="severity">
                Severity <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={formData.severity} 
                onValueChange={(value) => setFormData({ ...formData, severity: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="How severe is this issue?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Critical - App is unusable</SelectItem>
                  <SelectItem value="high">High - Major feature broken</SelectItem>
                  <SelectItem value="medium">Medium - Feature partially works</SelectItem>
                  <SelectItem value="low">Low - Minor issue or cosmetic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Describe the bug in detail..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                required
              />
            </div>

            {/* Steps to Reproduce */}
            <div className="space-y-2">
              <Label htmlFor="stepsToReproduce">Steps to Reproduce</Label>
              <Textarea
                id="stepsToReproduce"
                placeholder="1. Go to...&#10;2. Click on...&#10;3. See error..."
                value={formData.stepsToReproduce}
                onChange={(e) => setFormData({ ...formData, stepsToReproduce: e.target.value })}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Help us reproduce the issue by providing step-by-step instructions
              </p>
            </div>

            {/* Expected Behavior */}
            <div className="space-y-2">
              <Label htmlFor="expectedBehavior">Expected Behavior</Label>
              <Textarea
                id="expectedBehavior"
                placeholder="What did you expect to happen?"
                value={formData.expectedBehavior}
                onChange={(e) => setFormData({ ...formData, expectedBehavior: e.target.value })}
                rows={3}
              />
            </div>

            {/* Actual Behavior */}
            <div className="space-y-2">
              <Label htmlFor="actualBehavior">Actual Behavior</Label>
              <Textarea
                id="actualBehavior"
                placeholder="What actually happened?"
                value={formData.actualBehavior}
                onChange={(e) => setFormData({ ...formData, actualBehavior: e.target.value })}
                rows={3}
              />
            </div>

            {/* Browser Info (read-only) */}
            <div className="space-y-2">
              <Label htmlFor="browserInfo">Browser/Device Information</Label>
              <Textarea
                id="browserInfo"
                value={formData.browserInfo}
                readOnly
                rows={2}
                className="text-xs bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                This information helps us debug environment-specific issues
              </p>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Your report will be sent to our development team. If you&apos;re logged in, 
                we&apos;ll include your email so we can follow up if needed.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Bug className="mr-2 h-4 w-4" />
                Submit Bug Report
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
