"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Plus, Trash2 } from "lucide-react"

interface Exercise {
  id: string
  name: string
  description?: string
  instructions?: string
  bodyParts?: Array<{ bodyPart: { id: string; name: string } }>
  muscles?: Array<{ muscle: { id: string; name: string }; isPrimary: boolean }>
  equipments?: Array<{ equipment: { id: string; name: string } }>
  isCustom?: boolean
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

interface ExerciseSelectorProps {
  onSelect: (exercise: Exercise) => void
  onClose: () => void
  embedded?: boolean
}

export function ExerciseSelector({ onSelect, onClose, embedded = false }: ExerciseSelectorProps) {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [bodyParts, setBodyParts] = useState<BodyPart[]>([])
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [muscles, setMuscles] = useState<Muscle[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedBodyPart, setSelectedBodyPart] = useState<string>("all")
  const [selectedEquipment, setSelectedEquipment] = useState<string>("all")
  const [selectedMuscle, setSelectedMuscle] = useState<string>("all")
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newExerciseName, setNewExerciseName] = useState("")
  const [newExerciseDescription, setNewExerciseDescription] = useState("")
  const [savingCustomExercise, setSavingCustomExercise] = useState(false)

  // Function to fetch exercises with search parameters
  const fetchExercises = async (params: Record<string, string> = {}) => {
    setLoading(true)
    try {
      // Build query string from params
      const queryString = Object.entries(params)
        .filter(([, value]) => value !== "all" && value !== "")
        .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
        .join("&")

      // Only use a higher limit when filters are applied
      const hasFilters = Object.keys(params).some(key => 
        key !== 'limit' && params[key] !== 'all' && params[key] !== '');
      const limit = hasFilters ? 100 : 30; // Limit to 30 when no filters are applied
      
      const url = `/api/workout-tracker/exercises?${queryString}&limit=${limit}`
      
      const response = await fetch(url)
      const data = await response.json()
      
      // Combine user exercises and predefined exercises
      setExercises([...data.userExercises, ...data.predefinedExercises])
    } catch (error) {
      console.error("Error fetching exercises:", error)
    } finally {
      setLoading(false)
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
      console.error("Error fetching filter options:", error)
    }
  }

  // Initial data load
  useEffect(() => {
    fetchFilterOptions()
    fetchExercises()
  }, [])

  // Fetch exercises when search parameters change
  useEffect(() => {
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

      fetchExercises(params)
    }, 300) // 300ms debounce

    return () => clearTimeout(debounceTimer)
  }, [searchTerm, selectedBodyPart, selectedEquipment, selectedMuscle])

  // Since we're doing server-side filtering, we don't need to filter exercises on client
  // but we'll keep this variable for consistency
  const filteredExercises = exercises;

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
        console.error("Failed to create custom exercise")
      }
    } catch (error) {
      console.error("Error creating custom exercise:", error)
    } finally {
      setSavingCustomExercise(false)
    }
  }

  const handleDeleteExercise = async (id: string) => {
    if (!confirm("Are you sure you want to delete this custom exercise?")) return
    
    try {
      const response = await fetch(`/api/workout-tracker/exercises/custom/${id}`, {
        method: "DELETE",
      })
      
      if (response.ok) {
        setExercises(prev => prev.filter(ex => ex.id !== id))
      } else {
        console.error("Failed to delete custom exercise")
      }
    } catch (error) {
      console.error("Error deleting custom exercise:", error)
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

  if (loading) {
    return (
      <Card className={embedded ? "w-full h-full flex items-center justify-center border-0 shadow-none" : "w-full h-full flex items-center justify-center"}>
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading exercises...</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className={embedded ? "w-full border-0 shadow-none h-full flex flex-col" : "w-full h-full border-0 shadow-none flex flex-col"}>
      {!embedded && (
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
          <h2 className="text-xl md:text-2xl font-semibold">Select Exercise</h2>
          <Button onClick={onClose} variant="outline" size="lg" className="h-11 px-6">
            Cancel
          </Button>
        </div>
      )}

      {/* Scrollable Content Area */}
      <ScrollArea className="flex-1 min-h-0">
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
              <Search className="absolute left-4 top-4 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search exercises..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-14 text-base"
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
            {filteredExercises.map((exercise) => (
              <Card
                key={exercise.id}
                className={`p-6 hover:bg-muted/50 transition-all duration-200 border-2 hover:border-blue-200 hover:shadow-md ${isCustomExercise(exercise) ? 'border-purple-200 bg-purple-50/30' : 'border-muted'}`}
              >
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                  <div className="flex-1 cursor-pointer" onClick={() => onSelect(exercise)}>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{exercise.name}</h3>
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
            {filteredExercises.length === 30 && !searchTerm && selectedBodyPart === "all" && selectedEquipment === "all" && selectedMuscle === "all" && (
              <div className="text-center py-8 bg-amber-50 border-2 border-amber-200 rounded-lg">
                <p className="text-amber-700 font-semibold text-lg mb-2">Showing limited results</p>
                <p className="text-amber-600 text-base">Use the search or filters above to narrow down exercises and see more specific results.</p>
              </div>
            )}
          </div>

          {filteredExercises.length === 0 && (
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
      </ScrollArea>
    </Card>
  )
}
