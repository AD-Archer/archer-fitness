"use client"

import type React from "react"
import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, Plus, Trash2, Eye, Target } from "lucide-react"
import Fuse from 'fuse.js'
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
  // Additional possible fields for debugging
  bodyPartId?: string
  bodyPartIds?: string[]
  [key: string]: unknown // Allow additional properties
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
  bodyPartId?: string // Add bodyPartId to the muscle interface
}

interface ExerciseSelectorProps {
  onSelect: (exercise: Exercise) => void
  onClose: () => void
}

export function ExerciseSelector({ onSelect, onClose }: ExerciseSelectorProps) {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [allExercises, setAllExercises] = useState<Exercise[]>([]) // Store all exercises for client-side search
  const [bodyParts, setBodyParts] = useState<BodyPart[]>([])
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [muscles, setMuscles] = useState<Muscle[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [selectedBodyPart, setSelectedBodyPart] = useState<string>("all")
  const [selectedEquipment, setSelectedEquipment] = useState<string>("all")
  const [selectedMuscle, setSelectedMuscle] = useState<string>("all")
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newExerciseName, setNewExerciseName] = useState("")
  const [newExerciseDescription, setNewExerciseDescription] = useState("")
  const [savingCustomExercise, setSavingCustomExercise] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [showGifModal, setShowGifModal] = useState(false)
  const [selectedGifExercise, setSelectedGifExercise] = useState<Exercise | null>(null)

  // Create Fuse instance with all exercises - memoized with stable options
  const fuse = useMemo(() => {
    if (allExercises.length === 0) return null
    
    const fuseOptions = {
      keys: [
        { name: 'name', weight: 0.7 },
        { name: 'description', weight: 0.3 },
        { name: 'bodyParts.bodyPart.name', weight: 0.1 },
        { name: 'muscles.muscle.name', weight: 0.1 },
        { name: 'equipments.equipment.name', weight: 0.1 }
      ],
      threshold: 0.4,
      distance: 100,
      minMatchCharLength: 2,
      includeScore: true,
      ignoreLocation: true,
      findAllMatches: true
    }
    return new Fuse(allExercises, fuseOptions)
  }, [allExercises])

  // Function to fetch ALL exercises initially (for client-side search)
  const fetchAllExercises = async () => {
    setLoading(true)
    try {
      // Fetch a large number of exercises initially
      const response = await fetch(`/api/workout-tracker/exercises?limit=1000&offset=0`)
      const data = await response.json()
      
      const allExercisesList = [...data.userExercises, ...data.predefinedExercises]
      
      // Debug: Log the structure of the first few exercises
      logger.info('Raw exercise data sample:', allExercisesList.slice(0, 3))
      logger.info('First exercise complete structure:', JSON.stringify(allExercisesList[0], null, 2))
      
      setAllExercises(allExercisesList)
      setExercises(allExercisesList.slice(0, 20)) // Show first 20 initially
      setHasMore(allExercisesList.length > 20)
    } catch (error) {
      logger.error("Error fetching all exercises:", error)
    } finally {
      setLoading(false)
    }
  }

  // Function to filter exercises based on search and filters
  const filterExercises = useCallback(() => {
    if (allExercises.length === 0) return
    
    setIsSearching(true)
    
    // Use setTimeout to prevent blocking the UI during filtering
    setTimeout(() => {
      let filteredExercises = allExercises

      logger.info('Filtering exercises:', {
        totalExercises: allExercises.length,
        selectedEquipment,
        selectedMuscle,
        debouncedSearchTerm
      })

      // Apply filters first
      if (selectedBodyPart !== "all") {
        logger.info('Filtering by body part:', selectedBodyPart)
        logger.info('Available muscles:', muscles)
        
        filteredExercises = filteredExercises.filter(exercise => {
          // Filter by body part: show exercises that target muscles belonging to the selected body part
          // First, check if the exercise has direct body part associations
          const hasDirectBodyPart = 
            exercise.bodyParts?.some(bp => bp.bodyPart?.id === selectedBodyPart)
          
          logger.info(`Exercise "${exercise.name}" - Direct body part match:`, hasDirectBodyPart)
          
          // Since muscles don't have bodyPartId in the API, let's use a different approach
          // We'll create a mapping based on common muscle-to-body-part relationships
          const muscleToBodyPartMap: Record<string, string[]> = {
            // Common muscle name patterns to body part mappings
            'chest': ['chest', 'pectorals', 'pecs'],
            'back': ['lats', 'latissimus', 'rhomboids', 'trapezius', 'traps', 'rear delt'],
            'shoulders': ['deltoids', 'delts', 'front delt', 'side delt', 'rear delt'],
            'arms': ['biceps', 'triceps', 'forearms'],
            'legs': ['quadriceps', 'quads', 'hamstrings', 'calves', 'glutes'],
            'core': ['abs', 'abdominals', 'obliques', 'core'],
            // Add more mappings as needed
          }
          
          // Find the selected body part name
          const selectedBodyPartData = bodyParts.find(bp => bp.id === selectedBodyPart)
          const selectedBodyPartName = selectedBodyPartData?.name?.toLowerCase() || ''
          
          // Check if any of the exercise's muscles belong to this body part
          const hasMuscleInBodyPart = exercise.muscles?.some(exerciseMuscle => {
            const muscleName = exerciseMuscle.muscle.name.toLowerCase()
            logger.info(`  Checking muscle "${exerciseMuscle.muscle.name}" for body part "${selectedBodyPartName}"`)
            
            // Get the muscle keywords for this body part
            const bodyPartMuscles = muscleToBodyPartMap[selectedBodyPartName] || []
            
            // Check if the muscle name contains any of the body part keywords
            const belongsToBodyPart = bodyPartMuscles.some(keyword => 
              muscleName.includes(keyword.toLowerCase())
            ) || muscleName.includes(selectedBodyPartName)
            
            logger.info(`    Muscle "${muscleName}" belongs to "${selectedBodyPartName}":`, belongsToBodyPart)
            return belongsToBodyPart
          })
          
          logger.info(`Exercise "${exercise.name}" - Muscle in body part match:`, hasMuscleInBodyPart)
          const shouldInclude = hasDirectBodyPart || hasMuscleInBodyPart
          logger.info(`Exercise "${exercise.name}" - Final decision:`, shouldInclude)
          
          return shouldInclude
        })
      }

      if (selectedEquipment !== "all") {
        filteredExercises = filteredExercises.filter(exercise => 
          exercise.equipments?.some(eq => eq.equipment.id === selectedEquipment)
        )
      }

      if (selectedMuscle !== "all") {
        filteredExercises = filteredExercises.filter(exercise => 
          exercise.muscles?.some(m => m.muscle.id === selectedMuscle)
        )
      }

      // Apply search if there's a search term
      if (debouncedSearchTerm.trim() && fuse) {
        const searchResults = fuse.search(debouncedSearchTerm)
        const searchedExercises = searchResults.map(result => result.item)
        
        // Combine with filtered exercises (intersection)
        filteredExercises = searchedExercises.filter(exercise => 
          filteredExercises.some(filtered => filtered.id === exercise.id)
        )
      }

      logger.info('Final filtered exercises:', filteredExercises.length)
      setExercises(filteredExercises.slice(0, 50)) // Show more results
      setHasMore(filteredExercises.length > 50)
      setIsSearching(false)
    }, 0)
  }, [allExercises, selectedBodyPart, selectedEquipment, selectedMuscle, debouncedSearchTerm, fuse, muscles, bodyParts])

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
      logger.info('Muscles from API:', musclesData)
      logger.info('Sample muscle structure:', JSON.stringify(musclesData[0], null, 2)) // Debug muscle structure
      logger.info('Total muscles loaded:', musclesData.length)
      setMuscles(musclesData)
    } catch (error) {
      logger.error("Error fetching filter options:", error)
    }
  }

  // Initial data load
  useEffect(() => {
    fetchFilterOptions()
    fetchAllExercises()
  }, [])

  // Separate debounced search effect
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 1000) // Increased back to 1 second

    return () => clearTimeout(debounceTimer)
  }, [searchTerm])

  // Filter exercises when search parameters change (only when debouncedSearchTerm changes)
  useEffect(() => {
    filterExercises()
  }, [debouncedSearchTerm, selectedBodyPart, selectedEquipment, selectedMuscle, filterExercises])

  // Since we're doing client-side filtering, we don't need the old fetchExercises function

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

  const handleViewGif = (exercise: Exercise) => {
    setSelectedGifExercise(exercise)
    setShowGifModal(true)
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

  if (loading) {
    return (
      <Card className="w-full h-full flex items-center justify-center">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading exercises...</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
        <h2 className="text-xl md:text-2xl font-semibold">Select Exercise</h2>
        <Button onClick={onClose} variant="outline" size="lg" className="h-11 px-6">
          Cancel
        </Button>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Create Custom Exercise Button/Form - Always Visible */}
          <div className="bg-background">
            {showCreateForm ? (
              <Card className="p-6 border-blue-500 border-2 shadow-lg">
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
                className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 border-2 flex items-center justify-center h-14 text-base font-medium"
              >
                <Plus className="w-6 h-6 mr-3" />
                Create Custom Exercise
              </Button>
            )}
          </div>

          {/* Search and Filters */}
          <div className="space-y-6">
            <div className="relative">
              <Search className={`absolute left-4 top-4 h-5 w-5 ${isSearching ? 'text-blue-500 animate-pulse' : 'text-muted-foreground'}`} />
              <Input
                ref={searchInputRef}
                key="exercise-search"
                placeholder="Search exercises..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-14 text-base"
              />
              <div className="text-sm text-muted-foreground">
                notes: sometimes you may need to add a - for experiences like sit-ups or push-ups
              </div>
              {isSearching && (
                <div className="absolute right-4 top-4">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                </div>
              )}
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
                className={`p-6 hover:bg-muted/50 transition-all duration-200 border-2 hover:border-blue-200 hover:shadow-md ${isCustomExercise(exercise) ? 'border-purple-200 bg-purple-50/30' : 'border-muted'}`}
              >
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                  <div className="flex-1 cursor-pointer" onClick={() => onSelect(exercise)}>
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
                      onClick={() => onSelect(exercise)}
                      className="bg-blue-600 hover:bg-blue-700 h-11 px-6 text-base font-medium"
                    >
                      Select
                    </Button>
                  </div>
                </div>
              </Card>
            ))}

            {/* Message when results are limited */}
            {exercises.length >= 20 && hasMore === false && !debouncedSearchTerm && selectedBodyPart === "all" && selectedEquipment === "all" && selectedMuscle === "all" && (
              <div className="text-center py-8 bg-green-50 border-2 border-green-200 rounded-lg">
                <p className="text-green-700 font-semibold text-lg mb-2">All exercises loaded</p>
                <p className="text-green-600 text-base">You&apos;ve reached the end of the exercise database.</p>
              </div>
            )}

            {/* Message when results are limited with filters */}
            {exercises.length >= 20 && hasMore === false && (debouncedSearchTerm || selectedBodyPart !== "all" || selectedEquipment !== "all" || selectedMuscle !== "all") && (
              <div className="text-center py-8 bg-blue-50 border-2 border-blue-200 rounded-lg">
                <p className="text-blue-700 font-semibold text-lg mb-2">All matching exercises loaded</p>
                <p className="text-blue-600 text-base">No more exercises match your current search and filter criteria.</p>
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
                  if (debouncedSearchTerm) {
                    setNewExerciseName(debouncedSearchTerm);
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white h-12 px-6 text-base"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create &quot;{debouncedSearchTerm}&quot; as Custom Exercise
              </Button>
            </div>
          )}
        </div>
      </div>

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
    </div>
  )
}
