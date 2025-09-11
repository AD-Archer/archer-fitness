"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Save, FilePlus, RefreshCw } from "lucide-react"

interface SaveWorkoutDialogProps {
  isOpen: boolean
  onClose: () => void
  onSaveSessionOnly: () => void
  onSaveAsNew: (name: string, description?: string) => void
  onUpdateExisting: () => void
  session: {
    id: string
    name: string
    workoutTemplateId?: string
    exercises: Array<{
      id: string
      name: string
      targetSets: number
      targetReps: string
      targetType?: "reps" | "time"
      instructions?: string
    }>
  } | null
  isSaving: boolean
}

export function SaveWorkoutDialog({
  isOpen,
  onClose,
  onSaveSessionOnly,
  onSaveAsNew,
  onUpdateExisting,
  session,
  isSaving,
}: SaveWorkoutDialogProps) {
  const [saveMode, setSaveMode] = useState<"session" | "new" | "update">("session")
  const [newWorkoutName, setNewWorkoutName] = useState("")
  const [newWorkoutDescription, setNewWorkoutDescription] = useState("")

  // Reset form when dialog opens
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setSaveMode("session")
      setNewWorkoutName("")
      setNewWorkoutDescription("")
    }
    if (!open) {
      onClose()
    }
  }

  const handleSave = () => {
    if (saveMode === "session") {
      onSaveSessionOnly()
    } else if (saveMode === "new") {
      if (!newWorkoutName.trim()) {
        alert("Please enter a name for the new workout")
        return
      }
      onSaveAsNew(newWorkoutName.trim(), newWorkoutDescription.trim() || undefined)
    } else if (saveMode === "update") {
      onUpdateExisting()
    }
  }

  const canUpdateExisting = session?.workoutTemplateId

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="w-5 h-5" />
            Save Workout
          </DialogTitle>
          <DialogDescription>
            Choose how you&apos;d like to save your workout modifications.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-3">
            <Label className="text-base font-medium">Save Options</Label>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="session-only"
                  name="save-mode"
                  value="session"
                  checked={saveMode === "session"}
                  onChange={(e) => setSaveMode(e.target.value as "session")}
                  className="w-4 h-4"
                />
                <Label htmlFor="session-only" className="flex items-center gap-2 cursor-pointer">
                  <Save className="w-4 h-4" />
                  Save session progress only
                </Label>
              </div>
              <p className="text-sm text-muted-foreground ml-6">
                Save your current workout progress to continue later
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="save-new"
                  name="save-mode"
                  value="new"
                  checked={saveMode === "new"}
                  onChange={(e) => setSaveMode(e.target.value as "new")}
                  className="w-4 h-4"
                />
                <Label htmlFor="save-new" className="flex items-center gap-2 cursor-pointer">
                  <FilePlus className="w-4 h-4" />
                  Save as new workout template
                </Label>
              </div>
              <p className="text-sm text-muted-foreground ml-6">
                Create a new workout template with your current exercises
              </p>
            </div>

            {canUpdateExisting && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="update-existing"
                    name="save-mode"
                    value="update"
                    checked={saveMode === "update"}
                    onChange={(e) => setSaveMode(e.target.value as "update")}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="update-existing" className="flex items-center gap-2 cursor-pointer">
                    <RefreshCw className="w-4 h-4" />
                    Update existing workout template
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground ml-6">
                  Update &quot;{session?.name}&quot; with your current exercises
                </p>
              </div>
            )}
          </div>

          {saveMode === "new" && (
            <div className="space-y-4 border-t pt-4">
              <div className="space-y-2">
                <Label htmlFor="workout-name" className="text-base font-medium">
                  Workout Name *
                </Label>
                <Input
                  id="workout-name"
                  value={newWorkoutName}
                  onChange={(e) => setNewWorkoutName(e.target.value)}
                  placeholder="Enter workout name"
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workout-description" className="text-base font-medium">
                  Description (optional)
                </Label>
                <Input
                  id="workout-description"
                  value={newWorkoutDescription}
                  onChange={(e) => setNewWorkoutDescription(e.target.value)}
                  placeholder="Enter workout description"
                  className="w-full"
                />
              </div>
            </div>
          )}

          {session && (
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-sm font-medium">Current workout summary:</p>
              <p className="text-sm text-muted-foreground">
                {session.exercises.length} exercises • Based on &quot;{session.name}&quot;
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || (saveMode === "new" && !newWorkoutName.trim())}
            className="min-w-[100px]"
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}