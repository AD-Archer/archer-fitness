'use client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Clock, Calendar, Trash2, Eye, Archive, ArchiveRestore, CheckSquare, Square, ArrowUp } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { WorkoutDetailsModal } from "./workout-details-modal"
import { QuickViewModal } from "./quick-view-modal"
import { getPerformanceBadgeProps, type WorkoutPerformanceStatus } from "@/lib/workout-performance"
import { logger } from "@/lib/logger"
import {
  calculateCompletionRate,
  deriveDisplayStatus,
  isSessionDiscarded,
  normalizePerformanceStatus,
  type WorkoutDisplayStatus,
} from "@/lib/workout-session-status"

interface WorkoutSession {
  id: string
  name: string
  date: string | Date
  duration: number
  exercises: Array<{
    exerciseId: string
    exerciseName: string
    targetSets?: number
    targetReps?: string
    targetType?: "reps" | "time"
    sets: Array<{
      reps: number
      weight?: number
      completed: boolean
    }>
  }>
  status: "active" | "completed" | "paused" | "cancelled" | "skipped" | "in_progress"
  performanceStatus: WorkoutPerformanceStatus
  completionRate: number
  perfectionScore?: number
  notes?: string
  displayStatus: WorkoutDisplayStatus
  isDiscarded: boolean
  isArchived: boolean
}

interface ApiWorkoutSession {
  id: string
  name: string
  startTime: string
  duration: number | null
  exercises: Array<{
    exerciseId: string
    exercise: {
      id: string
      name: string
    }
    targetSets: number
    targetReps: string
    targetType?: string
    sets: Array<{
      reps: number
      weight?: number
      completed: boolean
    }>
  }>
  status: string
  performanceStatus?: string
  completionRate?: number
  perfectionScore?: number
  notes?: string
  displayStatus?: string
  isDiscarded?: boolean
  isArchived?: boolean
}

