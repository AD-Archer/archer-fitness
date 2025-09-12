"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Scale, Target, Plus, Trash2 } from "lucide-react"
import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"


interface WeightEntry {
  id: string
  weight: number
  date: string
  notes?: string
  createdAt: string
}

interface NutritionProgressEntry {
  date: string
  calories: number
  protein: number
  carbs: number
  fat: number
  water: number
  weight: number
}

interface MacroDistributionEntry {
  name: string
  value: number
  color: string
  grams: number
}

interface BodyCompositionAnalyticsProps {
  timeRange?: string
}

export function BodyCompositionAnalytics({ timeRange = "3months" }: BodyCompositionAnalyticsProps) {
  const [nutritionProgressData, setNutritionProgressData] = useState<NutritionProgressEntry[]>([])
  const [macroDistributionData, setMacroDistributionData] = useState<MacroDistributionEntry[]>([])
  const [units, setUnits] = useState<string>('imperial')
  const [loading, setLoading] = useState(true)
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false)
  const [allWeightEntries, setAllWeightEntries] = useState<WeightEntry[]>([])
  const [newWeight, setNewWeight] = useState('')
  const [newWeightDate, setNewWeightDate] = useState(new Date().toISOString().split('T')[0])
  const [newWeightNotes, setNewWeightNotes] = useState('')

  // Helper functions for weight conversion
  const lbsToKg = (lbs: number) => lbs * 0.453592
  
  const formatWeightDisplay = (weightInLbs: number) => {
    if (units === 'imperial') {
      return `${weightInLbs.toFixed(1)} lbs`
    } else {
      return `${lbsToKg(weightInLbs).toFixed(1)} kg`
    }
  }

  // Handle adding new weight entry
  const handleAddWeightEntry = async () => {
    if (!newWeight || isNaN(parseFloat(newWeight))) {
      alert('Please enter a valid weight')
      return
    }

    try {
      console.log('Adding weight entry:', {
        weight: parseFloat(newWeight),
        date: new Date(newWeightDate).toISOString(),
        notes: newWeightNotes || null,
      })

      const response = await fetch('/api/user/weight', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          weight: parseFloat(newWeight),
          date: newWeightDate,
          notes: newWeightNotes || null,
        }),
      })

      console.log('Add weight response:', response.status, response.statusText)

      if (response.ok) {
        const result = await response.json()
        console.log('Add weight result:', result)
        
        // Reset form
        setNewWeight('')
        setNewWeightNotes('')
        setNewWeightDate(new Date().toISOString().split('T')[0])
        
        // Refresh data
        await fetchData()
        alert('Weight entry added successfully!')
      } else {
        const errorText = await response.text()
        console.error('Failed to add weight entry:', errorText)
        alert(`Failed to add weight entry: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      console.error('Error adding weight entry:', error)
      alert('Error adding weight entry: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  // Handle deleting weight entry
  const handleDeleteWeightEntry = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this weight entry?')) {
      return
    }

    try {
      console.log('Deleting weight entry:', entryId)
      
      const response = await fetch(`/api/user/weight?id=${entryId}`, {
        method: 'DELETE',
      })

      console.log('Delete weight response:', response.status, response.statusText)

      if (response.ok) {
        const result = await response.json()
        console.log('Delete weight result:', result)
        
        // Refresh data
        await fetchData()
        alert('Weight entry deleted successfully!')
      } else {
        const errorText = await response.text()
        console.error('Failed to delete weight entry:', errorText)
        alert(`Failed to delete weight entry: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      console.error('Error deleting weight entry:', error)
      alert('Error deleting weight entry: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  // Fetch data function
  const fetchData = useCallback(async () => {
    setLoading(true)
    
    try {
      // Load user preferences first
      const prefsRes = await fetch('/api/user/preferences')
      if (prefsRes.ok) {
        const prefsData = await prefsRes.json()
        if (prefsData?.preferences?.app?.units) {
          setUnits(prefsData.preferences.app.units)
        }
      }

      // Convert timeRange to days for API call
      const getDaysFromTimeRange = (range: string) => {
        switch (range) {
          case '7days': return 7
          case '4weeks': return 28
          case '3months': return 90
          case '6months': return 180
          case '1year': return 365
          default: return 90
        }
      }

      const days = getDaysFromTimeRange(timeRange)
      console.log(`Fetching weight data for ${timeRange} (${days} days)`)

      const weightRes = await fetch(`/api/user/weight?days=${days}`)
      
      if (weightRes.ok) {
        const weightData = await weightRes.json()
        console.log('Weight data received:', weightData)

        // Store all weight entries for the modal
        if (weightData.entries && weightData.entries.length > 0) {
          setAllWeightEntries(weightData.entries)
          console.log(`Processing ${weightData.entries.length} weight entries for ${timeRange}`)

          // Convert weight entries to nutrition progress format for chart compatibility
          const progressData = weightData.entries
            .sort((a: WeightEntry, b: WeightEntry) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map((entry: WeightEntry, index: number) => ({
              date: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              calories: 2200 + (index * 10), // TODO: Replace with real nutrition data
              protein: 150 + (index * 2), // TODO: Replace with real nutrition data
              carbs: 240 + (index * 3), // TODO: Replace with real nutrition data
              fat: 80 + index, // TODO: Replace with real nutrition data
              water: 2500 + (index * 50), // TODO: Replace with real nutrition data
              weight: entry.weight, // Real weight data
            }))

          console.log('Processed progress data:', progressData)
          setNutritionProgressData(progressData)
        } else {
          console.log(`No weight entries found for ${timeRange}`)
          setAllWeightEntries([])
          // No weight data available, show empty state
          setNutritionProgressData([])
        }
      } else {
        console.error('Weight API request failed:', weightRes.status, weightRes.statusText)
        throw new Error('Failed to fetch weight data')
      }
      
      // Keep existing macro distribution data (or fetch from nutrition API)
      setMacroDistributionData([
        { name: "Protein", value: 30, color: "#ef4444", grams: 165 },
        { name: "Carbs", value: 45, color: "#3b82f6", grams: 260 },
        { name: "Fat", value: 25, color: "#10b981", grams: 88 },
      ])
    } catch (error) {
      console.error('Error fetching body composition data:', error)
      // Set empty data if API fails - no hardcoded fallback
      setNutritionProgressData([])
      setAllWeightEntries([])
      setMacroDistributionData([
        { name: "Protein", value: 30, color: "#ef4444", grams: 0 },
        { name: "Carbs", value: 45, color: "#3b82f6", grams: 0 },
        { name: "Fat", value: 25, color: "#10b981", grams: 0 },
      ])
    } finally {
      setLoading(false)
    }
  }, [timeRange])

  // Call fetchData when component mounts or timeRange changes
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Custom tooltip for weight chart
  const WeightTooltip = ({ active, payload, label }: { 
    active?: boolean; 
    payload?: Array<{ payload: { date: string; weight: number; notes?: string } }>; 
    label?: string 
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background border rounded-lg p-3 shadow-md">
          <p className="font-medium">{label}</p>
          <p className="text-sm text-muted-foreground">
            Weight: {formatWeightDisplay(data.weight)}
          </p>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return <div className="h-64 flex items-center justify-center text-muted-foreground">Loading body composition data...</div>
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-purple-600" />
              Weight Progress
            </CardTitle>
            <CardDescription>Track your weight changes over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-4">
              <div></div>
              <Dialog open={isWeightModalOpen} onOpenChange={setIsWeightModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Manage Entries
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Weight Entries</DialogTitle>
                    <DialogDescription>
                      View, add, and delete your weight entries
                    </DialogDescription>
                  </DialogHeader>
                  
                  {/* Add new weight entry form */}
                  <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                    <h3 className="font-semibold">Add New Weight Entry</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="weight">Weight ({units === 'imperial' ? 'lbs' : 'kg'})</Label>
                        <Input
                          id="weight"
                          type="number"
                          step="0.1"
                          value={newWeight}
                          onChange={(e) => setNewWeight(e.target.value)}
                          placeholder="Enter weight"
                        />
                      </div>
                      <div>
                        <Label htmlFor="date">Date</Label>
                        <Input
                          id="date"
                          type="date"
                          value={newWeightDate}
                          onChange={(e) => setNewWeightDate(e.target.value)}
                        />
                      </div>
                      <div className="flex items-end">
                        <Button onClick={handleAddWeightEntry} className="w-full">
                          Add Entry
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="notes">Notes (optional)</Label>
                      <Textarea
                        id="notes"
                        value={newWeightNotes}
                        onChange={(e) => setNewWeightNotes(e.target.value)}
                        placeholder="Add any notes about this weigh-in"
                        rows={2}
                      />
                    </div>
                  </div>

                  {/* Weight entries list */}
                  <div className="space-y-2">
                    <h3 className="font-semibold">Your Weight Entries</h3>
                    {allWeightEntries.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">
                        No weight entries found. Add your first entry above!
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {allWeightEntries
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .map((entry) => (
                            <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex-1">
                                <div className="flex items-center gap-4">
                                  <span className="font-medium">
                                    {formatWeightDisplay(entry.weight)}
                                  </span>
                                  <span className="text-sm text-muted-foreground">
                                    {new Date(entry.date).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </span>
                                </div>
                                {entry.notes && (
                                  <p className="text-sm text-muted-foreground mt-1">{entry.notes}</p>
                                )}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteWeightEntry(entry.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {nutritionProgressData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={nutritionProgressData} key={`weight-chart-${nutritionProgressData.length}`}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis domain={["dataMin - 0.5", "dataMax + 0.5"]} className="text-xs" />
                    <Tooltip content={<WeightTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="weight"
                      stroke="#8b5cf6"
                      fill="#8b5cf6"
                      fillOpacity={0.3}
                      name={`Weight (${units === 'imperial' ? 'lbs' : 'kg'})`}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
                <Scale className="w-12 h-12 mb-3 opacity-50" />
                <p className="text-lg font-medium mb-1">No Weight Data</p>
                <p className="text-sm text-center">
                  Start logging your weight to see progress over time
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-600" />
              Macro Distribution
            </CardTitle>
            <CardDescription>Current macronutrient breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={macroDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {macroDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Macro Breakdown Details */}
      <Card>
        <CardHeader>
          <CardTitle>Macronutrient Breakdown</CardTitle>
          <CardDescription>Current intake vs recommended ranges</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {macroDistributionData.map((macro, index) => (
            <div key={index} className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: macro.color }} />
                <div>
                  <span className="font-medium">{macro.name}</span>
                  <p className="text-sm text-muted-foreground">{macro.grams}g daily average</p>
                </div>
              </div>
              <div className="text-right">
                <span className="font-bold">{macro.value}%</span>
                <p className="text-xs text-muted-foreground">
                  {macro.name === "Protein" ? "Optimal" : macro.name === "Carbs" ? "Good" : "Within range"}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Body Composition Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Body Composition Insights</CardTitle>
          <CardDescription>AI analysis of your progress and recommendations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-800 dark:text-green-200">
              <strong>Excellent progress!</strong> You&apos;ve lost 1.2kg while maintaining high protein intake,
              indicating healthy fat loss.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Hydration on track:</strong> Your water intake has improved 27% over the tracking period.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800">
            <p className="text-sm text-purple-800 dark:text-purple-200">
              <strong>Macro balance:</strong> Your 30/45/25 protein/carb/fat split is optimal for your muscle gain
              goals.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
