"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Scale, TrendingUp, TrendingDown, Minus, Plus, Calendar } from "lucide-react"
import { toast } from "sonner"
import { formatWeight, formatWeightChange, getWeightUnitAbbr, weightToLbs } from "@/lib/weight-utils"
import { useUserPreferences } from "@/hooks/use-user-preferences"
import { logger } from "@/lib/logger"

interface WeightEntry {
  id: string
  weight: number
  date: string
  notes?: string
  createdAt: string
}

interface WeightStats {
  current: number
  weekChange: number
  monthChange: number
  trend: 'increasing' | 'decreasing' | 'stable'
  totalEntries: number
}

type WeightTrackerProps = Record<string, never> // Empty props

export function WeightTracker({}: WeightTrackerProps) {
  const [entries, setEntries] = useState<WeightEntry[]>([])
  const [stats, setStats] = useState<WeightStats | null>(null)
  const { units } = useUserPreferences()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  // Form state
  const [weight, setWeight] = useState("")
  const [notes, setNotes] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  // Load weight data
  useEffect(() => {
    loadWeightData()
  }, [])

  const loadWeightData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/user/weight?limit=10&days=90')
      
      if (response.ok) {
        const data = await response.json()
        setEntries(data.entries || [])
        setStats(data.stats || null)
      } else {
        toast.error('Failed to load weight data')
      }
    } catch (error) {
      logger.error('Error loading weight data:', error)
      toast.error('Failed to load weight data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveWeight = async () => {
    if (!weight || isNaN(parseFloat(weight))) {
      toast.error('Please enter a valid weight')
      return
    }

    try {
      setIsSaving(true)
      
      // Convert weight to pounds for database storage (consistent unit)
      const weightValue = parseFloat(weight)
      const weightInLbs = weightToLbs(weightValue, units)
      
      const response = await fetch('/api/user/weight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weight: weightInLbs, // Always store in lbs
          date: new Date(date).toISOString(),
          notes: notes.trim() || undefined,
        }),
      })

      if (response.ok) {
        toast.success('Weight logged successfully!')
        setWeight("")
        setNotes("")
        setDate(new Date().toISOString().split('T')[0])
        setIsDialogOpen(false)
        loadWeightData() // Refresh data
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to save weight')
      }
    } catch (error) {
      logger.error('Error saving weight:', error)
      toast.error('Failed to save weight')
    } finally {
      setIsSaving(false)
    }
  }

  // Helper functions for weight conversion - now removed since we use lib/weight-utils

  const getTrendIcon = () => {
    if (!stats) return <Minus className="w-4 h-4" />
    
    switch (stats.trend) {
      case 'increasing':
        return <TrendingUp className="w-4 h-4 text-orange-500" />
      case 'decreasing':
        return <TrendingDown className="w-4 h-4 text-green-500" />
      default:
        return <Minus className="w-4 h-4 text-gray-500" />
    }
  }

  const getTrendColor = () => {
    if (!stats) return 'text-gray-500'
    
    switch (stats.trend) {
      case 'increasing':
        return 'text-orange-600'
      case 'decreasing':
        return 'text-green-600'
      default:
        return 'text-gray-600'
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Scale className="w-4 h-4" />
            Weight Tracking
          </CardTitle>
          <CardDescription>Monitor your weight progress</CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-8">
              <Plus className="w-4 h-4 mr-1" />
              Log Weight
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Log Your Weight</DialogTitle>
              <DialogDescription>
                Add a new weight entry to track your progress
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="weight">Weight ({getWeightUnitAbbr(units)})</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  placeholder={units === 'imperial' ? "150.0" : "68.0"}
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="How are you feeling? Any changes in diet or exercise?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  disabled={isSaving}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button 
                  onClick={handleSaveWeight} 
                  disabled={isSaving || !weight}
                  className="flex-1"
                >
                  {isSaving ? 'Saving...' : 'Save Weight'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {stats && (
          <div className="space-y-4">
            {/* Current Weight */}
            <div className="text-center">
              <div className="text-2xl font-bold">
                {formatWeight(stats.current, units)}
              </div>
              <p className="text-sm text-muted-foreground">Current Weight</p>
            </div>

            {/* Progress Stats */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center">
                <div className={`font-semibold flex items-center justify-center gap-1 ${getTrendColor()}`}>
                  {getTrendIcon()}
                  {formatWeightChange(stats.weekChange, units)}
                </div>
                <p className="text-muted-foreground">This Week</p>
              </div>
              <div className="text-center">
                <div className={`font-semibold flex items-center justify-center gap-1 ${getTrendColor()}`}>
                  {getTrendIcon()}
                  {formatWeightChange(stats.monthChange, units)}
                </div>
                <p className="text-muted-foreground">This Month</p>
              </div>
            </div>

            {/* Recent Entries */}
            {entries.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Recent Entries</p>
                  <Badge variant="secondary" className="text-xs">
                    {stats.totalEntries} total
                  </Badge>
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {entries.slice(0, 3).map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between text-sm p-2 rounded-md bg-muted/50">
                      <div>
                        <span className="font-medium">{formatWeight(entry.weight, units)}</span>
                        {entry.notes && (
                          <span className="text-muted-foreground ml-2">• {entry.notes}</span>
                        )}
                      </div>
                      <div className="text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(entry.date).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!stats && entries.length === 0 && (
          <div className="text-center py-6">
            <Scale className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-3">
              No weight entries yet. Start tracking your progress!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}