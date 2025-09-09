"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Download } from "lucide-react"
import { signOut } from "next-auth/react"
import { toast } from "sonner"
import { AppPrefs } from "./types"

interface PrivacyTabProps {
  appPrefs: AppPrefs
  setAppPrefs: (prefs: AppPrefs) => void
}

export function PrivacyTab({ appPrefs, setAppPrefs }: PrivacyTabProps) {
  const handleDeleteAccount = async () => {
    if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
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
        console.error("Failed to delete account:", error)
        toast.error("Failed to delete account")
      }
    }
  }

  const handleExportData = async () => {
    try {
      const response = await fetch("/api/user/export")
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
      } else {
        throw new Error("Failed to export data")
      }
    } catch (error) {
      console.error("Failed to export data:", error)
      toast.error("Failed to export data")
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
            <p className="text-sm text-muted-foreground">Help improve the app by sharing anonymous usage data</p>
          </div>
          <Switch
            checked={appPrefs.dataSharing}
            onCheckedChange={(checked) => setAppPrefs({ ...appPrefs, dataSharing: checked })}
          />
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
            <p className="text-sm text-muted-foreground">Download all your workout and nutrition data</p>
            <Button variant="outline" className="w-full sm:w-auto bg-transparent" onClick={handleExportData}>
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Delete Account</Label>
            <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
            <Button variant="destructive" className="w-full sm:w-auto" onClick={handleDeleteAccount}>
              Delete Account
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
