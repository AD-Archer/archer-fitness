"use client"

import { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Dumbbell, Search, Target, Wand2 } from "lucide-react"

export interface ExerciseOption {
  id: string
  name: string
  targetMuscles: string[]
  equipment: string[]
  instructions: string
  source?: string
}

export interface CustomExerciseInput {
  name: string
  sets: number
  reps: string
  rest: string
  equipment: string[]
  targetMuscles: string[]
  instructions: string
  isTimeBased: boolean
}

interface ExerciseSelectorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  exercises: ExerciseOption[]
  selectedExerciseIds: Set<string>
  onSelectExercise: (exercise: ExerciseOption) => void
  onCreateCustomExercise: (exercise: CustomExerciseInput) => void
  defaultSets: number
  defaultReps: string
  defaultRest: string
  workoutType: string
  defaultTargetMuscles?: string[]
  defaultEquipment?: string[]
}

const truncate = (text: string, maxLength = 160) => {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength).trimEnd()}…`
}

const formatList = (items: string[], fallback: string) => {
  if (!items.length) return fallback
  return items
    .map(item => item)
    .slice(0, 4)
    .join(", ")
}

export function ExerciseSelectorDialog({
  open,
  onOpenChange,
  exercises,
  selectedExerciseIds,
  onSelectExercise,
  onCreateCustomExercise,
  defaultSets,
  defaultReps,
  defaultRest,
  workoutType,
  defaultTargetMuscles = [],
  defaultEquipment = [],
}: ExerciseSelectorDialogProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [customName, setCustomName] = useState("")
  const [customSets, setCustomSets] = useState(String(defaultSets))
  const [customReps, setCustomReps] = useState(defaultReps)
  const [customRest, setCustomRest] = useState(defaultRest)
  const [customTargetMuscles, setCustomTargetMuscles] = useState(defaultTargetMuscles.join(", "))
  const [customEquipment, setCustomEquipment] = useState(defaultEquipment.join(", "))
  const [customInstructions, setCustomInstructions] = useState("")
  const [customIsTimeBased, setCustomIsTimeBased] = useState(/sec|min|s/i.test(defaultReps) || ["cardio", "hiit"].includes(workoutType))

  useEffect(() => {
    if (!open) return
    setSearchTerm("")
    setShowCustomForm(false)
    setCustomName("")
    setCustomSets(String(defaultSets))
    setCustomReps(defaultReps)
    setCustomRest(defaultRest)
    setCustomTargetMuscles(defaultTargetMuscles.join(", "))
    setCustomEquipment(defaultEquipment.join(", "))
    setCustomInstructions("")
    setCustomIsTimeBased(/sec|min|s/i.test(defaultReps) || ["cardio", "hiit"].includes(workoutType))
  }, [open, defaultSets, defaultReps, defaultRest, defaultTargetMuscles, defaultEquipment, workoutType])

  const filteredExercises = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return exercises

    return exercises.filter(exercise => {
      const haystack = [
        exercise.name,
        exercise.instructions,
        ...exercise.targetMuscles,
        ...exercise.equipment,
        exercise.source ?? ""
      ]
        .join(" ")
        .toLowerCase()

      return haystack.includes(term)
    })
  }, [exercises, searchTerm])

  const handleSelectExercise = (exercise: ExerciseOption) => {
    onSelectExercise(exercise)
    onOpenChange(false)
  }

  const handleCreateCustomExercise = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const sanitizedName = customName.trim()
    if (!sanitizedName) return

    const parsedSets = Number.parseInt(customSets, 10)
    const sets = Number.isFinite(parsedSets) && parsedSets > 0 ? parsedSets : defaultSets

    const targetMuscles = customTargetMuscles
      .split(",")
      .map(muscle => muscle.trim())
      .filter(Boolean)

    const equipment = customEquipment
      .split(",")
      .map(item => item.trim())
      .filter(Boolean)

    onCreateCustomExercise({
      name: sanitizedName,
      sets,
      reps: customReps.trim() || defaultReps,
      rest: customRest.trim() || defaultRest,
      equipment,
      targetMuscles,
      instructions: customInstructions.trim(),
      isTimeBased: customIsTimeBased,
    })

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] mx-auto p-0 overflow-hidden rounded-lg h-[95vh] max-h-[95vh]">
        <div className="flex flex-col h-full min-h-[600px]">
          <DialogHeader className="px-4 py-3 md:px-6 md:py-4 border-b flex-shrink-0">
            <DialogTitle className="flex items-center gap-2 text-lg md:text-xl">
              <Wand2 className="h-5 w-5 text-blue-600" />
              Add another exercise
            </DialogTitle>
            <DialogDescription className="text-sm md:text-base">
              Search the exercise library filtered by your preferences or create a custom move tailored to this workout.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            <div className="px-4 py-3 md:px-6 md:py-4 border-b bg-muted/30 flex-shrink-0">
              <div className="space-y-2">
                <Label htmlFor="exercise-search" className="flex items-center gap-2 text-sm font-medium">
                  <Search className="h-4 w-4" />
                  Search exercises
                </Label>
                <Input
                  id="exercise-search"
                  placeholder="Search by name, muscle, or equipment"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="h-12 text-base"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="p-4 md:p-6 space-y-6">
              {filteredExercises.length === 0 ? (
                <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                  No exercises match your search. Try a different keyword or create a custom exercise below.
                </div>
              ) : (
                filteredExercises.map(option => {
                  const isAdded = selectedExerciseIds.has(option.id)
                  return (
                    <div
                      key={option.id}
                      className="flex items-start justify-between gap-4 rounded-lg border bg-card/60 p-4"
                    >
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-semibold leading-tight">{option.name}</h4>
                          {option.source && (
                            <Badge variant="outline" className="text-xs uppercase tracking-wide">
                              {option.source}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <div className="inline-flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            {formatList(option.targetMuscles, "Full body")}
                          </div>
                          <div className="inline-flex items-center gap-1">
                            <Dumbbell className="h-3 w-3" />
                            {formatList(option.equipment, "No equipment")}
                          </div>
                        </div>
                        {option.instructions && (
                          <p className="text-sm text-muted-foreground">
                            {truncate(option.instructions)}
                          </p>
                        )}
                      </div>
                      <Button
                        variant={isAdded ? "secondary" : "default"}
                        disabled={isAdded}
                        onClick={() => handleSelectExercise(option)}
                      >
                        {isAdded ? "Added" : "Add"}
                      </Button>
                    </div>
                  )
                })
              )}

              </div>
            </div>
          </div>

          <div className="border-t px-4 py-3 md:px-6 md:py-4 flex-shrink-0">
            <div className="space-y-4">
              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold">Create a custom exercise</h3>
                  <p className="text-sm text-muted-foreground">
                    Perfect when you have a favourite movement or a coach&apos;s recommendation that&apos;s missing from the library.
                  </p>
                </div>
                <Button variant="outline" onClick={() => setShowCustomForm(!showCustomForm)}>
                  {showCustomForm ? "Hide" : "Show"} form
                </Button>
              </div>

              {showCustomForm && (
                <form className="space-y-4 rounded-lg border bg-muted/40 p-4" onSubmit={handleCreateCustomExercise}>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="custom-name">Exercise name</Label>
                      <Input
                        id="custom-name"
                        placeholder="e.g. Bulgarian Split Squat"
                        value={customName}
                        onChange={(event) => setCustomName(event.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="custom-sets">Sets</Label>
                      <Input
                        id="custom-sets"
                        type="number"
                        min={1}
                        value={customSets}
                        onChange={(event) => setCustomSets(event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="custom-reps">Reps / Work interval</Label>
                      <Input
                        id="custom-reps"
                        placeholder={defaultReps}
                        value={customReps}
                        onChange={(event) => setCustomReps(event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="custom-rest">Rest</Label>
                      <Input
                        id="custom-rest"
                        placeholder={defaultRest}
                        value={customRest}
                        onChange={(event) => setCustomRest(event.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="custom-target-muscles">Target muscles (comma separated)</Label>
                      <Input
                        id="custom-target-muscles"
                        placeholder="e.g. quads, glutes"
                        value={customTargetMuscles}
                        onChange={(event) => setCustomTargetMuscles(event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="custom-equipment">Equipment (comma separated)</Label>
                      <Input
                        id="custom-equipment"
                        placeholder={defaultEquipment.join(", ") || "bodyweight"}
                        value={customEquipment}
                        onChange={(event) => setCustomEquipment(event.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="custom-instructions">Instructions / coaching cues</Label>
                    <Textarea
                      id="custom-instructions"
                      placeholder="Add setup, execution, and coaching notes so Future You remembers the details."
                      value={customInstructions}
                      onChange={(event) => setCustomInstructions(event.target.value)}
                      rows={4}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="custom-time-based"
                      checked={customIsTimeBased}
                      onCheckedChange={(checked) => setCustomIsTimeBased(Boolean(checked))}
                    />
                    <Label htmlFor="custom-time-based" className="text-sm text-muted-foreground">
                      Time-based exercise
                    </Label>
                  </div>

                  <Button type="submit" className="w-full md:w-auto">
                    Add custom exercise
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
