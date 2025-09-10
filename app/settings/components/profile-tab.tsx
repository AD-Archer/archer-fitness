"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calculator } from "lucide-react"
import { UserProfile } from "./types"
import { calculateBMR, calculateTDEE, calculateGoalCalories, calculateMacros, calculateWaterTarget } from "./utils"

interface ProfileTabProps {
  profile: UserProfile
  setProfile: (profile: UserProfile) => void
  units: string
}

export function ProfileTab({ profile, setProfile, units }: ProfileTabProps) {
  return (
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
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
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
            <Label htmlFor="weight">Weight ({units === "imperial" ? "lbs" : "kg"})</Label>
            <Input
              id="weight"
              type="number"
              value={profile.weight}
              onChange={(e) => setProfile({ ...profile, weight: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="height">
              Height {units === "imperial" ? "(feet and inches)" : "(cm)"}
            </Label>
            {units === "imperial" ? (
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    id="heightFeet"
                    type="number"
                    placeholder="Feet"
                    value={profile.heightFeet}
                    onChange={(e) => setProfile({ ...profile, heightFeet: e.target.value })}
                  />
                </div>
                <div className="flex-1">
                  <Input
                    id="heightInches"
                    type="number"
                    placeholder="Inches"
                    value={profile.heightInches}
                    onChange={(e) => setProfile({ ...profile, heightInches: e.target.value })}
                  />
                </div>
              </div>
            ) : (
              <Input
                id="heightCm"
                type="number"
                placeholder="Height in cm"
                value={profile.heightCm}
                onChange={(e) => setProfile({ ...profile, heightCm: e.target.value })}
              />
            )}
            <p className="text-xs text-muted-foreground">
              {units === "imperial" ? "Enter height in feet and inches" : "Enter height in centimeters"}
            </p>
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
            value={profile.fitnessGoals}
            onValueChange={(value) => setProfile({ ...profile, fitnessGoals: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weight_loss_0_5">Weight Loss (0.5 lbs/week)</SelectItem>
              <SelectItem value="weight_loss_1">Weight Loss (1 lb/week)</SelectItem>
              <SelectItem value="muscle_gain_0_5">Muscle Gain (0.5 lbs/week)</SelectItem>
              <SelectItem value="muscle_gain_1">Muscle Gain (1 lb/week)</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="endurance">Endurance</SelectItem>
              <SelectItem value="strength">Strength</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {profile.weight && profile.age && (
          (units === "imperial" && profile.heightFeet && profile.heightInches) ||
          (units === "metric" && profile.heightCm)
        ) && (
          <Card className="bg-muted/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Your Metabolic Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">BMR (Base Metabolic Rate)</p>
                  <p className="font-semibold">{Math.round(calculateBMR(profile, units))} calories/day</p>
                </div>
                <div>
                  <p className="text-muted-foreground">TDEE (Total Daily Energy)</p>
                  <p className="font-semibold">{calculateTDEE(profile, units)} calories/day</p>
                </div>
              </div>

              <div className="border-t pt-3">
                <p className="text-sm font-medium mb-2">Goal-Based Targets</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Daily Calories</p>
                    <p className="font-semibold">{calculateGoalCalories(profile, units)} cal</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Water Target</p>
                    <p className="font-semibold">{calculateWaterTarget(profile, units)} {units === "imperial" ? "oz" : "ml"}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-3">
                <p className="text-sm font-medium mb-2">Macronutrient Breakdown</p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center">
                    <p className="text-muted-foreground">Protein</p>
                    <p className="font-semibold">{calculateMacros(profile, units).protein}g</p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground">Carbs</p>
                    <p className="font-semibold">{calculateMacros(profile, units).carbs}g</p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground">Fat</p>
                    <p className="font-semibold">{calculateMacros(profile, units).fat}g</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  )
}
