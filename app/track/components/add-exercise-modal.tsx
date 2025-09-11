"use client"
// used to add a new exercise to the current workout session
import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Target } from "lucide-react"
import { ExerciseSelector } from "./exercise-selector"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Exercise {
  id: string
  name: string
  description?: string
  instructions?: string
}

interface AddExerciseModalProps {
  isOpen: boolean
  onClose: () => void
  onAddExercise: (exercise: { name: string, id?: string, instructions?: string }, targetType?: "reps" | "time") => void
  isLoading?: boolean
}

export function AddExerciseModal({ isOpen, onClose, onAddExercise, isLoading = false }: AddExerciseModalProps) {
  const [exerciseName, setExerciseName] = useState("")
  const [targetType, setTargetType] = useState<"reps" | "time">("reps")
  const [activeTab, setActiveTab] = useState<"manual" | "selector">("manual")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (exerciseName.trim()) {
      onAddExercise({ name: exerciseName.trim() }, targetType)
      resetForm()
    }
  }

  const handleSelectExercise = (selectedExercise: Exercise) => {
    onAddExercise({
      id: selectedExercise.id,
      name: selectedExercise.name,
      instructions: selectedExercise.instructions
    }, targetType)
    resetForm()
  }

  const resetForm = () => {
    setExerciseName("")
    setTargetType("reps")
    setActiveTab("manual")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-screen h-screen max-w-[100vw] max-h-[100vh] p-0 overflow-hidden rounded-none sm:rounded-none">
        <div className="flex flex-col h-full">
          <DialogHeader className="px-6 py-4 md:px-8 md:py-6 border-b">
            <DialogTitle className="flex items-center gap-3 text-xl md:text-2xl">
              <Target className="w-6 h-6 text-blue-600" />
              Add Exercise
            </DialogTitle>
            <DialogDescription className="text-base">
              Add a new exercise to your current workout session.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "manual" | "selector")} className="h-full flex flex-col">
              <div className="px-4 sm:px-6 md:px-8 pt-3 md:pt-6">
                <TabsList className="grid w-full grid-cols-2 h-12">
                  <TabsTrigger value="manual" className="text-sm md:text-base">Manual Entry</TabsTrigger>
                  <TabsTrigger value="selector" className="text-sm md:text-base">Exercise Database</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="manual" className="flex-1 overflow-y-auto mt-0 px-4 sm:px-6 md:px-8">
                <form onSubmit={handleSubmit} className="py-6 md:py-8">
                  <div className="space-y-6 max-w-2xl">
                    <div className="space-y-3">
                      <Label htmlFor="exercise-name" className="text-base font-medium">Exercise Name</Label>
                      <Input
                        id="exercise-name"
                        placeholder="e.g., Push-ups, Squats, Bench Press"
                        value={exerciseName}
                        onChange={(e) => setExerciseName(e.target.value)}
                        autoFocus
                        disabled={isLoading}
                        className="h-12 text-base"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="exercise-type" className="text-base font-medium">Exercise Type</Label>
                      <Select value={targetType} onValueChange={(value: "reps" | "time") => setTargetType(value)} disabled={isLoading}>
                        <SelectTrigger className="h-12 text-base">
                          <SelectValue placeholder="Select exercise type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="reps" className="text-base">Reps-based (count repetitions)</SelectItem>
                          <SelectItem value="time" className="text-base">Time-based (timed exercise)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </form>
              </TabsContent>

        <TabsContent value="selector" className="flex-1 overflow-hidden mt-0">
                <div className="h-full flex flex-col">
          <div className="px-4 sm:px-6 md:px-8 py-3 md:py-4 border-b bg-muted/30">
                    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
                      <h3 className="text-sm md:text-base font-medium text-muted-foreground">Select an exercise from the database or create a custom one</h3>
                      <div className="flex items-center gap-2">
                        <Label className="text-sm font-medium whitespace-nowrap">Exercise Type:</Label>
                        <Select value={targetType} onValueChange={(value: "reps" | "time") => setTargetType(value)} disabled={isLoading}>
                          <SelectTrigger className="h-10 w-full sm:w-[160px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="reps">Reps-based</SelectItem>
                            <SelectItem value="time">Time-based</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
          <div className="flex-1 overflow-hidden">
                    <ExerciseSelector
                      onSelect={handleSelectExercise}
                      onClose={() => setActiveTab("manual")}
                      embedded={true}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="border-t px-6 md:px-8 py-4 md:py-6">
            <DialogFooter className="flex flex-col sm:flex-row gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                className="w-full sm:w-auto h-12 text-base order-2 sm:order-1"
              >
                Cancel
              </Button>
              {activeTab === "manual" && (
                <Button
                  type="submit"
                  disabled={!exerciseName.trim() || isLoading}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 h-12 text-base order-1 sm:order-2"
                  onClick={handleSubmit}
                >
                  {isLoading ? "Adding..." : "Add Exercise"}
                </Button>
              )}
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
