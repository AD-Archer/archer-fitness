"use client"

import { useState, useEffect, useMemo } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { User, Dumbbell, Bell, Shield, Loader2 } from "lucide-react"
import { UserProfile, WorkoutPrefs, AppPrefs } from "./types"
import { convertHeightToCm } from "./utils"
import { ProfileTab } from "./profile-tab"
import { WorkoutTab } from "./workout-tab"
import { AppTab } from "./app-tab"
import { PrivacyTab } from "./privacy-tab"
import { logger } from "@/lib/logger"

export function SettingsForm() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Tab state management with URL sync
  const [activeTab, setActiveTab] = useState("profile")

  // Sync tab with URL on mount
  useEffect(() => {
    const tabFromUrl = searchParams.get("tab")
    if (tabFromUrl && ["profile", "workout", "notifications", "privacy"].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl)
    }
  }, [searchParams])

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    const newSearchParams = new URLSearchParams(searchParams.toString())
    newSearchParams.set("tab", value)
    router.replace(`/settings?${newSearchParams.toString()}`, { scroll: false })
  }

  const defaultWorkoutPrefs = useMemo(() => ({
    defaultDuration: "45",
    difficultyLevel: "intermediate",
    preferredTime: "morning",
    availableEquipment: ["dumbbells", "barbell", "bodyweight"],
    restDayReminders: true,
  }), [])
  
  const defaultAppPrefs = useMemo(() => ({
    theme: "system",
    units: "imperial",
    notifications: true,
    weeklyReports: true,
    dataSharing: false,
    timezone: (() => {
      try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
      } catch {
        return "UTC"
      }
    })(),
    timeFormat: "24h" as "12h" | "24h",
    adminNotifications: {
      enabled: true,
      methods: ['smtp'] as ('smtp')[],
      errorAlerts: true,
      startupAlerts: true
    },
    notificationPrefs: {
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
  }), [])

  const [profile, setProfile] = useState<UserProfile>({
    name: "",
    email: "",
    birthdate: "",
    weight: "",
    heightFeet: "",
    heightInches: "",
    heightCm: "",
    gender: "male",
    fitnessGoals: "maintenance",
    activityLevel: "moderate",
  })

  const [workoutPrefs, setWorkoutPrefs] = useState<WorkoutPrefs>({
    defaultDuration: "45",
    difficultyLevel: "intermediate",
    preferredTime: "morning",
    availableEquipment: ["dumbbells", "barbell", "bodyweight"],
    restDayReminders: true,
  })

  const [appPrefs, setAppPrefs] = useState<AppPrefs>({
    theme: "system",
    units: "imperial",
    notifications: true,
    weeklyReports: true,
    dataSharing: false,
    timezone: "UTC",
    timeFormat: "24h",
    adminNotifications: {
      enabled: true,
      methods: ['smtp'],
      errorAlerts: true,
      startupAlerts: true
    },
    notificationPrefs: {
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
  })

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/auth/signin")
      return
    }
  }, [session, status, router])

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      if (!session?.user?.id) return

      setIsLoading(true)
      try {
        // Load profile
        const [profileRes, prefsRes] = await Promise.all([
          fetch("/api/user/profile"),
          fetch("/api/user/preferences"),
        ])

        if (profileRes.ok) {
          const userData = await profileRes.json()
          if (userData.user) {
            // Convert height from cm to feet and inches, and also store cm
            const heightCm = userData.user.height || 0
            const totalInches = heightCm / 2.54
            const heightFeet = Math.floor(totalInches / 12)
            const heightInches = Math.round(totalInches % 12)

            setProfile({
              name: userData.user.name || "",
              email: userData.user.email || "",
              birthdate: userData.user.birthdate ? new Date(userData.user.birthdate).toISOString().split('T')[0] : "",
              weight: userData.user.weight?.toString() || "",
              heightFeet: heightFeet.toString(),
              heightInches: heightInches.toString(),
              heightCm: heightCm.toString(),
              gender: userData.user.gender || "male",
              fitnessGoals: userData.user.fitnessGoals || "maintenance",
              activityLevel: userData.user.activityLevel || "moderate",
            })
          }
        }

        // Load preferences
        if (prefsRes.ok) {
          const data = await prefsRes.json()
          if (data?.preferences) {
            setWorkoutPrefs({ ...defaultWorkoutPrefs, ...data.preferences.workoutPrefs })
            setAppPrefs({
              ...defaultAppPrefs,
              ...data.preferences.appPrefs,
              timeFormat: data.preferences.appPrefs?.timeFormat === "12h" ? "12h" : "24h",
              adminNotifications: {
                ...defaultAppPrefs.adminNotifications,
                ...data.preferences.appPrefs?.adminNotifications
              },
              notificationPrefs: {
                ...defaultAppPrefs.notificationPrefs,
                ...data.preferences.appPrefs?.notificationPrefs
              }
            })
          } else {
            // Use defaults if no preferences exist
            setWorkoutPrefs(defaultWorkoutPrefs)
            setAppPrefs(defaultAppPrefs)
          }
        } else {
          // Use defaults if API fails
          setWorkoutPrefs(defaultWorkoutPrefs)
          setAppPrefs(defaultAppPrefs)
        }
      } catch (error) {
        logger.error("Failed to load user data:", error)
        toast.error("Failed to load user data")
      } finally {
        setIsLoading(false)
      }
    }

        loadUserData()
  }, [session, defaultWorkoutPrefs, defaultAppPrefs])

  // Convert height when units change
  useEffect(() => {
    if (appPrefs.units === "imperial" && profile.heightCm && (!profile.heightFeet || !profile.heightInches)) {
      // Convert cm to feet and inches
      const heightCm = parseFloat(profile.heightCm)
      if (heightCm > 0) {
        const totalInches = heightCm / 2.54
        const feet = Math.floor(totalInches / 12)
        const inches = Math.round(totalInches % 12)
        setProfile(prev => ({
          ...prev,
          heightFeet: feet.toString(),
          heightInches: inches.toString(),
        }))
      }
    } else if (appPrefs.units === "metric" && (profile.heightFeet || profile.heightInches) && !profile.heightCm) {
      // Convert feet and inches to cm
      const feet = parseFloat(profile.heightFeet) || 0
      const inches = parseFloat(profile.heightInches) || 0
      if (feet > 0 || inches > 0) {
        const totalInches = (feet * 12) + inches
        const cm = Math.round(totalInches * 2.54)
        setProfile(prev => ({
          ...prev,
          heightCm: cm.toString(),
        }))
      }
    }
   
  }, [appPrefs.units, profile.heightCm, profile.heightFeet, profile.heightInches])

  const handleResetToDefaults = () => {
    setProfile({
      name: "",
      email: "",
      birthdate: "",
      weight: "",
      heightFeet: "",
      heightInches: "",
      heightCm: "",
      gender: "male",
      fitnessGoals: "maintenance",
      activityLevel: "moderate",
    })
    setWorkoutPrefs(defaultWorkoutPrefs)
    setAppPrefs(defaultAppPrefs)
  }

  const handleSaveChanges = async () => {
    setIsSaving(true)
    try {
      // Validate and prepare profile data
      const profileData = {
        name: profile.name || null,
        birthdate: profile.birthdate ? new Date(profile.birthdate).toISOString() : null,
        weight: profile.weight && !isNaN(parseFloat(profile.weight)) ? parseFloat(profile.weight) : null,
        height: (() => {
          if (appPrefs.units === "imperial") {
            const feet = profile.heightFeet && !isNaN(parseFloat(profile.heightFeet)) ? parseFloat(profile.heightFeet) : null
            const inches = profile.heightInches && !isNaN(parseFloat(profile.heightInches)) ? parseFloat(profile.heightInches) : null
            return (feet && inches) ? convertHeightToCm(feet, inches) : null
          } else {
            return profile.heightCm && !isNaN(parseFloat(profile.heightCm)) ? parseFloat(profile.heightCm) : null
          }
        })(),
        gender: profile.gender || null,
        fitnessGoals: profile.fitnessGoals || null,
        activityLevel: profile.activityLevel || null,
      }

      logger.info("Sending profile data:", profileData)

      const profileRes = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      })

      if (!profileRes.ok) {
        const errorData = await profileRes.json().catch(() => ({ error: "Unknown error" }))
        logger.error("Profile save failed:", errorData)
        throw new Error(`Failed to save profile: ${errorData.error || 'Unknown error'}`)
      }

      // Save preferences, but don't block profile save success
      const prefsRes = await fetch("/api/user/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workoutPrefs, appPrefs }),
      })

      if (!prefsRes.ok) {
        const err = await prefsRes.json().catch(() => ({}))
        toast.warning(
          err?.error || "Preferences not saved. Please try again after configuring the database."
        )
      } else {
        toast.success("Settings saved successfully!")
      }
    } catch (error) {
      logger.error("Failed to save settings:", error)
      toast.error("Failed to save settings")
    } finally {
      setIsSaving(false)
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        {/* Mobile Dropdown */}
        <div className="block md:hidden">
          <Select value={activeTab} onValueChange={handleTabChange}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="profile">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Profile
                </div>
              </SelectItem>
              <SelectItem value="workout">
                <div className="flex items-center gap-2">
                  <Dumbbell className="h-4 w-4" />
                  Workout
                </div>
              </SelectItem>
              <SelectItem value="notifications">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  App
                </div>
              </SelectItem>
              <SelectItem value="privacy">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Privacy
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Desktop Tabs */}
        <TabsList className="hidden md:grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden lg:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="workout" className="flex items-center gap-2">
            <Dumbbell className="h-4 w-4" />
            <span className="hidden lg:inline">Workout</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden lg:inline">App</span>
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden lg:inline">Privacy</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <ProfileTab profile={profile} setProfile={setProfile} units={appPrefs.units} />
        </TabsContent>

        <TabsContent value="workout" className="flex items-center gap-2">
          <WorkoutTab workoutPrefs={workoutPrefs} setWorkoutPrefs={setWorkoutPrefs} />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <AppTab appPrefs={appPrefs} setAppPrefs={setAppPrefs} />
        </TabsContent>

        <TabsContent value="privacy" className="space-y-4">
          <PrivacyTab appPrefs={appPrefs} setAppPrefs={setAppPrefs} />
        </TabsContent>
      </Tabs>

      <div className="flex flex-col sm:flex-row gap-4 pt-6">
        <Button className="flex-1 sm:flex-none" onClick={handleSaveChanges} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
        <Button variant="outline" className="flex-1 sm:flex-none bg-transparent" onClick={handleResetToDefaults}>
          Reset to Defaults
        </Button>
      </div>
    </div>
  )
}
