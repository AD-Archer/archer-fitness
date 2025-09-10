"use client"
// used to add a new exercise to the current workout session
import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Target } from "lucide-react"

interface AddExerciseModalProps {
  isOpen: boolean
  onClose: () => void
  onAddExercise: (name: string, targetType?: "reps" | "time") => void
  isLoading?: boolean
}

export function AddExerciseModal({ isOpen, onClose, onAddExercise, isLoading = false }: AddExerciseModalProps) {
  const [exerciseName, setExerciseName] = useState("")
  const [targetType, setTargetType] = useState<"reps" | "time">("reps")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (exerciseName.trim()) {
      onAddExercise(exerciseName.trim(), targetType)
      setExerciseName("")
      setTargetType("reps")
      onClose()
    }
  }

  const handleClose = () => {
    setExerciseName("")
    setTargetType("reps")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            Add Exercise
          </DialogTitle>
          <DialogDescription>
            Add a new exercise to your current workout session.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="exercise-name">Exercise Name</Label>
              <Input
                id="exercise-name"
                placeholder="e.g., Push-ups, Squats, Bench Press"
                value={exerciseName}
                onChange={(e) => setExerciseName(e.target.value)}
                autoFocus
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="exercise-type">Exercise Type</Label>
              <Select value={targetType} onValueChange={(value: "reps" | "time") => setTargetType(value)} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select exercise type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reps">Reps-based (count repetitions)</SelectItem>
                  <SelectItem value="time">Time-based (timed exercise)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!exerciseName.trim() || isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? "Adding..." : "Add Exercise"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
