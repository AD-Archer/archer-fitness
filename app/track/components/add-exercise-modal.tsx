"use client"
import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Target, Search, Plus, PlusCircle, Trash2, Eye } from "lucide-react"
import { logger } from "@/lib/logger"

interface Exercise {
  id: string
  name: string
  description?: string
  instructions?: string
  bodyParts?: Array<{ bodyPart: { id: string; name: string } }>
  muscles?: Array<{ muscle: { id: string; name: string }; isPrimary: boolean }>
  equipments?: Array<{ equipment: { id: string; name: string } }>
  isCustom?: boolean
  gifUrl?: string
}

interface BodyPart {
  id: string
  name: string
}

interface Equipment {
  id: string
  name: string
}

interface Muscle {
  id: string
  name: string
}

interface AddExerciseModalProps {
  isOpen: boolean
  onClose: () => void
  // `targetUnit` added so time-based exercises have a unit of measurement (seconds | minutes)
  onAddExercise: (
    exercise: { name: string, id?: string, instructions?: string },
    targetType?: "reps" | "time",
    targetUnit?: "seconds" | "minutes"
  ) => void
  isLoading?: boolean
}

export function AddExerciseModal({ isOpen, onClose, onAddExercise, isLoading = false }: AddExerciseModalProps) {
  const [targetType, setTargetType] = useState<"reps" | "time">("reps")
  const [targetUnit, setTargetUnit] = useState<"seconds" | "minutes">("seconds")
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [bodyParts, setBodyParts] = useState<BodyPart[]>([])
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [muscles, setMuscles] = useState<Muscle[]>([])
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedBodyPart, setSelectedBodyPart] = useState<string>("all")
  const [selectedEquipment, setSelectedEquipment] = useState<string>("all")
  const [selectedMuscle, setSelectedMuscle] = useState<string>("all")
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newExerciseName, setNewExerciseName] = useState("")
  const [newExerciseDescription, setNewExerciseDescription] = useState("")
  const [savingCustomExercise, setSavingCustomExercise] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [scrollContainerRef, setScrollContainerRef] = useState<HTMLDivElement | null>(null)
  const [showGifModal, setShowGifModal] = useState(false)
  const [selectedGifExercise, setSelectedGifExercise] = useState<Exercise | null>(null)

  // Function to fetch exercises with search parameters
  const fetchExercises = async (params: Record<string, string> = {}, page: number = 1, append: boolean = false) => {
    if (append) {
      setLoadingMore(true)
    }

    try {
      // Build query string from params
      const queryString = Object.entries(params)
        .filter(([, value]) => value !== "all" && value !== "")
        .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
        .join("&")

      const limit = 20 // Smaller page size for infinite scroll
      const offset = (page - 1) * limit

      const url = `/api/workout-tracker/exercises?${queryString}&limit=${limit}&offset=${offset}`

      const response = await fetch(url)
      const data = await response.json()

      // Combine user exercises and predefined exercises
      const newExercises = [...data.userExercises, ...data.predefinedExercises]

      // Debug logging to check if exercises have GIF URLs
      logger.info("Exercises loaded:", {
        total: newExercises.length,
        withGifs: newExercises.filter(ex => ex.gifUrl).length,
        sampleExercises: newExercises.slice(0, 3).map(ex => ({
          name: ex.name,
          hasGif: !!ex.gifUrl,
          gifUrl: ex.gifUrl
        }))
      })

      if (append) {
        setExercises(prev => [...prev, ...newExercises])
      } else {
        setExercises(newExercises)
      }

      // Check if there are more exercises to load
      setHasMore(newExercises.length === limit)

      if (page === 1) {
        setCurrentPage(1)
      }
    } catch (error) {
      logger.error("Error fetching exercises:", error)
    } finally {
      setLoadingMore(false)
    }
  }

  // Function to fetch filter options (body parts, equipment, muscles)
  const fetchFilterOptions = async () => {
    try {
      const [bodyPartsRes, equipmentRes, musclesRes] = await Promise.all([
        fetch("/api/workout-tracker/body-parts"),
        fetch("/api/workout-tracker/equipment"),
        fetch("/api/workout-tracker/muscles")
      ])

      const bodyPartsData = await bodyPartsRes.json()
      setBodyParts(bodyPartsData)

      const equipmentData = await equipmentRes.json()
      setEquipment(equipmentData)

      const musclesData = await musclesRes.json()
      setMuscles(musclesData)
    } catch (error) {
      logger.error("Error fetching filter options:", error)
    }
  }

  // Function to handle scroll for infinite loading
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef || loadingMore || !hasMore) return

    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100 // 100px threshold

    if (isNearBottom) {
      const nextPage = currentPage + 1
      setCurrentPage(nextPage)

      const params: Record<string, string> = {}

      if (searchTerm) {
        params.search = searchTerm
      }

      if (selectedBodyPart !== "all") {
        params.bodyPartId = selectedBodyPart
      }

      if (selectedEquipment !== "all") {
        params.equipmentId = selectedEquipment
      }

      if (selectedMuscle !== "all") {
        params.muscleId = selectedMuscle
      }

      fetchExercises(params, nextPage, true)
    }
  }, [scrollContainerRef, loadingMore, hasMore, currentPage, searchTerm, selectedBodyPart, selectedEquipment, selectedMuscle])

  // Add scroll event listener
  useEffect(() => {
    const container = scrollContainerRef
    if (container) {
      container.addEventListener('scroll', handleScroll)
      return () => container.removeEventListener('scroll', handleScroll)
    }
  }, [scrollContainerRef, handleScroll])

  // Initial data load
  useEffect(() => {
    if (isOpen) {
      fetchFilterOptions()
      fetchExercises()
    }
  }, [isOpen])

  // Fetch exercises when search parameters change
  useEffect(() => {
    if (!isOpen) return

    // Reset pagination when filters change
    setCurrentPage(1)
    setHasMore(true)

    // Debounce the search to avoid too many requests
    const debounceTimer = setTimeout(() => {
      const params: Record<string, string> = {}

      if (searchTerm) {
        params.search = searchTerm
      }

      if (selectedBodyPart !== "all") {
        params.bodyPartId = selectedBodyPart
      }

      if (selectedEquipment !== "all") {
        params.equipmentId = selectedEquipment
      }

      if (selectedMuscle !== "all") {
        params.muscleId = selectedMuscle
      }

      fetchExercises(params, 1, false)
    }, 300) // 300ms debounce

    return () => clearTimeout(debounceTimer)
  }, [searchTerm, selectedBodyPart, selectedEquipment, selectedMuscle, isOpen])

  const handleSelectExercise = (exercise: Exercise) => {
    // Pass selected unit when targetType is time-based
    onAddExercise(
      {
        id: exercise.id,
        name: exercise.name,
        instructions: exercise.instructions,
      },
      targetType,
      targetType === "time" ? targetUnit : undefined
    )
    resetForm()
  }

  const handleViewGif = (exercise: Exercise) => {
    setSelectedGifExercise(exercise)
    setShowGifModal(true)
  }

  const handleCreateCustomExercise = async () => {
    if (!newExerciseName.trim()) return

    setSavingCustomExercise(true)
    try {
      const response = await fetch("/api/workout-tracker/exercises/custom", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newExerciseName,
          description: newExerciseDescription,
        }),
      })

      if (response.ok) {
        const newExercise = await response.json()
        setExercises(prev => [...prev, newExercise])
        setNewExerciseName("")
        setNewExerciseDescription("")
        setShowCreateForm(false)
      } else {
        logger.error("Failed to create custom exercise")
      }
    } catch (error) {
      logger.error("Error creating custom exercise:", error)
    } finally {
      setSavingCustomExercise(false)
    }
  }

  const handleDeleteExercise = async (id: string) => {
    if (!confirm("Are you sure you want to delete this custom exercise? This will permanently remove it from your exercise library and you won't be able to use it in future workouts.")) return

    try {
      const response = await fetch(`/api/workout-tracker/exercises/custom/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setExercises(prev => prev.filter(ex => ex.id !== id))
      } else {
        logger.error("Failed to delete custom exercise")
      }
    } catch (error) {
      logger.error("Error deleting custom exercise:", error)
    }
  }

  const isCustomExercise = (exercise: Exercise) => {
    // An exercise is custom if:
    // 1. It has the isCustom flag explicitly set to true
    // 2. OR it doesn't have any body parts, muscles, or equipment associations (likely user-created)
    return Boolean(
      exercise.isCustom ||
      (!exercise.bodyParts?.length && !exercise.muscles?.length && !exercise.equipments?.length)
    );
  };

  const resetForm = () => {
    setTargetType("reps")
    setTargetUnit("seconds")
    setSearchTerm("")
    setSelectedBodyPart("all")
    setSelectedEquipment("all")
    setSelectedMuscle("all")
    setShowCreateForm(false)
    setNewExerciseName("")
    setNewExerciseDescription("")
    setShowGifModal(false)
    setSelectedGifExercise(null)
    onClose()
  }

  const handleClose = () => {
    resetForm()
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="w-[95vw] mx-auto p-0 overflow-hidden rounded-lg h-[95vh] max-h-[95vh]">
          <div className="flex flex-col h-full min-h-[600px]">
            <DialogHeader className="px-4 py-3 md:px-6 md:py-4 border-b flex-shrink-0">
              <DialogTitle className="flex items-center gap-2 text-lg md:text-xl">
                <Target className="w-5 h-5 text-blue-600" />
                Add Exercise
              </DialogTitle>
              <DialogDescription className="text-sm md:text-base">
                Add a new exercise to your current workout session.
              </DialogDescription>
            </DialogHeader>

            {exercises.length === 0 && !loadingMore ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
                  <p className="text-muted-foreground">Loading exercises...</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                <div className="px-4 py-3 md:px-6 md:py-4 border-b bg-muted/30 flex-shrink-0">
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

                      {/* Time unit selector - visible only when time-based is selected */}
                      {targetType === "time" && (
                        <div className="flex items-center gap-2">
                          <Label className="text-sm font-medium whitespace-nowrap">Unit:</Label>
                          <Select value={targetUnit} onValueChange={(value: "seconds" | "minutes") => setTargetUnit(value)} disabled={isLoading}>
                            <SelectTrigger className="h-10 w-full sm:w-[120px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="seconds">Seconds</SelectItem>
                              <SelectItem value="minutes">Minutes</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0" ref={setScrollContainerRef}>
                  <div className="p-4 md:p-6 space-y-6">
                    {/* Create Custom Exercise Button/Form */}
                    <div className="bg-background">
                      {showCreateForm ? (
                        <Card className="p-4 md:p-6 border-blue-500 border-2 shadow-lg">
                          <h3 className="text-lg font-semibold mb-4 text-blue-700 flex items-center gap-2">
                            <Plus className="w-5 h-5" />
                            Create Custom Exercise
                          </h3>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="new-exercise-name" className="text-base font-medium">Exercise Name</Label>
                              <Input
                                id="new-exercise-name"
                                value={newExerciseName}
                                onChange={(e) => setNewExerciseName(e.target.value)}
                                placeholder="Enter exercise name"
                                autoFocus
                                className="h-12 text-base"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="new-exercise-description" className="text-base font-medium">Description (optional)</Label>
                              <Input
                                id="new-exercise-description"
                                value={newExerciseDescription}
                                onChange={(e) => setNewExerciseDescription(e.target.value)}
                                placeholder="Enter a brief description"
                                className="h-12 text-base"
                              />
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 justify-end pt-2">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setShowCreateForm(false)
                                  setNewExerciseName("")
                                  setNewExerciseDescription("")
                                }}
                                className="h-11 px-6"
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={handleCreateCustomExercise}
                                disabled={!newExerciseName.trim() || savingCustomExercise}
                                className="bg-blue-600 hover:bg-blue-700 text-white h-11 px-6"
                              >
                                {savingCustomExercise ? 'Saving...' : 'Save Exercise'}
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ) : (
                        <Button
                          onClick={() => setShowCreateForm(true)}
                          variant="outline"
                          className="self-start"
                        >
                          <PlusCircle className="mr-2 h-5 w-5" />
                          Create Custom Exercise
                        </Button>
                      )}
                    </div>

                    {/* Search and Filters */}
                    <div className="space-y-4">
                      <div className="relative">
                        <Search className="absolute left-4 top-4 h-5 w-5 text-muted-foreground" />
                        <Input
                          placeholder="Search exercises..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-12 h-12 text-base"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label className="text-base font-medium">Body Part</Label>
                          <Select value={selectedBodyPart} onValueChange={setSelectedBodyPart}>
                            <SelectTrigger className="w-full h-12 text-base">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Body Parts</SelectItem>
                              {bodyParts.map((bodyPart) => (
                                <SelectItem key={bodyPart.id} value={bodyPart.id}>
                                  {bodyPart.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-base font-medium">Equipment</Label>
                          <Select value={selectedEquipment} onValueChange={setSelectedEquipment}>
                            <SelectTrigger className="w-full h-12 text-base">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Equipment</SelectItem>
                              {equipment.map((eq) => (
                                <SelectItem key={eq.id} value={eq.id}>
                                  {eq.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-base font-medium">Muscle</Label>
                          <Select value={selectedMuscle} onValueChange={setSelectedMuscle}>
                            <SelectTrigger className="w-full h-12 text-base">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Muscles</SelectItem>
                              {muscles.map((muscle) => (
                                <SelectItem key={muscle.id} value={muscle.id}>
                                  {muscle.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Exercise List */}
                    <div className="space-y-4">
                      {exercises.map((exercise) => (
                        <Card
                          key={exercise.id}
                          className={`p-4 md:p-6 hover:bg-muted/50 transition-all duration-200 border-2 hover:border-blue-200 hover:shadow-md ${isCustomExercise(exercise) ? 'border-purple-200 bg-purple-50/30' : 'border-muted'}`}
                        >
                          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                            <div className="flex-1 cursor-pointer" onClick={() => handleSelectExercise(exercise)}>
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold text-lg">{exercise.name}</h3>
                                {exercise.gifUrl && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="p-1 h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleViewGif(exercise);
                                    }}
                                    title="View exercise demonstration"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                )}
                                {isCustomExercise(exercise) && (
                                  <span className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium">
                                    Custom
                                  </span>
                                )}
                              </div>
                              {exercise.description && (
                                <p className="text-muted-foreground mb-3 text-base leading-relaxed">
                                  {exercise.description}
                                </p>
                              )}
                              <div className="flex flex-wrap gap-2">
                                {exercise.bodyParts?.map((bp) => (
                                  <span
                                    key={bp.bodyPart.id}
                                    className="text-sm bg-blue-100 text-blue-700 px-3 py-1.5 rounded-md font-medium"
                                  >
                                    {bp.bodyPart.name}
                                  </span>
                                ))}
                                {exercise.muscles?.filter(m => m.isPrimary).map((m) => (
                                  <span
                                    key={m.muscle.id}
                                    className="text-sm bg-green-100 text-green-700 px-3 py-1.5 rounded-md font-medium"
                                  >
                                    {m.muscle.name}
                                  </span>
                                ))}
                                {exercise.equipments?.map((eq) => (
                                  <span
                                    key={eq.equipment.id}
                                    className="text-sm bg-orange-100 text-orange-700 px-3 py-1.5 rounded-md font-medium"
                                  >
                                    {eq.equipment.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center gap-3 lg:flex-shrink-0">
                              {isCustomExercise(exercise) && (
                                <Button
                                  size="lg"
                                  variant="destructive"
                                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 h-11 px-4"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteExercise(exercise.id);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete
                                </Button>
                              )}
                              <Button
                                size="lg"
                                onClick={() => handleSelectExercise(exercise)}
                                className="bg-blue-600 hover:bg-blue-700 h-11 px-6 text-base font-medium"
                              >
                                Select
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}

                      {/* Loading more indicator */}
                      {loadingMore && (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                          <p className="text-muted-foreground">Loading more exercises...</p>
                        </div>
                      )}
                    </div>

                    {exercises.length === 0 && (
                      <div className="text-center py-16 flex flex-col items-center gap-6">
                        <div className="text-muted-foreground text-lg">
                          No exercises found matching your search criteria.
                        </div>
                        <Button
                          onClick={() => {
                            setShowCreateForm(true);
                            // Pre-fill with search term if available
                            if (searchTerm) {
                              setNewExerciseName(searchTerm);
                            }
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white h-12 px-6 text-base"
                        >
                          <Plus className="w-5 h-5 mr-2" />
                          Create &quot;{searchTerm}&quot; as Custom Exercise
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="border-t px-4 py-3 md:px-6 md:py-4 flex-shrink-0">
              <DialogFooter className="flex flex-col sm:flex-row gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isLoading}
                  className="w-full sm:w-auto h-10"
                >
                  Cancel
                </Button>
              </DialogFooter>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* GIF Modal */}
      <Dialog open={showGifModal} onOpenChange={setShowGifModal}>
        <DialogContent className="w-[95vw] mx-auto max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg md:text-xl">
              <Target className="w-5 h-5 text-green-600" />
              {selectedGifExercise?.name} - Exercise Demo
            </DialogTitle>
            <DialogDescription>
              Watch the proper form for this exercise
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-center py-4">
            {selectedGifExercise?.gifUrl ? (
              <div className="relative w-full max-w-2xl">
                <img
                  src={selectedGifExercise.gifUrl}
                  alt={`${selectedGifExercise.name} exercise demonstration`}
                  className="w-full h-auto rounded-lg shadow-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      const errorDiv = document.createElement('div');
                      errorDiv.className = 'text-center py-12 text-muted-foreground';
                      errorDiv.innerHTML = `
                        <div class="text-lg mb-2">GIF not available</div>
                        <div class="text-sm">The demonstration video for this exercise is not currently available.</div>
                      `;
                      parent.appendChild(errorDiv);
                    }
                  }}
                />
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <div className="text-lg mb-2">GIF not available</div>
                <div className="text-sm">The demonstration video for this exercise is not currently available.</div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setShowGifModal(false)} className="w-full sm:w-auto">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
