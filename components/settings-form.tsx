"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { User, Dumbbell, Apple, Bell, Shield, Download, Calculator, Brain, Info } from "lucide-react"

export function SettingsForm() {
  const [profile, setProfile] = useState({
    name: "John Doe",
    email: "john@example.com",
    age: "28",
    weight: "75",
    height: "180",
    gender: "male", // Added gender for BMR calculation
    fitnessGoal: "muscle_gain",
    activityLevel: "moderate",
  })

  const [workoutPrefs, setWorkoutPrefs] = useState({
    defaultDuration: "45",
    difficultyLevel: "intermediate",
    preferredTime: "morning",
    availableEquipment: ["dumbbells", "barbell", "bodyweight"],
    restDayReminders: true,
  })

  const [nutritionPrefs, setNutritionPrefs] = useState({
    dailyCalories: "2200",
    proteinTarget: "150",
    carbTarget: "250",
    fatTarget: "80",
    dietaryRestrictions: [],
    trackWater: true,
    waterTarget: "2500", // Added water target in ml
    useSmartCalculations: true, // Toggle for AI calculations
  })

  const [appPrefs, setAppPrefs] = useState({
    theme: "system",
    units: "metric",
    notifications: true,
    weeklyReports: true,
    dataSharing: false,
  })

  const equipmentOptions = [
    "bodyweight",
    "dumbbells",
    "barbell",
    "resistance_bands",
    "kettlebells",
    "pull_up_bar",
    "gym_access",
  ]

  const dietaryOptions = ["vegetarian", "vegan", "gluten_free", "dairy_free", "keto", "paleo"]

  const toggleEquipment = (equipment: string) => {
    setWorkoutPrefs((prev) => ({
      ...prev,
      availableEquipment: prev.availableEquipment.includes(equipment)
        ? prev.availableEquipment.filter((e) => e !== equipment)
        : [...prev.availableEquipment, equipment],
    }))
  }

  const toggleDietaryRestriction = (restriction: string) => {
    setNutritionPrefs((prev) => ({
      ...prev,
      dietaryRestrictions: prev.dietaryRestrictions.includes(restriction)
        ? prev.dietaryRestrictions.filter((r) => r !== restriction)
        : [...prev.dietaryRestrictions, restriction],
    }))
  }

  const calculateBMR = () => {
    const weight = Number.parseFloat(profile.weight)
    const height = Number.parseFloat(profile.height)
    const age = Number.parseFloat(profile.age)

    if (!weight || !height || !age) return 0

    // Mifflin-St Jeor Equation
    if (profile.gender === "male") {
      return 10 * weight + 6.25 * height - 5 * age + 5
    } else {
      return 10 * weight + 6.25 * height - 5 * age - 161
    }
  }

  const calculateTDEE = () => {
    const bmr = calculateBMR()
    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      extreme: 1.9,
    }
    return Math.round(bmr * activityMultipliers[profile.activityLevel as keyof typeof activityMultipliers])
  }

  const calculateGoalCalories = () => {
    const tdee = calculateTDEE()
    const goalAdjustments = {
      weight_loss: -500, // 500 calorie deficit
      muscle_gain: +300, // 300 calorie surplus
      maintenance: 0,
      endurance: +200,
      strength: +250,
    }
    return Math.round(tdee + goalAdjustments[profile.fitnessGoal as keyof typeof goalAdjustments])
  }

  const calculateMacros = () => {
    const calories = calculateGoalCalories()
    const weight = Number.parseFloat(profile.weight)

    let proteinRatio = 0.25 // Default 25% protein
    let fatRatio = 0.25 // Default 25% fat
    let carbRatio = 0.5 // Default 50% carbs

    // Adjust based on goals
    if (profile.fitnessGoal === "muscle_gain") {
      proteinRatio = 0.3
      fatRatio = 0.25
      carbRatio = 0.45
    } else if (profile.fitnessGoal === "weight_loss") {
      proteinRatio = 0.35
      fatRatio = 0.3
      carbRatio = 0.35
    } else if (profile.fitnessGoal === "strength") {
      proteinRatio = 0.3
      fatRatio = 0.25
      carbRatio = 0.45
    }

    return {
      protein: Math.round((calories * proteinRatio) / 4), // 4 cal per gram
      carbs: Math.round((calories * carbRatio) / 4), // 4 cal per gram
      fat: Math.round((calories * fatRatio) / 9), // 9 cal per gram
    }
  }

  const calculateWaterTarget = () => {
    const weight = Number.parseFloat(profile.weight)
    const baseWater = weight * 35 // 35ml per kg base
    const activityBonus =
      profile.activityLevel === "extreme"
        ? 500
        : profile.activityLevel === "active"
          ? 300
          : profile.activityLevel === "moderate"
            ? 200
            : 100
    return Math.round(baseWater + activityBonus)
  }

  useEffect(() => {
    if (nutritionPrefs.useSmartCalculations) {
      const goalCalories = calculateGoalCalories()
      const macros = calculateMacros()
      const waterTarget = calculateWaterTarget()

      setNutritionPrefs((prev) => ({
        ...prev,
        dailyCalories: goalCalories.toString(),
        proteinTarget: macros.protein.toString(),
        carbTarget: macros.carbs.toString(),
        fatTarget: macros.fat.toString(),
        waterTarget: waterTarget.toString(),
      }))
    }
  }, [
    profile.weight,
    profile.height,
    profile.age,
    profile.gender,
    profile.fitnessGoal,
    profile.activityLevel,
    nutritionPrefs.useSmartCalculations,
  ])

  const getAIRecommendation = () => {
    const bmr = calculateBMR()
    const tdee = calculateTDEE()
    const goalCalories = calculateGoalCalories()

    let recommendation = ""
    if (profile.fitnessGoal === "weight_loss") {
      recommendation = `For healthy weight loss, aim for a 500-calorie deficit. Your TDEE is ${tdee} calories, so targeting ${goalCalories} calories will help you lose about 1 pound per week.`
    } else if (profile.fitnessGoal === "muscle_gain") {
      recommendation = `For muscle gain, you need a slight caloric surplus. Your TDEE is ${tdee} calories, so ${goalCalories} calories with adequate protein will support muscle growth.`
    } else {
      recommendation = `For maintenance, your TDEE of ${tdee} calories is your target. This will help you maintain your current weight while supporting your fitness goals.`
    }

    return recommendation
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="profile" className="space-y-4">
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
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details and fitness profile</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    value={profile.age}
                    onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={profile.gender} onValueChange={(value) => setProfile({ ...profile, gender: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    value={profile.weight}
                    onChange={(e) => setProfile({ ...profile, weight: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    value={profile.height}
                    onChange={(e) => setProfile({ ...profile, height: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="activity">Activity Level</Label>
                  <Select
                    value={profile.activityLevel}
                    onValueChange={(value) => setProfile({ ...profile, activityLevel: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sedentary">Sedentary (little/no exercise)</SelectItem>
                      <SelectItem value="light">Light Activity (1-3 days/week)</SelectItem>
                      <SelectItem value="moderate">Moderate Activity (3-5 days/week)</SelectItem>
                      <SelectItem value="active">Very Active (6-7 days/week)</SelectItem>
                      <SelectItem value="extreme">Extremely Active (2x/day, intense)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal">Fitness Goal</Label>
                <Select
                  value={profile.fitnessGoal}
                  onValueChange={(value) => setProfile({ ...profile, fitnessGoal: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weight_loss">Weight Loss</SelectItem>
                    <SelectItem value="muscle_gain">Muscle Gain</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="endurance">Endurance</SelectItem>
                    <SelectItem value="strength">Strength</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {profile.weight && profile.height && profile.age && (
                <Card className="bg-muted/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Calculator className="h-4 w-4" />
                      Your Metabolic Profile
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">BMR (Base Metabolic Rate)</p>
                        <p className="font-semibold">{Math.round(calculateBMR())} calories/day</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">TDEE (Total Daily Energy)</p>
                        <p className="font-semibold">{calculateTDEE()} calories/day</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workout" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Workout Preferences</CardTitle>
              <CardDescription>Customize your workout experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="duration">Default Duration (minutes)</Label>
                  <Select
                    value={workoutPrefs.defaultDuration}
                    onValueChange={(value) => setWorkoutPrefs({ ...workoutPrefs, defaultDuration: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">60 minutes</SelectItem>
                      <SelectItem value="90">90 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty Level</Label>
                  <Select
                    value={workoutPrefs.difficultyLevel}
                    onValueChange={(value) => setWorkoutPrefs({ ...workoutPrefs, difficultyLevel: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Preferred Workout Time</Label>
                  <Select
                    value={workoutPrefs.preferredTime}
                    onValueChange={(value) => setWorkoutPrefs({ ...workoutPrefs, preferredTime: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Morning</SelectItem>
                      <SelectItem value="afternoon">Afternoon</SelectItem>
                      <SelectItem value="evening">Evening</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Available Equipment</Label>
                <div className="flex flex-wrap gap-2">
                  {equipmentOptions.map((equipment) => (
                    <Badge
                      key={equipment}
                      variant={workoutPrefs.availableEquipment.includes(equipment) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleEquipment(equipment)}
                    >
                      {equipment.replace("_", " ")}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Rest Day Reminders</Label>
                  <p className="text-sm text-muted-foreground">Get notified when you need a rest day</p>
                </div>
                <Switch
                  checked={workoutPrefs.restDayReminders}
                  onCheckedChange={(checked) => setWorkoutPrefs({ ...workoutPrefs, restDayReminders: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nutrition" className="space-y-4">
          {nutritionPrefs.useSmartCalculations && profile.weight && profile.height && profile.age && (
            <Alert>
              <Brain className="h-4 w-4" />
              <AlertDescription>
                <strong>AI Recommendation:</strong> {getAIRecommendation()}
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Nutrition Goals
                {nutritionPrefs.useSmartCalculations && <Badge variant="secondary">AI Optimized</Badge>}
              </CardTitle>
              <CardDescription>Set your daily nutrition targets</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    Smart AI Calculations
                  </Label>
                  <p className="text-sm text-muted-foreground">Automatically calculate goals based on your profile</p>
                </div>
                <Switch
                  checked={nutritionPrefs.useSmartCalculations}
                  onCheckedChange={(checked) => setNutritionPrefs({ ...nutritionPrefs, useSmartCalculations: checked })}
                />
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="calories">Daily Calories</Label>
                  <Input
                    id="calories"
                    type="number"
                    value={nutritionPrefs.dailyCalories}
                    onChange={(e) => setNutritionPrefs({ ...nutritionPrefs, dailyCalories: e.target.value })}
                    disabled={nutritionPrefs.useSmartCalculations}
                  />
                  {nutritionPrefs.useSmartCalculations && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      Calculated based on your {profile.fitnessGoal.replace("_", " ")} goal
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="water">Water Target (ml)</Label>
                  <Input
                    id="water"
                    type="number"
                    value={nutritionPrefs.waterTarget}
                    onChange={(e) => setNutritionPrefs({ ...nutritionPrefs, waterTarget: e.target.value })}
                    disabled={nutritionPrefs.useSmartCalculations}
                  />
                  {nutritionPrefs.useSmartCalculations && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      Based on body weight and activity level
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="protein">Protein Target (g)</Label>
                  <Input
                    id="protein"
                    type="number"
                    value={nutritionPrefs.proteinTarget}
                    onChange={(e) => setNutritionPrefs({ ...nutritionPrefs, proteinTarget: e.target.value })}
                    disabled={nutritionPrefs.useSmartCalculations}
                  />
                  {nutritionPrefs.useSmartCalculations && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      Optimized for {profile.fitnessGoal.replace("_", " ")}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="carbs">Carbs Target (g)</Label>
                  <Input
                    id="carbs"
                    type="number"
                    value={nutritionPrefs.carbTarget}
                    onChange={(e) => setNutritionPrefs({ ...nutritionPrefs, carbTarget: e.target.value })}
                    disabled={nutritionPrefs.useSmartCalculations}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fat">Fat Target (g)</Label>
                  <Input
                    id="fat"
                    type="number"
                    value={nutritionPrefs.fatTarget}
                    onChange={(e) => setNutritionPrefs({ ...nutritionPrefs, fatTarget: e.target.value })}
                    disabled={nutritionPrefs.useSmartCalculations}
                  />
                </div>
              </div>

              {nutritionPrefs.useSmartCalculations && (
                <Card className="bg-muted/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Macro Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <p className="text-muted-foreground">Protein</p>
                        <p className="font-semibold">
                          {Math.round(
                            ((Number.parseFloat(nutritionPrefs.proteinTarget) * 4) /
                              Number.parseFloat(nutritionPrefs.dailyCalories)) *
                              100,
                          )}
                          %
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground">Carbs</p>
                        <p className="font-semibold">
                          {Math.round(
                            ((Number.parseFloat(nutritionPrefs.carbTarget) * 4) /
                              Number.parseFloat(nutritionPrefs.dailyCalories)) *
                              100,
                          )}
                          %
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground">Fat</p>
                        <p className="font-semibold">
                          {Math.round(
                            ((Number.parseFloat(nutritionPrefs.fatTarget) * 9) /
                              Number.parseFloat(nutritionPrefs.dailyCalories)) *
                              100,
                          )}
                          %
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-3">
                <Label>Dietary Restrictions</Label>
                <div className="flex flex-wrap gap-2">
                  {dietaryOptions.map((restriction) => (
                    <Badge
                      key={restriction}
                      variant={nutritionPrefs.dietaryRestrictions.includes(restriction) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleDietaryRestriction(restriction)}
                    >
                      {restriction.replace("_", " ")}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Water Tracking</Label>
                  <p className="text-sm text-muted-foreground">Track daily water intake</p>
                </div>
                <Switch
                  checked={nutritionPrefs.trackWater}
                  onCheckedChange={(checked) => setNutritionPrefs({ ...nutritionPrefs, trackWater: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
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
        </TabsContent>

        <TabsContent value="privacy" className="space-y-4">
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
                  <Button variant="outline" className="w-full sm:w-auto bg-transparent">
                    Update Password
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>Export Data</Label>
                  <p className="text-sm text-muted-foreground">Download all your workout and nutrition data</p>
                  <Button variant="outline" className="w-full sm:w-auto bg-transparent">
                    <Download className="h-4 w-4 mr-2" />
                    Export Data
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>Delete Account</Label>
                  <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
                  <Button variant="destructive" className="w-full sm:w-auto">
                    Delete Account
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex flex-col sm:flex-row gap-4 pt-6">
        <Button className="flex-1 sm:flex-none">Save Changes</Button>
        <Button variant="outline" className="flex-1 sm:flex-none bg-transparent">
          Reset to Defaults
        </Button>
      </div>
    </div>
  )
}
