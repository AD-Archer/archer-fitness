"use client"

import React, { useEffect, useState } from "react"
import { BodyDiagram } from "@/components/body-diagram"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { AlertCircle, CheckCircle2, X, Activity, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface WorkoutBodyPart {
  name: string
  slug: string
  intensity: "none" | "light" | "moderate" | "heavy"
  lastWorked?: string
  sets?: number
  sessionCount?: number
}

interface PainFeedback {
  id: string
  bodyPart: string
  severity: string
  notes?: string
  createdAt: string
}

interface RecoveryBodyDiagramProps {
  userId?: string
  timeRange?: "7days" | "30days"
  onRefresh?: () => void
  selectedDate?: Date
}

export function RecoveryBodyDiagram({ userId, timeRange = "7days", onRefresh, selectedDate }: RecoveryBodyDiagramProps) {
  const [bodyParts, setBodyParts] = useState<WorkoutBodyPart[]>([])
  const [painFeedback, setPainFeedback] = useState<PainFeedback[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [resolvingPainId, setResolvingPainId] = useState<string | null>(null)
  
  // Load saved view from localStorage
  const [activeView, setActiveView] = useState<"workout" | "pain">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("recovery-body-view")
      return (saved === "workout" || saved === "pain") ? saved : "workout"
    }
    return "workout"
  })
  
  const { toast } = useToast()

  // Save view to localStorage when it changes
  const handleViewChange = (view: "workout" | "pain") => {
    setActiveView(view)
    if (typeof window !== "undefined") {
      localStorage.setItem("recovery-body-view", view)
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch workout data
      const workoutResponse = await fetch(
        `/api/workout-tracker/body-part-summary?timeRange=${timeRange}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      )

      if (!workoutResponse.ok) {
        throw new Error("Failed to fetch body part workout data")
      }

      const workoutData = await workoutResponse.json()
      
      // Fetch pain feedback
      const painResponse = await fetch("/api/recovery/feedback")
      let painData = []
      if (painResponse.ok) {
        const data = await painResponse.json()
        // API returns { feedback: [...] }
        painData = Array.isArray(data.feedback) ? data.feedback : []
      }
      
      // Map body parts to include slug - keep workout and pain separate
      const mappedParts = (workoutData.bodyParts || []).map((part: WorkoutBodyPart) => {
        const slug = part.slug || part.name.toLowerCase().replace(/\s+/g, "_")
        
        return {
          ...part,
          slug,
        }
      })
      
      setBodyParts(mappedParts)
      setPainFeedback(painData)
    } catch (err) {
      console.error("Error fetching workout data:", err)
      setError(err instanceof Error ? err.message : "Failed to load workout data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [timeRange])

  // Filter body parts and pain feedback based on selected date
  const filteredData = React.useMemo(() => {
    if (!selectedDate) {
      return { filteredBodyParts: bodyParts, filteredPainFeedback: painFeedback }
    }

    const selectedDateString = selectedDate.toISOString().split('T')[0]
    
    // Filter body parts by lastWorked date
    const filteredParts = bodyParts.filter(part => {
      if (!part.lastWorked) return false
      const lastWorkedDate = new Date(part.lastWorked).toISOString().split('T')[0]
      return lastWorkedDate === selectedDateString
    })

    // Filter pain feedback by date
    const filteredPain = painFeedback.filter(pain => {
      if (!pain.createdAt) return false
      const painDate = new Date(pain.createdAt).toISOString().split('T')[0]
      return painDate === selectedDateString
    })

    return { filteredBodyParts: filteredParts, filteredPainFeedback: filteredPain }
  }, [bodyParts, painFeedback, selectedDate])

  const handleResolvePain = async (id: string, bodyPart: string) => {
    setResolvingPainId(id)
    try {
      const response = await fetch(`/api/recovery/feedback/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to resolve pain")
      }

      toast({
        title: "Pain resolved",
        description: `${bodyPart} pain has been marked as resolved.`,
      })

      // Refresh data
      await fetchData()
      onRefresh?.()
    } catch (error) {
      console.error("Error resolving pain:", error)
      toast({
        title: "Error",
        description: "Failed to resolve pain. Please try again.",
        variant: "destructive",
      })
    } finally {
      setResolvingPainId(null)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Body Workout & Pain Distribution</CardTitle>
          <CardDescription>Loading your recovery data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96 animate-pulse">
            <div className="w-64 h-full bg-muted/30 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return null // Silently fail - no ugly error message
  }

  // Create pain body parts for visualization - map to known body part slugs
  const painBodyParts: WorkoutBodyPart[] = filteredData.filteredPainFeedback.map(pain => {
    // Normalize the body part name to match the diagram slugs
    const normalizedName = pain.bodyPart.toLowerCase().trim()
    let slug = normalizedName.replace(/\s+/g, "-")
    
    // Map common variations to diagram slugs
    const slugMapping: Record<string, string> = {
      "back": "upper-back",
      "lower-back": "lower-back",
      "upper-back": "upper-back",
      "shoulders": "deltoids",
      "shoulder": "deltoids",
      "arms": "biceps",
      "legs": "quadriceps",
      "quads": "quadriceps",
      "glutes": "gluteal",
      "butt": "gluteal",
      "hamstrings": "hamstring",
    }
    
    slug = slugMapping[slug] || slug
    
    return {
      name: pain.bodyPart,
      slug,
      intensity: "heavy" as const, // Show all pain as red/heavy
      sets: 0,
    }
  })

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Body Distribution</CardTitle>
            <CardDescription>
              Workout activity and pain tracking
            </CardDescription>
          </div>
          <Tabs value={activeView} onValueChange={(v) => handleViewChange(v as "workout" | "pain")} className="w-auto">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="workout" className="text-xs gap-1.5">
                <Activity className="size-3.5" />
                Workout
              </TabsTrigger>
              <TabsTrigger value="pain" className="text-xs gap-1.5">
                <AlertTriangle className="size-3.5" />
                Pain
                {painFeedback.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                    {painFeedback.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeView === "pain" && filteredData.filteredPainFeedback.length > 0 && (
          <div className="flex flex-wrap gap-2 p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-lg">
            <div className="w-full flex items-center gap-2 text-sm font-medium text-rose-700 dark:text-rose-300 mb-1">
              <AlertCircle className="size-4" />
              Active Pain Areas - Click X to mark as resolved
            </div>
            {filteredData.filteredPainFeedback.map((pain) => (
              <Badge
                key={pain.id}
                variant="outline"
                className="bg-rose-100 dark:bg-rose-900/30 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 pr-1 gap-1"
              >
                {pain.bodyPart}
                {pain.severity && ` (${pain.severity})`}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-4 w-4 p-0 hover:bg-rose-200 dark:hover:bg-rose-800 ml-1"
                  onClick={() => handleResolvePain(pain.id, pain.bodyPart)}
                  disabled={resolvingPainId === pain.id}
                  title="Mark as resolved"
                >
                  {resolvingPainId === pain.id ? (
                    <span className="size-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <X className="size-3" />
                  )}
                </Button>
              </Badge>
            ))}
          </div>
        )}
        
        <div className="flex items-center justify-center overflow-auto">
          <BodyDiagram 
            bodyParts={activeView === "workout" ? filteredData.filteredBodyParts : painBodyParts} 
            size="lg"
            colors={["#0984e3", "#74b9ff", "#ef4444"]}
            interactive={false}
            dualView={true}
          />
        </div>

        {activeView === "pain" && filteredData.filteredPainFeedback.length === 0 && (
          <div className="text-center py-6">
            <CheckCircle2 className="size-10 mx-auto text-emerald-500 mb-2" />
            <p className="text-sm font-medium text-muted-foreground">No active pain alerts</p>
            <p className="text-xs text-muted-foreground mt-1">You're clear to train any muscle group</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
