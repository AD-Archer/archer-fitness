"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { User, Dumbbell, Apple, Bell, Shield, Loader2 } from "lucide-react"
import { UserProfile, WorkoutPrefs, NutritionPrefs, AppPrefs } from "./types"
import { calculateGoalCalories, calculateMacros, calculateWaterTarget, convertHeightToCm } from "./utils"
import { ProfileTab } from "./profile-tab"
import { WorkoutTab } from "./workout-tab"
import { NutritionTab } from "./nutrition-tab"
import { AppTab } from "./app-tab"
import { PrivacyTab } from "./privacy-tab"

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
    if (tabFromUrl && ["profile", "workout", "nutrition", "notifications", "privacy"].includes(tabFromUrl)) {
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

  const defaultWorkoutPrefs = {
    defaultDuration: "45",
    difficultyLevel: "intermediate",
    preferredTime: "morning",
    availableEquipment: ["dumbbells", "barbell", "bodyweight"],
    restDayReminders: true,
  }
  const defaultNutritionPrefs = {
    dailyCalories: "2200",
    proteinTarget: "150",
    carbTarget: "250",
    fatTarget: "80",
    dietaryRestrictions: [],
    trackWater: true,
    waterTarget: "2500",
    useSmartCalculations: true,
  }
  const defaultAppPrefs = {
    theme: "system",
    units: "imperial",
    notifications: true,
    weeklyReports: true,
    dataSharing: false,
    notificationPrefs: {
      workoutReminders: true,
      weightReminders: true,
      nutritionReminders: true,
      streakReminders: true,
      reminderTime: "09:00"
    }
  }

  const [profile, setProfile] = useState<UserProfile>({
    name: "",
    email: "",
    age: "",
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

  const [nutritionPrefs, setNutritionPrefs] = useState<NutritionPrefs>({
    dailyCalories: "2200",
    proteinTarget: "150",
    carbTarget: "250",
    fatTarget: "80",
    dietaryRestrictions: [],
    trackWater: true,
    waterTarget: "2500",
    useSmartCalculations: true,
  })

  const [appPrefs, setAppPrefs] = useState<AppPrefs>({
    theme: "system",
    units: "imperial",
    notifications: true,
    weeklyReports: true,
    dataSharing: false,
    notificationPrefs: {
      workoutReminders: true,
      weightReminders: true,
      nutritionReminders: true,
      streakReminders: true,
      reminderTime: "09:00"
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
              age: userData.user.age?.toString() || "",
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
            setNutritionPrefs({ ...defaultNutritionPrefs, ...data.preferences.nutritionPrefs })
            setAppPrefs({ ...defaultAppPrefs, ...data.preferences.appPrefs })
          } else {
            // Use defaults if no preferences exist
            setWorkoutPrefs(defaultWorkoutPrefs)
            setNutritionPrefs(defaultNutritionPrefs)
            setAppPrefs(defaultAppPrefs)
          }
        } else {
          // Use defaults if API fails
          setWorkoutPrefs(defaultWorkoutPrefs)
          setNutritionPrefs(defaultNutritionPrefs)
          setAppPrefs(defaultAppPrefs)
        }
      } catch (error) {
        console.error("Failed to load user data:", error)
        toast.error("Failed to load user data")
      } finally {
        setIsLoading(false)
      }
    }

    loadUserData()
  }, [session])

  // Auto-calculate nutrition values when smart calculations are enabled
  useEffect(() => {
    if (nutritionPrefs.useSmartCalculations) {
      const goalCalories = calculateGoalCalories(profile, appPrefs.units)
      const macros = calculateMacros(profile, appPrefs.units)
      const waterTarget = calculateWaterTarget(profile, appPrefs.units)

      setNutritionPrefs((prev) => ({
        ...prev,
        dailyCalories: goalCalories.toString(),
        proteinTarget: macros.protein.toString(),
        carbTarget: macros.carbs.toString(),
        fatTarget: macros.fat.toString(),
        waterTarget: waterTarget.toString(),
      }))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    profile.age,
    profile.weight,
    profile.heightFeet,
    profile.heightInches,
    profile.heightCm,
    profile.gender,
    profile.fitnessGoals,
    profile.activityLevel,
    nutritionPrefs.useSmartCalculations,
    appPrefs.units,
  ])

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appPrefs.units, profile.heightCm, profile.heightFeet, profile.heightInches])

  const handleResetToDefaults = () => {
    setProfile({
      name: "",
      email: "",
      age: "",
      weight: "",
      heightFeet: "",
      heightInches: "",
      heightCm: "",
      gender: "male",
      fitnessGoals: "maintenance",
      activityLevel: "moderate",
    })
    setWorkoutPrefs(defaultWorkoutPrefs)
    setNutritionPrefs(defaultNutritionPrefs)
    setAppPrefs(defaultAppPrefs)
  }

  const handleSaveChanges = async () => {
    setIsSaving(true)
    try {
      // Validate and prepare profile data
      const profileData = {
        name: profile.name || null,
        age: profile.age && !isNaN(parseInt(profile.age)) ? parseInt(profile.age) : null,
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

      console.log("Sending profile data:", profileData)

      const profileRes = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      })

      if (!profileRes.ok) {
        const errorData = await profileRes.json().catch(() => ({ error: "Unknown error" }))
        console.error("Profile save failed:", errorData)
        throw new Error(`Failed to save profile: ${errorData.error || 'Unknown error'}`)
      }

      // Save preferences, but don't block profile save success
      const prefsRes = await fetch("/api/user/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workoutPrefs, nutritionPrefs, appPrefs }),
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
      console.error("Failed to save settings:", error)
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
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="workout" className="flex items-center gap-2">
            <Dumbbell className="h-4 w-4" />
            <span className="hidden sm:inline">Workout</span>
          </TabsTrigger>
          <TabsTrigger value="nutrition" className="flex items-center gap-2">
            <Apple className="h-4 w-4" />
            <span className="hidden sm:inline">Nutrition</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">App</span>
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Privacy</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <ProfileTab profile={profile} setProfile={setProfile} units={appPrefs.units} />
        </TabsContent>

        <TabsContent value="workout" className="space-y-4">
          <WorkoutTab workoutPrefs={workoutPrefs} setWorkoutPrefs={setWorkoutPrefs} />
        </TabsContent>

        <TabsContent value="nutrition" className="space-y-4">
          <NutritionTab 
            profile={profile}
            nutritionPrefs={nutritionPrefs} 
            setNutritionPrefs={setNutritionPrefs} 
            units={appPrefs.units}
          />
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
