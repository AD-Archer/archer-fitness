"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { AppPrefs } from "./types"
import { useNotifications } from "@/hooks/use-notifications"

const FALLBACK_TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Madrid",
  "Africa/Johannesburg",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Asia/Kolkata",
  "Australia/Sydney"
]

interface AppTabProps {
  appPrefs: AppPrefs
  setAppPrefs: (prefs: AppPrefs) => void
}

export function AppTab({ appPrefs, setAppPrefs }: AppTabProps) {
  const { isSupported, permission, isLoading, sendTestNotification } = useNotifications()

  const timezoneOptions = useMemo(() => {
    try {
      const supported = (Intl as unknown as { supportedValuesOf?: (type: string) => string[] }).supportedValuesOf?.("timeZone")
      if (supported && supported.length > 0) {
        return supported
      }
    } catch {
      // ignore and fall back
    }
    return FALLBACK_TIMEZONES
  }, [])

  const handleUseDeviceTimezone = () => {
    try {
      const deviceTz = Intl.DateTimeFormat().resolvedOptions().timeZone
      if (deviceTz) {
        setAppPrefs({ ...appPrefs, timezone: deviceTz })
      }
    } catch {
      setAppPrefs({ ...appPrefs, timezone: "UTC" })
    }
  }

  // Ensure notificationPrefs exists with defaults - handle edge cases
  const notificationPrefs = appPrefs?.notificationPrefs || {
    workoutReminders: true,
    weightReminders: true,
    streakReminders: true,
    reminderTime: "09:00",
    emailNotifications: true,
    pushNotifications: true,
    weighInNotifications: true,
    weighInFrequency: 3 as 1 | 2 | 3,
    mealNotifications: true,
    mealFrequency: 3 as 1 | 3,
    sleepNotifications: true,
    exerciseNotifications: true,
    workoutTime: "18:00"
  }

  // Additional safety check - ensure frequency values are always valid
  const safeWeighInFrequency = notificationPrefs.weighInFrequency || 1
  const safeMealFrequency = notificationPrefs.mealFrequency || 3

  const updateNotificationPrefs = (updates: Partial<typeof notificationPrefs>) => {
    setAppPrefs({
      ...appPrefs,
      notificationPrefs: { ...notificationPrefs, ...updates }
    })
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

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="timezone">Timezone</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={handleUseDeviceTimezone}
              >
                Use device
              </Button>
            </div>
            <Select value={appPrefs.timezone} onValueChange={(value) => setAppPrefs({ ...appPrefs, timezone: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent className="max-h-64 overflow-y-auto">
                {timezoneOptions.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz}
                  </SelectItem>
                ))}
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
                Receive workout reminders and updates via push notifications
                {!isSupported && " (Not supported in this browser)"}
                {isSupported && permission === 'denied' && " (Permission denied)"}
              </p>
            </div>
            <Switch
              checked={notificationPrefs.pushNotifications}
              onCheckedChange={(checked) => updateNotificationPrefs({ pushNotifications: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive workout reminders and updates via email
              </p>
            </div>
            <Switch
              checked={notificationPrefs.emailNotifications}
              onCheckedChange={(checked) => updateNotificationPrefs({ emailNotifications: checked })}
            />
          </div>

          {appPrefs.notifications && (notificationPrefs.pushNotifications || notificationPrefs.emailNotifications) && (
            <>
              {/* Weigh-in Notifications */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Weigh-in Notifications</Label>
                    <p className="text-sm text-muted-foreground">Daily reminders to log your weight</p>
                  </div>
                  <Switch
                    checked={notificationPrefs.weighInNotifications}
                    onCheckedChange={(checked) => updateNotificationPrefs({ weighInNotifications: checked })}
                  />
                </div>
                {notificationPrefs.weighInNotifications && (
                  <div className="ml-4 space-y-2">
                    <Label htmlFor="weigh-in-frequency">Frequency</Label>
                    <Select
                      value={safeWeighInFrequency.toString()}
                      onValueChange={(value) => updateNotificationPrefs({ weighInFrequency: parseInt(value) as 1 | 2 | 3 })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Once per day</SelectItem>
                        <SelectItem value="2">Twice per day</SelectItem>
                        <SelectItem value="3">Three times per day</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Meal Notifications */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Meal Notifications</Label>
                    <p className="text-sm text-muted-foreground">Reminders to log your meals</p>
                  </div>
                  <Switch
                    checked={notificationPrefs.mealNotifications}
                    onCheckedChange={(checked) => updateNotificationPrefs({ mealNotifications: checked })}
                  />
                </div>
                {notificationPrefs.mealNotifications && (
                  <div className="ml-4 space-y-2">
                    <Label htmlFor="meal-frequency">Frequency</Label>
                    <Select
                      value={safeMealFrequency.toString()}
                      onValueChange={(value) => updateNotificationPrefs({ mealFrequency: parseInt(value) as 1 | 3 })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Once per day</SelectItem>
                        <SelectItem value="3">Three times per day (breakfast, lunch, dinner)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Sleep Notifications */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Sleep Notifications</Label>
                  <p className="text-sm text-muted-foreground">Morning reminders to log your sleep</p>
                </div>
                <Switch
                  checked={notificationPrefs.sleepNotifications}
                  onCheckedChange={(checked) => updateNotificationPrefs({ sleepNotifications: checked })}
                />
              </div>

              {/* Workout Time Picker */}
              <div className="space-y-2">
                <Label htmlFor="workout-time">Preferred Workout Time</Label>
                <p className="text-sm text-muted-foreground">Choose your preferred time for workout reminders</p>
                <input
                  id="workout-time"
                  type="time"
                  value={notificationPrefs.workoutTime || "18:00"}
                  onChange={(e) => updateNotificationPrefs({ workoutTime: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Workout Reminders</Label>
                  <p className="text-sm text-muted-foreground">Get notified about scheduled workouts</p>
                </div>
                <Switch
                  checked={notificationPrefs.workoutReminders}
                  onCheckedChange={(checked) => updateNotificationPrefs({ workoutReminders: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Weight Tracking Reminders</Label>
                  <p className="text-sm text-muted-foreground">Daily reminders to log your weight</p>
                </div>
                <Switch
                  checked={notificationPrefs.weightReminders}
                  onCheckedChange={(checked) => updateNotificationPrefs({ weightReminders: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Streak Reminders</Label>
                  <p className="text-sm text-muted-foreground">Keep your fitness streak going</p>
                </div>
                <Switch
                  checked={notificationPrefs.streakReminders}
                  onCheckedChange={(checked) => updateNotificationPrefs({ streakReminders: checked })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reminder-time">Reminder Time</Label>
                <input
                  id="reminder-time"
                  type="time"
                  value={notificationPrefs.reminderTime}
                  onChange={(e) => updateNotificationPrefs({ reminderTime: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </>
          )}

          {isSupported && permission === 'granted' && notificationPrefs.pushNotifications && (
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
