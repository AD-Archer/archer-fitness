"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { AppPrefs } from "./types"
import { useNotifications } from "@/hooks/use-notifications"
import { useEffect } from "react"
import { toast } from "sonner"

interface AppTabProps {
  appPrefs: AppPrefs
  setAppPrefs: (prefs: AppPrefs) => void
}

export function AppTab({ appPrefs, setAppPrefs }: AppTabProps) {
  const { isSupported, permission, isSubscribed, isLoading, toggleNotifications, sendTestNotification } = useNotifications()

  // Sync the notifications preference with the actual subscription status
  useEffect(() => {
    if (isSupported && permission === 'granted') {
      setAppPrefs({ ...appPrefs, notifications: isSubscribed })
    }
  }, [isSupported, permission, isSubscribed, appPrefs, setAppPrefs])

  const handleNotificationsToggle = async (enabled: boolean) => {
    if (!isSupported) {
      toast.error('Notifications are not supported in this browser');
      return;
    }

    const success = await toggleNotifications(enabled);
    if (success) {
      setAppPrefs({ ...appPrefs, notifications: enabled });
    } else {
      // If enabling failed, keep the current state
      if (enabled) {
        toast.info('Notifications partially enabled. Some features may not work without proper configuration.');
      }
    }
  }

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
              <p className="text-sm text-muted-foreground">
                Receive workout reminders and updates
                {!isSupported && " (Not supported in this browser)"}
                {isSupported && permission === 'denied' && " (Permission denied)"}
              </p>
            </div>
            <Switch
              checked={appPrefs.notifications}
              onCheckedChange={handleNotificationsToggle}
              disabled={!isSupported || isLoading}
            />
          </div>

          {appPrefs.notifications && (
            <>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Workout Reminders</Label>
                  <p className="text-sm text-muted-foreground">Get notified about scheduled workouts</p>
                </div>
                <Switch
                  checked={appPrefs.notificationPrefs.workoutReminders}
                  onCheckedChange={(checked) => setAppPrefs({
                    ...appPrefs,
                    notificationPrefs: { ...appPrefs.notificationPrefs, workoutReminders: checked }
                  })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Weight Tracking Reminders</Label>
                  <p className="text-sm text-muted-foreground">Daily reminders to log your weight</p>
                </div>
                <Switch
                  checked={appPrefs.notificationPrefs.weightReminders}
                  onCheckedChange={(checked) => setAppPrefs({
                    ...appPrefs,
                    notificationPrefs: { ...appPrefs.notificationPrefs, weightReminders: checked }
                  })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Nutrition Reminders</Label>
                  <p className="text-sm text-muted-foreground">Reminders to log your meals</p>
                </div>
                <Switch
                  checked={appPrefs.notificationPrefs.nutritionReminders}
                  onCheckedChange={(checked) => setAppPrefs({
                    ...appPrefs,
                    notificationPrefs: { ...appPrefs.notificationPrefs, nutritionReminders: checked }
                  })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Streak Reminders</Label>
                  <p className="text-sm text-muted-foreground">Keep your fitness streak going</p>
                </div>
                <Switch
                  checked={appPrefs.notificationPrefs.streakReminders}
                  onCheckedChange={(checked) => setAppPrefs({
                    ...appPrefs,
                    notificationPrefs: { ...appPrefs.notificationPrefs, streakReminders: checked }
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reminder-time">Reminder Time</Label>
                <input
                  id="reminder-time"
                  type="time"
                  value={appPrefs.notificationPrefs.reminderTime}
                  onChange={(e) => setAppPrefs({
                    ...appPrefs,
                    notificationPrefs: { ...appPrefs.notificationPrefs, reminderTime: e.target.value }
                  })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </>
          )}

          {isSupported && permission === 'granted' && appPrefs.notifications && (
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Test Notification</Label>
                <p className="text-sm text-muted-foreground">Send a test notification to verify it's working</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={sendTestNotification}
                disabled={isLoading}
              >
                Test
              </Button>
            </div>
          )}

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
