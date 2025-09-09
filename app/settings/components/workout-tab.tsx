"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dumbbell, Flame, Target, Heart } from "lucide-react"
import { WorkoutPrefs } from "./types"

interface WorkoutTabProps {
  workoutPrefs: WorkoutPrefs
  setWorkoutPrefs: (prefs: WorkoutPrefs) => void
}

export function WorkoutTab({ workoutPrefs, setWorkoutPrefs }: WorkoutTabProps) {
  const equipmentOptions = [
    "bodyweight",
    "dumbbells",
    "barbell",
    "resistance_bands",
    "kettlebells",
    "pull_up_bar",
    "gym_access",
  ]

  const toggleEquipment = (equipment: string) => {
    setWorkoutPrefs({
      ...workoutPrefs,
      availableEquipment: workoutPrefs.availableEquipment.includes(equipment)
        ? workoutPrefs.availableEquipment.filter((e) => e !== equipment)
        : [...workoutPrefs.availableEquipment, equipment],
    })
  }

  return (
    <div className="space-y-6">
      <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
        <Target className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <strong>💪 Why Workouts Matter:</strong> Regular exercise builds muscle, boosts metabolism, and helps you achieve your fitness goals. 
          Muscle burns more calories at rest, making it easier to maintain your ideal weight and figure.
          {workoutPrefs.difficultyLevel === "beginner" && " Start with shorter sessions and gradually build up!"}
          {workoutPrefs.difficultyLevel === "advanced" && " Push your limits with challenging workouts!"}
        </AlertDescription>
      </Alert>

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

    <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-blue-200 dark:border-blue-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
          <Dumbbell className="h-5 w-5" />
          Workout Benefits & Tips
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-start gap-3">
            <Flame className="h-5 w-5 text-orange-500 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm">Burn More Calories</h4>
              <p className="text-xs text-muted-foreground">
                Muscle tissue burns 3x more calories than fat. Building muscle increases your resting metabolism.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Target className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm">Achieve Your Goals</h4>
              <p className="text-xs text-muted-foreground">
                Consistent workouts help you lose fat, gain muscle, or maintain your ideal figure and weight.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Heart className="h-5 w-5 text-red-500 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm">Health Benefits</h4>
              <p className="text-xs text-muted-foreground">
                Exercise improves heart health, boosts mood, strengthens bones, and enhances overall well-being.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Dumbbell className="h-5 w-5 text-purple-500 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm">Progressive Overload</h4>
              <p className="text-xs text-muted-foreground">
                Gradually increase intensity to build strength and avoid plateaus in your fitness journey.
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
          <p className="text-xs text-center text-muted-foreground">
            💡 <strong>Pro Tip:</strong> Your workout preferences above will help create personalized routines that match your goals and available equipment!
          </p>
        </div>
      </CardContent>
    </Card>
    </div>
  )
}
