"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Download, Trash2, Check, X } from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { toast } from "sonner"
import { logger } from "@/lib/logger"

export default function PrivacyPage() {
  const { data: session } = useSession()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [privacyAccepted, setPrivacyAccepted] = useState<boolean | null>(null)
  const [showAcceptanceDialog, setShowAcceptanceDialog] = useState(false)
  const [isAccepting, setIsAccepting] = useState(false)
  const [exportOptions, setExportOptions] = useState({
    userInfo: true,
    workoutData: true,
    nutritionData: true,
    weightData: true,
    scheduleData: true,
    preferences: true
  })

  // Check privacy acceptance status for authenticated users
  useEffect(() => {
    if (session?.user) {
      checkPrivacyAcceptance()
    } else {
      setPrivacyAccepted(null)
    }
  }, [session])

  const checkPrivacyAcceptance = async () => {
    try {
      const response = await fetch("/api/user/privacy")
      if (response.ok) {
        const data = await response.json()
        setPrivacyAccepted(data.privacyAccepted)
        if (!data.privacyAccepted) {
          setShowAcceptanceDialog(true)
        }
      }
    } catch (error) {
      logger.error("Failed to check privacy acceptance:", error)
    }
  }

  const handleAcceptPrivacy = async () => {
    setIsAccepting(true)
    try {
      const response = await fetch("/api/user/privacy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accepted: true }),
      })

      if (response.ok) {
        setPrivacyAccepted(true)
        setShowAcceptanceDialog(false)
        toast.success("Privacy policy accepted")
      } else {
        throw new Error("Failed to accept privacy policy")
      }
    } catch (error) {
      logger.error("Failed to accept privacy policy:", error)
      toast.error("Failed to accept privacy policy")
    } finally {
      setIsAccepting(false)
    }
  }

  const handleRejectPrivacy = () => {
    signOut({ callbackUrl: "/" })
  }

  const handleDeleteAccount = async () => {
    if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      setIsDeleting(true)
      try {
        const response = await fetch("/api/user/profile", {
          method: "DELETE",
        })

        if (response.ok) {
          await signOut({ callbackUrl: "/" })
          toast.success("Account deleted successfully")
        } else {
          throw new Error("Failed to delete account")
        }
      } catch (error) {
        logger.error("Failed to delete account:", error)
        toast.error("Failed to delete account")
      } finally {
        setIsDeleting(false)
      }
    }
  }

  const handleExportData = async () => {
    setIsExporting(true)
    try {
      // Build query parameters from selected options
      const params = new URLSearchParams()
      Object.entries(exportOptions).forEach(([key, value]) => {
        if (value) params.append(key, 'true')
      })

      const response = await fetch(`/api/user/export?${params.toString()}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.style.display = "none"
        a.href = url
        a.download = "fitness-data-export.json"
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        toast.success("Data exported successfully")
        setExportDialogOpen(false)
      } else {
        throw new Error("Failed to export data")
      }
    } catch (error) {
      logger.error("Failed to export data:", error)
      toast.error("Failed to export data")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <>
      <div className="flex min-h-screen bg-background">
        {session && privacyAccepted && <Sidebar />}

        <main className={`flex-1 p-3 md:p-6 lg:p-8 ${session && privacyAccepted ? 'lg:ml-0' : ''} overflow-x-hidden`}>
          <div className="max-w-4xl mx-auto space-y-4 md:space-y-6 lg:space-y-8">
            <div className={`flex flex-col gap-4 md:flex-row md:items-center md:justify-between ${session && privacyAccepted ? 'pt-12 lg:pt-0' : 'pt-4'}`}>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-balance">Privacy Policy</h1>
                <p className="text-muted-foreground text-pretty">
                  {session && !privacyAccepted
                    ? "Please review and accept our privacy policy to continue using the app"
                    : session
                    ? "Review your data privacy and account management options"
                    : "Learn about how we handle your data and privacy"
                  }
                </p>
              </div>
            </div>

            {/* Show privacy content - always visible, but only show account management for authenticated users */}
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl font-bold text-center">Privacy Policy</CardTitle>
                <CardDescription className="text-center">
                  Your privacy is important to us. Review what data we collect and manage your account.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                  <div className="prose max-w-none">
                    <h2 className="text-2xl font-semibold mb-4">What Data We Collect</h2>
                    <p className="mb-4">
                      Archer Fitness collects the following types of data to provide you with personalized fitness tracking:
                    </p>

                    <h3 className="text-xl font-medium mb-2">Account Information</h3>
                    <ul className="list-disc list-inside mb-4 space-y-1">
                      <li>Name, email address, and password</li>
                      <li>Profile picture (if provided)</li>
                      <li>Account creation and last update timestamps</li>
                      <li>Authentication provider data (Google, etc.)</li>
                      <li>Session tokens and verification tokens</li>
                    </ul>

                    <h3 className="text-xl font-medium mb-2">Personal Fitness Profile</h3>
                    <ul className="list-disc list-inside mb-4 space-y-1">
                      <li>Height, weight, age, gender</li>
                      <li>Fitness goals and objectives</li>
                      <li>Activity level and experience level</li>
                      <li>Weight tracking history with dates and notes</li>
                    </ul>

                    <h3 className="text-xl font-medium mb-2">Workout Data</h3>
                    <ul className="list-disc list-inside mb-4 space-y-1">
                      <li>Workout templates (custom and AI-generated)</li>
                      <li>Workout sessions with start/end times and duration</li>
                      <li>Exercise performance data (sets, reps, weights, rest times)</li>
                      <li>Exercise completion status and perfection scores</li>
                      <li>Workout notes and progress tracking</li>
                      <li>Saved workout states for resuming paused sessions</li>
                      <li>Completed workout days calendar</li>
                    </ul>

                    <h3 className="text-xl font-medium mb-2">Nutrition Data</h3>
                    <ul className="list-disc list-inside mb-4 space-y-1">
                      <li>Daily nutrition logs (calories, protein, carbs, fat)</li>
                      <li>Meal entries with detailed food composition</li>
                      <li>Custom foods and recipes with nutritional information</li>
                      <li>Meal planning and scheduling data</li>
                      <li>Food database usage and custom food additions</li>
                    </ul>

                    <h3 className="text-xl font-medium mb-2">Schedule Data</h3>
                    <ul className="list-disc list-inside mb-4 space-y-1">
                      <li>Weekly workout and meal schedules</li>
                      <li>Schedule templates for recurring plans</li>
                      <li>Calendar integration for planned activities</li>
                    </ul>

                    <h3 className="text-xl font-medium mb-2">Preferences and Settings</h3>
                    <ul className="list-disc list-inside mb-4 space-y-1">
                      <li>App preferences (theme, units, notifications)</li>
                      <li>Workout preferences (difficulty, equipment, duration)</li>
                      <li>Nutrition preferences (daily targets, dietary restrictions)</li>
                      <li>Notification settings and schedules</li>
                      <li>Admin notification preferences for error reporting</li>
                    </ul>

                    <h3 className="text-xl font-medium mb-2">Technical Data</h3>
                    <ul className="list-disc list-inside mb-4 space-y-1">
                      <li>Push notification subscriptions</li>
                      <li>Authentication tokens and sessions</li>
                      <li>Anonymous usage analytics (if enabled)</li>
                      <li>Error reports and crash logs (if enabled)</li>
                      <li>Device and browser information for compatibility</li>
                    </ul>

                    <h2 className="text-2xl font-semibold mb-4">How We Use Your Data</h2>
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

                    <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
                    <p className="mb-4">
                      We take data security seriously. All data is encrypted in transit and at rest.
                      We use industry-standard security practices including secure authentication,
                      data encryption, and regular security audits to protect your information.
                    </p>

                    <h2 className="text-2xl font-semibold mb-4">Data Sharing</h2>
                    <p className="mb-4">
                      We do not sell your personal data to third parties. We may share anonymous,
                      aggregated data for research purposes only if you explicitly opt-in to data sharing.
                      Your data is never shared with advertisers or marketing companies.
                    </p>

                    <h2 className="text-2xl font-semibold mb-4">Your Rights</h2>
                    <ul className="list-disc list-inside mb-4 space-y-1">
                      <li>Access your data at any time through the app</li>
                      <li>Export your data in JSON format</li>
                      <li>Delete your account and all associated data permanently</li>
                      <li>Opt-out of data sharing and analytics at any time</li>
                      <li>Update your preferences and notification settings</li>
                      <li>Request data correction or deletion</li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h2 className="text-2xl font-semibold">About This Application</h2>
                    <div className="prose max-w-none">
                      <p className="mb-4">
                        Archer Fitness is an open-source fitness tracking application built with modern web technologies.
                        The application is completely self-hostable, giving you full control over your data and privacy.
                      </p>

                      <h3 className="text-xl font-medium mb-2">Self-Hosting</h3>
                      <p className="mb-4">
                        This application can be deployed on your own infrastructure. All components are containerized
                        and ready for deployment with Docker. You maintain complete ownership and control of your fitness data.
                      </p>

                      <h3 className="text-xl font-medium mb-2">Open Source</h3>
                      <p className="mb-4">
                        The source code is publicly available on GitHub. You can review, modify, and contribute to the codebase.
                      </p>

                      <div className="grid gap-4 md:grid-cols-2 mb-4">
                        <div>
                          <h4 className="text-lg font-medium mb-2">GitHub Repository</h4>
                          <a
                            href="https://github.com/AD-Archer/archer-fitness"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline"
                          >
                            https://github.com/AD-Archer/archer-fitness
                          </a>
                        </div>

                        <div>
                          <h4 className="text-lg font-medium mb-2">Docker Hub</h4>
                          <a
                            href="https://hub.docker.com/r/adarcher/archer-fitness"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline"
                          >
                            https://hub.docker.com/r/adarcher/archer-fitness
                          </a>
                        </div>
                      </div>

                      <div className="mb-4">
                        <h4 className="text-lg font-medium mb-2">Developer Portfolio</h4>
                        <a
                          href="https://www.antonioarcher.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          www.antonioarcher.com
                        </a>
                      </div>

                      <p className="text-sm text-muted-foreground">
                        Built with ❤️ by Antonio Archer
                      </p>
                    </div>
                  </div>

                  {/* Account Management - only show for authenticated users who have accepted privacy */}
                  {session && privacyAccepted && (
                    <div className="space-y-4">
                      <h2 className="text-2xl font-semibold">Account Management</h2>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <h3 className="text-lg font-medium">Export Your Data</h3>
                          <p className="text-sm text-muted-foreground">
                            Download your fitness data in JSON format
                          </p>
                          <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
                            <DialogTrigger asChild>
                              <Button variant="outline" className="w-full">
                                <Download className="h-4 w-4 mr-2" />
                                Export Data
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                              <DialogHeader>
                                <DialogTitle>Export Data Options</DialogTitle>
                                <DialogDescription>
                                  Choose which data you want to include in your export.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="userInfo"
                                    checked={exportOptions.userInfo}
                                    onCheckedChange={(checked) =>
                                      setExportOptions(prev => ({ ...prev, userInfo: checked as boolean }))
                                    }
                                  />
                                  <label
                                    htmlFor="userInfo"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                  >
                                    User Information
                                  </label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="workoutData"
                                    checked={exportOptions.workoutData}
                                    onCheckedChange={(checked) =>
                                      setExportOptions(prev => ({ ...prev, workoutData: checked as boolean }))
                                    }
                                  />
                                  <label
                                    htmlFor="workoutData"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                  >
                                    Workout History & Templates
                                  </label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="nutritionData"
                                    checked={exportOptions.nutritionData}
                                    onCheckedChange={(checked) =>
                                      setExportOptions(prev => ({ ...prev, nutritionData: checked as boolean }))
                                    }
                                  />
                                  <label
                                    htmlFor="nutritionData"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                  >
                                    Nutrition Logs & Meals
                                  </label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="weightData"
                                    checked={exportOptions.weightData}
                                    onCheckedChange={(checked) =>
                                      setExportOptions(prev => ({ ...prev, weightData: checked as boolean }))
                                    }
                                  />
                                  <label
                                    htmlFor="weightData"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                  >
                                    Weight Tracking
                                  </label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="scheduleData"
                                    checked={exportOptions.scheduleData}
                                    onCheckedChange={(checked) =>
                                      setExportOptions(prev => ({ ...prev, scheduleData: checked as boolean }))
                                    }
                                  />
                                  <label
                                    htmlFor="scheduleData"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                  >
                                    Schedules & Templates
                                  </label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="preferences"
                                    checked={exportOptions.preferences}
                                    onCheckedChange={(checked) =>
                                      setExportOptions(prev => ({ ...prev, preferences: checked as boolean }))
                                    }
                                  />
                                  <label
                                    htmlFor="preferences"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                  >
                                    App Preferences
                                  </label>
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  onClick={handleExportData}
                                  disabled={isExporting || !Object.values(exportOptions).some(v => v)}
                                >
                                  {isExporting ? "Exporting..." : "Export Selected Data"}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>

                        <div className="space-y-2">
                          <h3 className="text-lg font-medium">Delete Account</h3>
                          <p className="text-sm text-muted-foreground">
                            Permanently delete your account and all data
                          </p>
                          <Button
                            variant="destructive"
                            onClick={handleDeleteAccount}
                            disabled={isDeleting}
                            className="w-full"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {isDeleting ? "Deleting..." : "Delete Account"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
          </div>
        </main>
      </div>

      {/* Privacy Acceptance Dialog for authenticated users who haven't accepted */}
      <Dialog open={showAcceptanceDialog} onOpenChange={() => {}}>
        <DialogContent className="max-w-4xl max-h-[80vh]" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Privacy Policy Acceptance Required</DialogTitle>
            <DialogDescription>
              To continue using Archer Fitness, you must review and accept our privacy policy.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto pr-4">
            <div className="prose max-w-none">
              <h2 className="text-xl font-semibold mb-4">What Data We Collect</h2>
              <p className="mb-4">
                Archer Fitness collects the following types of data to provide you with personalized fitness tracking:
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
          </div>
          <div className="flex gap-4 justify-end mt-4">
            <Button variant="outline" onClick={handleRejectPrivacy} className="flex items-center gap-2">
              <X className="h-4 w-4" />
              Sign Out
            </Button>
            <Button onClick={handleAcceptPrivacy} disabled={isAccepting} className="flex items-center gap-2">
              <Check className="h-4 w-4" />
              {isAccepting ? "Accepting..." : "Accept & Continue"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}