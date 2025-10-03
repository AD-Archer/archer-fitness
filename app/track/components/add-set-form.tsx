"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Check, Plus, RotateCcw } from "lucide-react"
import { formatTime } from "../utils"
import { getWeightUnitAbbr, weightToLbs, formatWeight } from "@/lib/weight-utils"
import { useUserPreferences } from "@/hooks/use-user-preferences"

interface LastSetData {
  reps?: number
  weight?: number
  isBodyweight?: boolean
}

interface EditingSetData {
  id: string
  setNumber: number
  reps?: number
  duration?: number
  weight?: number
  isBodyweight?: boolean
}

interface AddSetFormProps {
  exerciseId: string
  setNumber: number
  targetType?: "reps" | "time"
  currentExerciseTimer?: number
  lastSetData?: LastSetData
  editingSet?: EditingSetData | null
  isResting?: boolean
  onAddSet: (exerciseId: string, reps: number, weight?: number) => void
  onUpdateSet?: (
    exerciseId: string,
    setId: string,
    payload: { reps?: number; weight?: number; duration?: number }
  ) => void
  onCancelEdit?: () => void
}

export function AddSetForm({ 
  exerciseId, 
  setNumber, 
  targetType = "reps", 
  currentExerciseTimer = 0, 
  lastSetData,
  editingSet = null,
  isResting = false,
  onAddSet,
  onUpdateSet,
  onCancelEdit
}: AddSetFormProps) {
  const [reps, setReps] = useState("")
  const [weight, setWeight] = useState("")
  const [isBodyweight, setIsBodyweight] = useState(false)
  const [timeSeconds, setTimeSeconds] = useState("")
  const { units } = useUserPreferences()
  const weightInLbs = useRef<number | null>(null) // Store weight in lbs for conversion
  const prevSetNumberRef = useRef<number>(setNumber - 1)
  const prevEditingIdRef = useRef<string | null>(null)

  const isEditing = Boolean(editingSet)

  // Pre-fill form when editing an existing set
  useEffect(() => {
    if (!editingSet || prevEditingIdRef.current === editingSet.id) return

    if (targetType === "time") {
      const durationValue = editingSet.duration ?? editingSet.reps ?? 0
      setTimeSeconds(durationValue ? durationValue.toString() : "")
    } else {
      setReps(
        editingSet.reps !== undefined && editingSet.reps !== null
          ? editingSet.reps.toString()
          : ""
      )
      if (editingSet.weight !== undefined) {
        weightInLbs.current = editingSet.weight
        setWeight(formatWeight(editingSet.weight, units, false))
        setIsBodyweight(false)
      } else {
        weightInLbs.current = null
        setWeight("")
        setIsBodyweight(editingSet.isBodyweight ?? true)
      }
    }

    prevEditingIdRef.current = editingSet.id
  }, [editingSet, targetType, units])

  // Pre-fill form with last set data for new set entries
  useEffect(() => {
    if (isEditing) return

    if (setNumber !== prevSetNumberRef.current) {
      if (targetType === "time") {
        setTimeSeconds("")
      } else if (lastSetData) {
        setReps(lastSetData.reps !== undefined ? lastSetData.reps.toString() : "")
        if (lastSetData.weight !== undefined) {
          weightInLbs.current = lastSetData.weight
          setWeight(formatWeight(lastSetData.weight, units, false))
          setIsBodyweight(false)
        } else {
          weightInLbs.current = null
          setWeight("")
          setIsBodyweight(lastSetData.isBodyweight ?? false)
        }
      } else {
        setReps("")
        setWeight("")
        setIsBodyweight(false)
        weightInLbs.current = null
      }
      prevSetNumberRef.current = setNumber
    }
  }, [isEditing, lastSetData, setNumber, targetType, units])

  // Handle unit conversion when units change
  useEffect(() => {
    if (isBodyweight || weightInLbs.current === null) return
    const convertedWeight = formatWeight(weightInLbs.current, units, false)
    setWeight(convertedWeight)
  }, [units, isBodyweight])

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

  const handleBodyweightToggle = (checked: boolean) => {
    setIsBodyweight(checked)
    if (checked) {
      setWeight("")
      weightInLbs.current = null
    }
  }

  const resetForm = () => {
    setReps("")
    setWeight("")
    setIsBodyweight(false)
    setTimeSeconds("")
    weightInLbs.current = null
    prevEditingIdRef.current = null
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (targetType === "time") {
      if (isEditing && editingSet && onUpdateSet) {
        const durationValue = timeSeconds ? Number.parseInt(timeSeconds, 10) : 0
        if (!Number.isNaN(durationValue) && durationValue > 0) {
          onUpdateSet(exerciseId, editingSet.id, { duration: durationValue })
          onCancelEdit?.()
          resetForm()
        }
      } else {
        onAddSet(exerciseId, currentExerciseTimer)
        resetForm()
      }
    } else {
      if (reps && (isBodyweight || weight)) {
        const parsedReps = Number.parseInt(reps, 10)
        if (Number.isNaN(parsedReps)) return

        const weightValue = isBodyweight
          ? undefined
          : weightInLbs.current ?? weightToLbs(Number.parseFloat(weight), units)

        if (isEditing && editingSet && onUpdateSet) {
          onUpdateSet(exerciseId, editingSet.id, {
            reps: parsedReps,
            weight: weightValue,
          })
          onCancelEdit?.()
        } else {
          onAddSet(exerciseId, parsedReps, weightValue)
        }
        resetForm()
      }
    }
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-muted-foreground/15 bg-card/60 backdrop-blur p-3 sm:p-4 shadow-sm"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
          <div className="flex items-center gap-3">
            <Badge variant={isEditing ? "default" : "outline"}>
              {isEditing ? `Editing Set ${editingSet?.setNumber ?? ""}` : `Set ${setNumber}`}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {targetType === "time" ? "Capture your time" : "Log your performance"}
            </span>
          </div>
          {isEditing && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={() => {
                onCancelEdit?.()
                resetForm()
              }}
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Cancel edit
            </Button>
          )}
        </div>

        {targetType === "time" ? (
          <div className="space-y-3">
            {!isEditing && (
              <div>
                <Label htmlFor="current-time" className="text-xs font-medium">
                  Current Time
                </Label>
                <div className="mt-1 rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/60 p-4 text-center">
                  <div className="text-3xl font-semibold text-blue-600 dark:text-blue-300">
                    {formatTime(currentExerciseTimer)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Tap &quot;Add Set" to record this interval
                  </div>
                </div>
              </div>
            )}

            {isEditing && (
              <div>
                <Label htmlFor="edited-duration" className="text-xs font-medium">
                  Duration (seconds)
                </Label>
                <Input
                  id="edited-duration"
                  type="number"
                  min="1"
                  value={timeSeconds}
                  onChange={(e) => setTimeSeconds(e.target.value)}
                  className="mt-1 h-9"
                  placeholder="Enter seconds"
                />
              </div>
            )}

            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/60 p-3 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5" />
              <span>
                For time-based exercises, skip the rest period when you&apos;re ready to start the next interval.
              </span>
            </div>

            {isResting && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/60 p-3 text-xs text-blue-700 dark:text-blue-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5" />
                <span>Currently resting — tap &quot;Skip Rest&quot; above to restart the exercise timer.</span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="reps" className="text-xs font-medium">
                  Reps
                </Label>
                <Input
                  id="reps"
                  type="number"
                  min="0"
                  inputMode="numeric"
                  placeholder="Enter reps"
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                  className="mt-1 h-9"
                />
              </div>
              <div>
                <Label htmlFor="weight" className="text-xs font-medium">
                  Weight ({getWeightUnitAbbr(units)})
                </Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.5"
                  min="0"
                  inputMode="decimal"
                  placeholder={units === "imperial" ? "E.g. 25" : "E.g. 11"}
                  value={isBodyweight ? "" : weight}
                  onChange={(e) => handleWeightChange(e.target.value)}
                  disabled={isBodyweight}
                  className="mt-1 h-9 disabled:bg-muted/60"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="bodyweight"
                type="checkbox"
                className="h-4 w-4"
                checked={isBodyweight}
                onChange={(e) => handleBodyweightToggle(e.target.checked)}
              />
              <Label htmlFor="bodyweight" className="text-xs">Bodyweight</Label>
            </div>

            {lastSetData && setNumber > 1 && !isEditing && (
              <div className="rounded-md border border-muted-foreground/10 bg-muted/40 p-2 text-xs text-muted-foreground">
                <span className="font-medium">Previous set:</span> {lastSetData.reps ?? 0} reps
                {lastSetData.isBodyweight ? " (bodyweight)" : lastSetData.weight !== undefined ? ` @ ${formatWeight(lastSetData.weight, units)}` : ""}
              </div>
            )}
          </div>
        )}

        <Button type="submit" size="sm" className="mt-4 w-full">
          {isEditing ? (
            <>
              <Check className="w-3 h-3 mr-1" />
              Update Set
            </>
          ) : (
            <>
              <Plus className="w-3 h-3 mr-1" />
              Add Set
            </>
          )}
        </Button>
      </form>
    </div>
  )
}
