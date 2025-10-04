"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Download, Trash2 } from "lucide-react"
import { signOut } from "next-auth/react"
import { toast } from "sonner"
import { AppPrefs } from "./types"
import { logger } from "@/lib/logger"

interface PrivacyTabProps {
  appPrefs: AppPrefs
  setAppPrefs: (prefs: AppPrefs) => void
}

export function PrivacyTab({ appPrefs, setAppPrefs }: PrivacyTabProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [exportOptions, setExportOptions] = useState({
    userInfo: true,
    workoutData: true,
    nutritionData: true,
    weightData: true,
    scheduleData: true,
    preferences: true
  })
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
    <Card>
      <CardHeader>
        <CardTitle>Privacy & Security</CardTitle>
        <CardDescription>Manage your data and privacy settings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Anonymous Data Sharing</Label>
            <p className="text-sm text-muted-foreground">Help improve the app by sharing anonymous usage data and error reports</p>
          </div>
          <Switch
            checked={appPrefs.dataSharing}
            onCheckedChange={(checked) => setAppPrefs({ ...appPrefs, dataSharing: checked })}
          />
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Error Reporting</h3>
          <p className="text-sm text-muted-foreground">
            Control how application errors are handled and reported
          </p>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Send Error Reports to Admin</Label>
              <p className="text-sm text-muted-foreground">Allow the app to send error reports directly to the admin when issues occur</p>
            </div>
            <Switch
              checked={appPrefs.adminNotifications?.enabled ?? true}
              onCheckedChange={(checked) => setAppPrefs({
                ...appPrefs,
                adminNotifications: {
                  ...appPrefs.adminNotifications,
                  enabled: checked,
                  methods: appPrefs.adminNotifications?.methods ?? ['smtp'],
                  errorAlerts: appPrefs.adminNotifications?.errorAlerts ?? true,
                  startupAlerts: appPrefs.adminNotifications?.startupAlerts ?? true
                }
              })}
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Change Password</Label>
            <Button variant="outline" className="w-full sm:w-auto bg-transparent" onClick={() => signOut()}>
              Sign Out
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Export Data</Label>
            <p className="text-sm text-muted-foreground">Download your fitness data in JSON format</p>
            <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto bg-transparent">
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
            <Label>Delete Account</Label>
            <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
            <Button variant="destructive" className="w-full sm:w-auto" onClick={handleDeleteAccount} disabled={isDeleting}>
              <Trash2 className="h-4 w-4 mr-2" />
              {isDeleting ? "Deleting..." : "Delete Account"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
