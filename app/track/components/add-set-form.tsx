"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus } from "lucide-react"
import { formatTime } from "../utils"
import { getWeightUnitAbbr, weightToLbs, formatWeight } from "@/lib/weight-utils"
import { useUserPreferences } from "@/hooks/use-user-preferences"

interface LastSetData {
  reps?: number
  weight?: number
  isBodyweight?: boolean
}

interface AddSetFormProps {
  exerciseId: string
  setNumber: number
  targetType?: "reps" | "time"
  currentExerciseTimer?: number
  lastSetData?: LastSetData
  onAddSet: (exerciseId: string, reps: number, weight?: number) => void
}

export function AddSetForm({ 
  exerciseId, 
  setNumber, 
  targetType = "reps", 
  currentExerciseTimer = 0, 
  lastSetData,
  onAddSet
}: AddSetFormProps) {
  const [reps, setReps] = useState("")
  const [weight, setWeight] = useState("")
  const [isBodyweight, setIsBodyweight] = useState(false)
  const { units } = useUserPreferences()
  const weightInLbs = useRef<number | null>(null) // Store weight in lbs for conversion

  // Pre-fill form with last set data
  useEffect(() => {
    if (lastSetData && targetType === "reps") {
      if (lastSetData.reps) setReps(lastSetData.reps.toString())
      if (lastSetData.weight) {
        weightInLbs.current = lastSetData.weight
        setWeight(formatWeight(lastSetData.weight, units, false))
      }
      if (lastSetData.isBodyweight) setIsBodyweight(lastSetData.isBodyweight)
    }
  }, [lastSetData, targetType, units])

  // Handle unit conversion when units change
  useEffect(() => {
    if (weight && !isBodyweight && weightInLbs.current !== null) {
      const currentWeight = parseFloat(weight)
      if (!isNaN(currentWeight)) {
        const convertedWeight = formatWeight(weightInLbs.current, units, false)
        setWeight(convertedWeight)
      }
    }
  }, [units, isBodyweight, weight])

  const handleWeightChange = (value: string) => {
    setWeight(value)
    if (value && !isBodyweight) {
      const numericValue = parseFloat(value)
      if (!isNaN(numericValue)) {
        // Store the weight in lbs for consistency
        weightInLbs.current = weightToLbs(numericValue, units)
      }
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (targetType === "time") {
      // For timed exercises, use the current exercise timer value
      onAddSet(exerciseId, currentExerciseTimer)
    } else {
      if (reps && (isBodyweight || weight)) {
        // Use the stored lbs value or convert current input
        const weightValue = isBodyweight ? undefined : weightInLbs.current || weightToLbs(Number.parseFloat(weight), units)
        
        onAddSet(
          exerciseId,
          Number.parseInt(reps),
          weightValue
        )
        // Don't clear the form so values persist for next set
      }
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="p-4 rounded-lg border-2 border-dashed border-muted-foreground/25">
        <div className="flex items-center gap-3 mb-3">
          <Badge variant="outline">Set {setNumber}</Badge>
          <span className="text-sm text-muted-foreground">
            {targetType === "time" ? "Log your time" : "Log your performance"}
          </span>
        </div>

        {targetType === "time" ? (
          <div className="mb-3">
            <Label htmlFor="current-time" className="text-xs">
              Current Time
            </Label>
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border-2 border-blue-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{formatTime(currentExerciseTimer)}</div>
                <div className="text-xs text-muted-foreground">Click &quot;Add Set&quot; to record this time</div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <Label htmlFor="reps" className="text-xs">
                  Reps
                </Label>
                <Input
                  id="reps"
                  type="number"
                  placeholder="12"
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                  className="h-8"
                />
              </div>
              <div>
                <Label htmlFor="weight" className="text-xs">
                  Weight ({getWeightUnitAbbr(units)})
                </Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.5"
                  placeholder={units === 'imperial' ? "25" : "11"}
                  value={weight}
                  onChange={(e) => handleWeightChange(e.target.value)}
                  disabled={isBodyweight}
                  className="h-8"
                />
              </div>
            </div>

            <div className="mb-3 flex items-center gap-2">
              <input
                id="bodyweight"
                type="checkbox"
                className="h-4 w-4"
                checked={isBodyweight}
                onChange={(e) => setIsBodyweight(e.target.checked)}
              />
              <Label htmlFor="bodyweight" className="text-xs">Bodyweight</Label>
            </div>

            {lastSetData && setNumber > 1 && (
              <div className="mb-3 p-2 rounded-md bg-muted/50 text-xs text-muted-foreground">
                <span className="font-medium">Previous set:</span> {lastSetData.reps} reps 
                {lastSetData.isBodyweight ? " (bodyweight)" : ` @ ${formatWeight(lastSetData.weight || 0, units)}`}
              </div>
            )}
          </>
        )}

        <Button type="submit" size="sm" className="w-full">
          <Plus className="w-3 h-3 mr-1" />
          Add Set
        </Button>
      </form>
    </div>
  )
}
