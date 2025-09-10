"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus } from "lucide-react"

interface AddSetFormProps {
  exerciseId: string
  setNumber: number
  onAddSet: (exerciseId: string, reps: number, weight?: number) => void
}

export function AddSetForm({ exerciseId, setNumber, onAddSet }: AddSetFormProps) {
  const [reps, setReps] = useState("")
  const [weight, setWeight] = useState("")
  const [isBodyweight, setIsBodyweight] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (reps && (isBodyweight || weight)) {
      onAddSet(
        exerciseId,
        Number.parseInt(reps),
        isBodyweight ? undefined : Number.parseFloat(weight)
      )
      setReps("")
      setWeight("")
      setIsBodyweight(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 rounded-lg border-2 border-dashed border-muted-foreground/25">
      <div className="flex items-center gap-3 mb-3">
        <Badge variant="outline">Set {setNumber}</Badge>
        <span className="text-sm text-muted-foreground">Log your performance</span>
      </div>

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
            Weight (lbs)
          </Label>
          <Input
            id="weight"
            type="number"
            step="0.5"
            placeholder="25"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
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

      <Button type="submit" size="sm" className="w-full">
        <Plus className="w-3 h-3 mr-1" />
        Add Set
      </Button>
    </form>
  )
}