export function WorkoutHistory({ onRepeatWorkout }: { onRepeatWorkout?: (workout: WorkoutSession) => void }) {
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutSession[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutSession | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const [selectedWorkouts, setSelectedWorkouts] = useState<Set<string>>(new Set())
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  
  // Advanced filter states
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [minExercises, setMinExercises] = useState("")
  const [maxExercises, setMaxExercises] = useState("")
  const [minScore, setMinScore] = useState("")
  const [maxScore, setMaxScore] = useState("")
  const [minCompletion, setMinCompletion] = useState("")
  const [maxCompletion, setMaxCompletion] = useState("")

  const fetchWorkoutHistory = useCallback(async (fetchAll: boolean) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: fetchAll ? "50" : "10" })
      if (fetchAll) {
        params.set("visibility", "all")
      }

      const response = await fetch(`/api/workout-tracker/workout-sessions?${params.toString()}`)
      if (!response.ok) {
        throw new Error(`Failed to load workout history: ${response.status}`)
      }

      const data: ApiWorkoutSession[] = await response.json()

      const transformedData = data
        .filter((session) => session.status !== "cancelled")
        .map((session) => {
          const exercises = session.exercises?.map(ex => ({
            exerciseId: ex.exerciseId,
            exerciseName: ex.exercise?.name || 'Unknown Exercise',
            targetSets: ex.targetSets ?? 0,
            targetReps: ex.targetReps,
            targetType: (ex.targetType as "reps" | "time") || "reps",
            sets: (ex.sets || []).map(set => ({
              reps: set.reps,
              weight: set.weight,
              completed: set.completed,
            }))
          })) || []

          const completionRate = typeof session.completionRate === "number"
            ? session.completionRate
            : calculateCompletionRate(exercises)

          const normalizedPerformance = normalizePerformanceStatus(
            session.performanceStatus,
            completionRate,
            session.perfectionScore
          )

          const displayStatus = deriveDisplayStatus({
            rawStatus: session.status,
            completionRate,
            performanceStatus: normalizedPerformance,
            perfectionScore: session.perfectionScore,
          })

          const isDiscarded = typeof session.isDiscarded === "boolean"
            ? session.isDiscarded
            : isSessionDiscarded()

          return {
            id: session.id,
            name: session.name,
            date: session.startTime,
            duration: session.duration || 0,
            exercises,
            status: session.status as WorkoutSession["status"],
            performanceStatus: normalizedPerformance,
            completionRate,
            perfectionScore: session.perfectionScore ?? undefined,
            notes: session.notes,
            displayStatus,
            isDiscarded,
            isArchived: session.isArchived ?? false,
          }
        })

      setWorkoutHistory(transformedData)
    } catch (error) {
      logger.error('Failed to fetch workout history:', error)
      toast.error('Unable to load workout history right now.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWorkoutHistory(true)
  }, [fetchWorkoutHistory])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    return `${mins} min`
  }

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const calculateWorkoutStats = (workout: WorkoutSession) => {
    const totalSets = workout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0)
    const totalReps = workout.exercises.reduce((sum, ex) =>
      sum + ex.sets.reduce((setSum, set) => setSum + (set.completed ? set.reps : 0), 0), 0)
    const avgWeight = workout.exercises.length > 0
      ? workout.exercises.reduce((sum, ex) =>
          sum + ex.sets.reduce((setSum, set) => setSum + (set.weight || 0), 0), 0) / totalSets
      : 0

    return {
      exercises: workout.exercises.length,
      totalSets,
      totalReps,
      avgWeight: avgWeight > 0 ? avgWeight : undefined,
    }
  }

  const handleDeleteWorkout = async (workoutId: string) => {
    try {
      // Check if workout is archived before deletion
      const workout = workoutHistory.find(w => w.id === workoutId)
      if (!workout?.isArchived) {
        toast.error('Only archived workouts can be deleted. Please archive it first.')
        return
      }

      const response = await fetch(`/api/workout-tracker/workout-sessions/${workoutId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setWorkoutHistory(prev => prev.filter(workout => workout.id !== workoutId))
        toast.success('Workout deleted successfully')
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete workout')
      }
    } catch (error) {
      logger.error('Failed to delete workout:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete workout')
    }
  }

  const handleArchiveWorkout = async (workoutId: string) => {
    try {
      const response = await fetch(`/api/workout-tracker/workout-sessions/${workoutId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: true }),
      })

      if (response.ok) {
        setWorkoutHistory(prev => 
          prev.map(workout => 
            workout.id === workoutId 
              ? { ...workout, isArchived: true } 
              : workout
          )
        )
        toast.success('Workout archived successfully')
      } else {
        throw new Error('Failed to archive workout')
      }
    } catch (error) {
      logger.error('Failed to archive workout:', error)
      toast.error('Failed to archive workout')
    }
  }

  const handleUnarchiveWorkout = async (workoutId: string) => {
    try {
      const response = await fetch(`/api/workout-tracker/workout-sessions/${workoutId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: false }),
      })

      if (response.ok) {
        setWorkoutHistory(prev => 
          prev.map(workout => 
            workout.id === workoutId 
              ? { ...workout, isArchived: false } 
              : workout
          )
        )
        toast.success('Workout unarchived successfully')
      } else {
        throw new Error('Failed to unarchive workout')
      }
    } catch (error) {
      logger.error('Failed to unarchive workout:', error)
      toast.error('Failed to unarchive workout')
    }
  }

  const handleBulkDelete = async () => {
    try {
      await Promise.all(
        Array.from(selectedWorkouts).map(id =>
          fetch(`/api/workout-tracker/workout-sessions/${id}`, {
            method: 'DELETE',
          })
        )
      )

      setWorkoutHistory(prev => prev.filter(workout => !selectedWorkouts.has(workout.id)))
      setSelectedWorkouts(new Set())
      setIsSelectionMode(false)
      toast.success(`Deleted ${selectedWorkouts.size} workout(s) successfully`)
    } catch (error) {
      logger.error('Failed to delete workouts:', error)
      toast.error('Failed to delete some workouts')
    }
  }

  const handleBulkArchive = async () => {
    try {
      await Promise.all(
        Array.from(selectedWorkouts).map(id =>
          fetch(`/api/workout-tracker/workout-sessions/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isArchived: true }),
          })
        )
      )

      setWorkoutHistory(prev => 
        prev.map(workout => 
          selectedWorkouts.has(workout.id) 
            ? { ...workout, isArchived: true } 
            : workout
        )
      )
      setSelectedWorkouts(new Set())
      setIsSelectionMode(false)
      toast.success(`Archived ${selectedWorkouts.size} workout(s) successfully`)
    } catch (error) {
      logger.error('Failed to archive workouts:', error)
      toast.error('Failed to archive some workouts')
    }
  }

  const handleBulkUnarchive = async () => {
    try {
      await Promise.all(
        Array.from(selectedWorkouts).map(id =>
          fetch(`/api/workout-tracker/workout-sessions/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isArchived: false }),
          })
        )
      )

      setWorkoutHistory(prev => 
        prev.map(workout => 
          selectedWorkouts.has(workout.id) 
            ? { ...workout, isArchived: false } 
            : workout
        )
      )
      setSelectedWorkouts(new Set())
      setIsSelectionMode(false)
      toast.success(`Unarchived ${selectedWorkouts.size} workout(s) successfully`)
    } catch (error) {
      logger.error('Failed to unarchive workouts:', error)
      toast.error('Failed to unarchive some workouts')
    }
  }

  const toggleWorkoutSelection = (workoutId: string) => {
    setSelectedWorkouts(prev => {
      const newSet = new Set(prev)
      if (newSet.has(workoutId)) {
        newSet.delete(workoutId)
      } else {
        newSet.add(workoutId)
      }
      return newSet
    })
  }

  const selectByCriteria = () => {
    const filtered = applyFilters()
    const newSelected = new Set(selectedWorkouts)
    filtered.forEach(workout => {
      if (workout.isArchived) {
        newSelected.add(workout.id)
      }
    })
    setSelectedWorkouts(newSelected)
    toast.success(`Selected ${newSelected.size} workouts matching criteria`)
  }

  const selectAllVisible = () => {
    const filtered = applyFilters()
    const archivedFiltered = filtered.filter(w => w.isArchived)
    const newSelected = new Set(archivedFiltered.map(w => w.id))
    setSelectedWorkouts(newSelected)
    toast.success(`Selected all ${newSelected.size} visible workouts`)
  }

  const deselectAll = () => {
    setSelectedWorkouts(new Set())
    toast.success('Deselected all workouts')
  }

  const clearFilters = () => {
    setSearchQuery("")
    setDateFrom("")
    setDateTo("")
    setMinExercises("")
    setMaxExercises("")
    setMinScore("")
    setMaxScore("")
    setMinCompletion("")
    setMaxCompletion("")
  }

  const applyFilters = () => {
    return workoutHistory.filter(workout => {
      // Archive status filter
      if (showArchived ? !workout.isArchived : workout.isArchived) {
        return false
      }

      // Search query filter
      const searchLower = searchQuery.toLowerCase()
      const matchesSearch = !searchQuery || 
        workout.name?.toLowerCase().includes(searchLower) ||
        workout.exercises.some(ex => ex.exerciseName?.toLowerCase().includes(searchLower))

      if (!matchesSearch) return false

      // Date range filter
      if (dateFrom) {
        const workoutDate = new Date(workout.date)
        const fromDate = new Date(dateFrom)
        if (workoutDate < fromDate) return false
      }
      if (dateTo) {
        const workoutDate = new Date(workout.date)
        const toDate = new Date(dateTo)
        toDate.setHours(23, 59, 59, 999) // End of day
        if (workoutDate > toDate) return false
      }

      // Exercise count filter
      const exerciseCount = workout.exercises.length
      if (minExercises && exerciseCount < parseInt(minExercises)) return false
      if (maxExercises && exerciseCount > parseInt(maxExercises)) return false

      // Score filter
      const score = workout.perfectionScore || 0
      if (minScore && score < parseInt(minScore)) return false
      if (maxScore && score > parseInt(maxScore)) return false

      // Completion percentage filter
      const completion = workout.completionRate || 0
      if (minCompletion && completion < parseInt(minCompletion)) return false
      if (maxCompletion && completion > parseInt(maxCompletion)) return false

      return true
    })
  }

  const handleRepeatWorkout = async (workoutId: string) => {
    try {
      const response = await fetch(`/api/workout-tracker/workout-sessions/${workoutId}/repeat`, {
        method: 'POST',
      })

      if (response.ok) {
        await response.json() // Consume the response but don't store it
        toast.success('Workout repeated! Redirecting to track...')
        
        // Redirect to track page after a short delay to show the toast
        setTimeout(() => {
          window.location.href = '/track'
        }, 1000)
        
        // Call the onRepeatWorkout callback if provided (for legacy support)
        if (onRepeatWorkout) {
          const workout = workoutHistory.find(w => w.id === workoutId)
          if (workout) {
            onRepeatWorkout(workout)
          }
        }
      } else {
        throw new Error('Failed to repeat workout')
      }
    } catch (error) {
      logger.error('Failed to repeat workout:', error)
      toast.error('Failed to repeat workout')
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Workout History
          </CardTitle>
          <CardDescription>Your recent training sessions and performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Loading workout history...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Workout History
            </CardTitle>
            <CardDescription>Your recent training sessions and performance</CardDescription>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsSelectionMode(!isSelectionMode)
                setSelectedWorkouts(new Set())
              }}
            >
              {isSelectionMode ? 'Cancel Selection' : 'Select Multiple'}
            </Button>
            
            {isSelectionMode && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAllVisible}
                >
                  Select All Visible
                </Button>
                {selectedWorkouts.size > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={deselectAll}
                  >
                    Deselect All
                  </Button>
                )}
              </>
            )}
            
            {isSelectionMode && selectedWorkouts.size > 0 && (
              <>
                {/* Archive button - only show if viewing active workouts */}
                {!showArchived && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkArchive}
                    className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                  >
                    <Archive className="w-4 h-4 mr-2" />
                    Archive ({selectedWorkouts.size})
                  </Button>
                )}
                
                {/* Unarchive button - only show if viewing archived workouts */}
                {showArchived && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkUnarchive}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <ArchiveRestore className="w-4 h-4 mr-2" />
                    Unarchive ({selectedWorkouts.size})
                  </Button>
                )}
                
                {/* Delete button - always available */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete ({selectedWorkouts.size})
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Selected Workouts</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete {selectedWorkouts.size} workout(s)? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleBulkDelete}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete Selected
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Search and Filter Bar */}
          <div className="space-y-3">
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <Input
                  type="text"
                  placeholder="Search workouts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button
                variant={showArchived ? "default" : "outline"}
                onClick={() => setShowArchived(!showArchived)}
              >
                {showArchived ? "Show Active" : "View Archive"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                {showAdvancedFilters ? "Hide Filters" : "More Filters"}
              </Button>
            </div>

            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <div className="p-4 border rounded-lg space-y-4 bg-muted/30">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Date Range */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date From</label>
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date To</label>
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                    />
                  </div>

                  {/* Exercise Count */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Min Exercises</label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="e.g., 3"
                      value={minExercises}
                      onChange={(e) => setMinExercises(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Max Exercises</label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="e.g., 10"
                      value={maxExercises}
                      onChange={(e) => setMaxExercises(e.target.value)}
                    />
                  </div>

                  {/* Perfection Score */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Min Score</label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="0-100"
                      value={minScore}
                      onChange={(e) => setMinScore(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Max Score</label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="0-100"
                      value={maxScore}
                      onChange={(e) => setMaxScore(e.target.value)}
                    />
                  </div>

                  {/* Completion Rate */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Min Completion %</label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="0-100"
                      value={minCompletion}
                      onChange={(e) => setMinCompletion(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Max Completion %</label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="0-100"
                      value={maxCompletion}
                      onChange={(e) => setMaxCompletion(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                  >
                    Clear All Filters
                  </Button>
                  {showArchived && isSelectionMode && (
                    <Button
                      variant="default"
                      onClick={selectByCriteria}
                    >
                      Select Matching
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {workoutHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No workout history found. Start your first workout!</p>
            </div>
          ) : (
            <>
              {(() => {
                // Apply all filters
                const filteredWorkouts = applyFilters()

                if (filteredWorkouts.length === 0) {
                  return (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>{showArchived ? "No archived workouts found." : "No active workouts found."}</p>
                    </div>
                  )
                }

                return filteredWorkouts.map((workout, idx) => {
              const stats = calculateWorkoutStats(workout)
              const completionRateValue = workout.completionRate
              const roundedCompletionRate = Math.round(completionRateValue)
              const hasNewerStarted = workoutHistory.some((w, i) => i < idx && new Date(w.date).getTime() > new Date(workout.date).getTime())
              const containerClasses = `p-4 rounded-lg border transition-colors ${
                workout.isDiscarded ? "bg-muted/40 border-dashed" : "bg-card/50 hover:bg-card/80"
              }`

              return (
                <div key={workout.id} className={containerClasses}>
                  {isSelectionMode && (
                    <div className="mb-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => toggleWorkoutSelection(workout.id)}
                      >
                        {selectedWorkouts.has(workout.id) ? (
                          <CheckSquare className="w-4 h-4 mr-2" />
                        ) : (
                          <Square className="w-4 h-4 mr-2" />
                        )}
                        {selectedWorkouts.has(workout.id) ? 'Selected' : 'Select'}
                      </Button>
                    </div>
                  )}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-foreground">{workout.name}</h3>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(workout.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDuration(workout.duration)}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      {(() => {
                        const badgeProps = getPerformanceBadgeProps(workout.performanceStatus)
                        return (
                          <Badge className={badgeProps.className}>
                            <span className="mr-1">{badgeProps.icon}</span>
                            {badgeProps.text}
                          </Badge>
                        )
                      })()}
                      {workout.isArchived && (
                        <Badge variant="outline" className="border-yellow-400 text-yellow-700 bg-yellow-50 dark:bg-yellow-900/30 dark:text-yellow-200">
                          Archived
                        </Badge>
                      )}
                      {(roundedCompletionRate > 0 || workout.perfectionScore !== undefined) && (
                        <div className="text-xs text-muted-foreground text-right">
                          {roundedCompletionRate}% complete
                          {workout.perfectionScore !== undefined && (
                            <>
                              <br />Score: {Math.round(workout.perfectionScore)}/100
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div className="text-center p-2 rounded bg-muted/50">
                      <div className="text-lg font-semibold text-blue-600">{stats.exercises}</div>
                      <div className="text-xs text-muted-foreground">Exercises</div>
                    </div>
                    <div className="text-center p-2 rounded bg-muted/50">
                      <div className="text-lg font-semibold text-green-600">{stats.totalSets}</div>
                      <div className="text-xs text-muted-foreground">Sets</div>
                    </div>
                    <div className="text-center p-2 rounded bg-muted/50">
                      <div className="text-lg font-semibold text-purple-600">{stats.totalReps}</div>
                      <div className="text-xs text-muted-foreground">Reps</div>
                    </div>
                    <div className="text-center p-2 rounded bg-muted/50">
                      <div className="text-lg font-semibold text-orange-600">
                        {stats.avgWeight ? stats.avgWeight.toFixed(1) : "—"}
                      </div>
                      <div className="text-xs text-muted-foreground">Avg Weight</div>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {!isSelectionMode && (
                      <>
                        <QuickViewModal
                          workout={workout}
                          hasNewerStarted={hasNewerStarted}
                          trigger={
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4 mr-2" />
                              Quick View
                            </Button>
                          }
                        />
                        <WorkoutDetailsModal
                          workout={selectedWorkout}
                          onRepeat={
                            onRepeatWorkout
                              ? (session) => {
                                  const matched = workoutHistory.find((candidate) => candidate.id === session.id)
                                  if (matched) {
                                    onRepeatWorkout(matched)
                                  }
                                }
                              : undefined
                          }
                          trigger={
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedWorkout(workout)}
                            >
                              View Details
                            </Button>
                          }
                        />
                        <Button variant="outline" size="sm" onClick={() => handleRepeatWorkout(workout.id)}>
                          Repeat Workout
                        </Button>
                        
                        {workout.isArchived ? (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleUnarchiveWorkout(workout.id)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <ArchiveRestore className="w-4 h-4 mr-2" />
                            Unarchive
                          </Button>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleArchiveWorkout(workout.id)}
                            className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                          >
                            <Archive className="w-4 h-4 mr-2" />
                            Archive
                          </Button>
                        )}

                        {workout.isArchived && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Workout</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this workout? This action cannot be undone.
                                  <br />
                                  <strong>{workout.name}</strong> from {formatDate(workout.date)}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteWorkout(workout.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete Workout
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )
            })
              })()}
            </>
          )}
        </div>
      </CardContent>

      {/* Fixed Back to Top Button - Bottom Left */}
      {workoutHistory.length > 5 && (
        <Button
          variant="default"
          size="icon"
          className="fixed bottom-6 right-6 z-50 shadow-lg rounded-full w-12 h-12"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          title="Back to Top"
        >
          <ArrowUp className="w-5 h-5" />
        </Button>
      )}
    </Card>
  )
}
