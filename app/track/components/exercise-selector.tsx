"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search } from "lucide-react"

interface Exercise {
  id: string
  name: string
  description?: string
  instructions?: string
  bodyParts?: Array<{ bodyPart: { id: string; name: string } }>
  muscles?: Array<{ muscle: { id: string; name: string }; isPrimary: boolean }>
  equipments?: Array<{ equipment: { id: string; name: string } }>
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
}

export function ExerciseSelector({ onSelect, onClose }: ExerciseSelectorProps) {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [bodyParts, setBodyParts] = useState<BodyPart[]>([])
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [muscles, setMuscles] = useState<Muscle[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedBodyPart, setSelectedBodyPart] = useState<string>("all")
  const [selectedEquipment, setSelectedEquipment] = useState<string>("all")
  const [selectedMuscle, setSelectedMuscle] = useState<string>("all")

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [exercisesRes, bodyPartsRes, equipmentRes, musclesRes] = await Promise.all([
          fetch("/api/workout-tracker/exercises"),
          fetch("/api/workout-tracker/body-parts"),
          fetch("/api/workout-tracker/equipment"),
          fetch("/api/workout-tracker/muscles")
        ])

        const exercisesData = await exercisesRes.json()
        setExercises([...exercisesData.predefinedExercises, ...exercisesData.userExercises])
        
        const bodyPartsData = await bodyPartsRes.json()
        setBodyParts(bodyPartsData)
        
        const equipmentData = await equipmentRes.json()
        setEquipment(equipmentData)
        
        const musclesData = await musclesRes.json()
        setMuscles(musclesData)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const filteredExercises = exercises.filter((exercise) => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesBodyPart = selectedBodyPart === "all" || 
      exercise.bodyParts?.some(bp => bp.bodyPart.id === selectedBodyPart)
    
    const matchesEquipment = selectedEquipment === "all" || 
      exercise.equipments?.some(eq => eq.equipment.id === selectedEquipment)
    
    const matchesMuscle = selectedMuscle === "all" || 
      exercise.muscles?.some(m => m.muscle.id === selectedMuscle)

    return matchesSearch && matchesBodyPart && matchesEquipment && matchesMuscle
  })

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-full max-w-4xl mx-4 p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl mx-4 p-6 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Select Exercise</h2>
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search exercises..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Body Part</Label>
              <Select value={selectedBodyPart} onValueChange={setSelectedBodyPart}>
                <SelectTrigger>
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

            <div>
              <Label>Equipment</Label>
              <Select value={selectedEquipment} onValueChange={setSelectedEquipment}>
                <SelectTrigger>
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

            <div>
              <Label>Muscle</Label>
              <Select value={selectedMuscle} onValueChange={setSelectedMuscle}>
                <SelectTrigger>
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
        <ScrollArea className="flex-1">
          <div className="grid gap-3">
            {filteredExercises.map((exercise) => (
              <Card 
                key={exercise.id} 
                className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => onSelect(exercise)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-medium">{exercise.name}</h3>
                    {exercise.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {exercise.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {exercise.bodyParts?.map((bp) => (
                        <span 
                          key={bp.bodyPart.id}
                          className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
                        >
                          {bp.bodyPart.name}
                        </span>
                      ))}
                      {exercise.muscles?.filter(m => m.isPrimary).map((m) => (
                        <span 
                          key={m.muscle.id}
                          className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded"
                        >
                          {m.muscle.name}
                        </span>
                      ))}
                      {exercise.equipments?.map((eq) => (
                        <span 
                          key={eq.equipment.id}
                          className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded"
                        >
                          {eq.equipment.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Button size="sm">Select</Button>
                </div>
              </Card>
            ))}
          </div>

          {filteredExercises.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No exercises found matching your criteria.
            </div>
          )}
        </ScrollArea>
      </Card>
    </div>
  )
}
