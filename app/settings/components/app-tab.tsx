"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { AppPrefs } from "./types"

interface AppTabProps {
  appPrefs: AppPrefs
  setAppPrefs: (prefs: AppPrefs) => void
}

export function AppTab({ appPrefs, setAppPrefs }: AppTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>App Preferences</CardTitle>
        <CardDescription>Customize your app experience</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="theme">Theme</Label>
            <Select value={appPrefs.theme} onValueChange={(value) => setAppPrefs({ ...appPrefs, theme: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="units">Units</Label>
            <Select value={appPrefs.units} onValueChange={(value) => setAppPrefs({ ...appPrefs, units: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="metric">Metric</SelectItem>
                <SelectItem value="imperial">Imperial</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Push Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive workout reminders and updates</p>
            </div>
            <Switch
              checked={appPrefs.notifications}
              onCheckedChange={(checked) => setAppPrefs({ ...appPrefs, notifications: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Weekly Reports</Label>
              <p className="text-sm text-muted-foreground">Get weekly progress summaries</p>
            </div>
            <Switch
              checked={appPrefs.weeklyReports}
              onCheckedChange={(checked) => setAppPrefs({ ...appPrefs, weeklyReports: checked })}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
