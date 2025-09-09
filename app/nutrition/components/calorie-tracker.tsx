"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Trash2, Target, TrendingUp, Apple, Droplets, Minus } from "lucide-react"

interface FoodItem {
  id: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  serving: string
}

interface LoggedFood extends FoodItem {
  quantity: number
  meal: string
  timestamp: Date
}

interface WaterEntry {
  id: string
  amount: number
  timestamp: Date
}

const SAMPLE_FOODS: FoodItem[] = [
  { id: "1", name: "Chicken Breast", calories: 165, protein: 31, carbs: 0, fat: 3.6, serving: "100g" },
  { id: "2", name: "Brown Rice", calories: 111, protein: 2.6, carbs: 23, fat: 0.9, serving: "100g" },
  { id: "3", name: "Broccoli", calories: 34, protein: 2.8, carbs: 7, fat: 0.4, serving: "100g" },
  { id: "4", name: "Banana", calories: 89, protein: 1.1, carbs: 23, fat: 0.3, serving: "1 medium" },
  { id: "5", name: "Greek Yogurt", calories: 59, protein: 10, carbs: 3.6, fat: 0.4, serving: "100g" },
  { id: "6", name: "Almonds", calories: 579, protein: 21, carbs: 22, fat: 50, serving: "100g" },
  { id: "7", name: "Salmon", calories: 208, protein: 20, carbs: 0, fat: 13, serving: "100g" },
  { id: "8", name: "Sweet Potato", calories: 86, protein: 1.6, carbs: 20, fat: 0.1, serving: "100g" },
]

export function CalorieTracker() {
  const [loggedFoods, setLoggedFoods] = useState<LoggedFood[]>([])
  const [waterEntries, setWaterEntries] = useState<WaterEntry[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedMeal, setSelectedMeal] = useState("breakfast")
  const [customWaterAmount, setCustomWaterAmount] = useState("")
  const [dailyGoal] = useState(2200)
  const [dailyWaterGoal] = useState(2000) // 2000ml daily water goal

  const filteredFoods = SAMPLE_FOODS.filter((food) => food.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const addFood = (food: FoodItem, quantity = 1) => {
    const loggedFood: LoggedFood = {
      ...food,
      quantity,
      meal: selectedMeal,
      timestamp: new Date(),
    }
    setLoggedFoods([...loggedFoods, { ...loggedFood, id: Date.now().toString() }])
  }

  const removeFood = (id: string) => {
    setLoggedFoods(loggedFoods.filter((food) => food.id !== id))
  }

  const addWater = (amount: number) => {
    const waterEntry: WaterEntry = {
      id: Date.now().toString(),
      amount,
      timestamp: new Date(),
    }
    setWaterEntries([...waterEntries, waterEntry])
  }

  const removeWaterEntry = (id: string) => {
    setWaterEntries(waterEntries.filter((entry) => entry.id !== id))
  }

  const getTotalWater = () => {
    return waterEntries.reduce((total, entry) => total + entry.amount, 0)
  }

  const getWaterProgress = () => {
    return (getTotalWater() / dailyWaterGoal) * 100
  }

  const addCustomWater = () => {
    const amount = Number.parseInt(customWaterAmount)
    if (amount && amount > 0) {
      addWater(amount)
      setCustomWaterAmount("")
    }
  }

  const getTotalCalories = () => {
    return loggedFoods.reduce((total, food) => total + food.calories * food.quantity, 0)
  }

  const getTotalMacros = () => {
    return loggedFoods.reduce(
      (totals, food) => ({
        protein: totals.protein + food.protein * food.quantity,
        carbs: totals.carbs + food.carbs * food.quantity,
        fat: totals.fat + food.fat * food.quantity,
      }),
      { protein: 0, carbs: 0, fat: 0 },
    )
  }

  const getMealCalories = (meal: string) => {
    return loggedFoods
      .filter((food) => food.meal === meal)
      .reduce((total, food) => total + food.calories * food.quantity, 0)
  }

  const totalCalories = getTotalCalories()
  const totalMacros = getTotalMacros()
  const calorieProgress = (totalCalories / dailyGoal) * 100
  const totalWater = getTotalWater()
  const waterProgress = getWaterProgress()

  return (
    <div className="space-y-6">
      {/* Daily Overview */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calories</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{totalCalories}</div>
            <p className="text-xs text-muted-foreground">of {dailyGoal} goal</p>
            <Progress value={calorieProgress} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Protein</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{Math.round(totalMacros.protein)}g</div>
            <p className="text-xs text-muted-foreground">
              {Math.round(((totalMacros.protein * 4) / totalCalories) * 100) || 0}% of calories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Carbs</CardTitle>
            <Apple className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{Math.round(totalMacros.carbs)}g</div>
            <p className="text-xs text-muted-foreground">
              {Math.round(((totalMacros.carbs * 4) / totalCalories) * 100) || 0}% of calories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fat</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{Math.round(totalMacros.fat)}g</div>
            <p className="text-xs text-muted-foreground">
              {Math.round(((totalMacros.fat * 9) / totalCalories) * 100) || 0}% of calories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Water</CardTitle>
            <Droplets className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold text-blue-600">{totalWater}ml</div>
            <p className="text-xs text-muted-foreground">of {dailyWaterGoal}ml goal</p>
            <Progress value={waterProgress} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="log" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="log" className="text-xs sm:text-sm">
            Food Log
          </TabsTrigger>
          <TabsTrigger value="search" className="text-xs sm:text-sm">
            Add Food
          </TabsTrigger>
          <TabsTrigger value="water" className="text-xs sm:text-sm">
            Water
          </TabsTrigger>
          <TabsTrigger value="meals" className="text-xs sm:text-sm">
            Meals
          </TabsTrigger>
        </TabsList>

        <TabsContent value="log" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Today's Food Log</CardTitle>
              <CardDescription>Track your daily nutrition intake</CardDescription>
            </CardHeader>
            <CardContent>
              {loggedFoods.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Apple className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No foods logged yet. Start by adding some foods!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {loggedFoods.map((food) => (
                    <div key={food.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{food.name}</h4>
                          <Badge variant="outline" className="text-xs">
                            {food.meal}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {food.quantity} × {food.serving} • {Math.round(food.calories * food.quantity)} cal
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFood(food.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add Food</CardTitle>
              <CardDescription>Search and add foods to your daily log</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search foods..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={selectedMeal} onValueChange={setSelectedMeal}>
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="breakfast">Breakfast</SelectItem>
                    <SelectItem value="lunch">Lunch</SelectItem>
                    <SelectItem value="dinner">Dinner</SelectItem>
                    <SelectItem value="snack">Snack</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredFoods.map((food) => (
                  <div key={food.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{food.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {food.calories} cal • {food.protein}g protein • {food.serving}
                      </p>
                    </div>
                    <Button size="sm" onClick={() => addFood(food)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="water" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Droplets className="h-5 w-5 text-blue-500" />
                Water Intake Tracker
              </CardTitle>
              <CardDescription>Stay hydrated throughout the day</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Water Progress */}
              <div className="text-center space-y-2">
                <div className="text-4xl font-bold text-blue-600">{totalWater}ml</div>
                <p className="text-muted-foreground">of {dailyWaterGoal}ml daily goal</p>
                <Progress value={waterProgress} className="h-3" />
                <p className="text-sm text-muted-foreground">
                  {Math.round(waterProgress)}% complete • {dailyWaterGoal - totalWater}ml remaining
                </p>
              </div>

              {/* Quick Add Buttons */}
              <div className="space-y-3">
                <h3 className="font-medium">Quick Add</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <Button variant="outline" onClick={() => addWater(250)} className="flex flex-col h-16 bg-transparent">
                    <Droplets className="h-4 w-4 text-blue-500 mb-1" />
                    <span className="text-xs">Glass</span>
                    <span className="text-xs text-muted-foreground">250ml</span>
                  </Button>
                  <Button variant="outline" onClick={() => addWater(500)} className="flex flex-col h-16 bg-transparent">
                    <Droplets className="h-4 w-4 text-blue-500 mb-1" />
                    <span className="text-xs">Bottle</span>
                    <span className="text-xs text-muted-foreground">500ml</span>
                  </Button>
                  <Button variant="outline" onClick={() => addWater(750)} className="flex flex-col h-16 bg-transparent">
                    <Droplets className="h-4 w-4 text-blue-500 mb-1" />
                    <span className="text-xs">Large Bottle</span>
                    <span className="text-xs text-muted-foreground">750ml</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => addWater(1000)}
                    className="flex flex-col h-16 bg-transparent"
                  >
                    <Droplets className="h-4 w-4 text-blue-500 mb-1" />
                    <span className="text-xs">Liter</span>
                    <span className="text-xs text-muted-foreground">1000ml</span>
                  </Button>
                </div>
              </div>

              {/* Custom Amount */}
              <div className="space-y-3">
                <h3 className="font-medium">Custom Amount</h3>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Amount in ml"
                    value={customWaterAmount}
                    onChange={(e) => setCustomWaterAmount(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={addCustomWater} disabled={!customWaterAmount}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              </div>

              {/* Water Log */}
              <div className="space-y-3">
                <h3 className="font-medium">Today's Water Log</h3>
                {waterEntries.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Droplets className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No water logged yet. Start hydrating!</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {waterEntries
                      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                      .map((entry) => (
                        <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Droplets className="h-4 w-4 text-blue-500" />
                            <div>
                              <span className="font-medium">{entry.amount}ml</span>
                              <p className="text-xs text-muted-foreground">
                                {entry.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeWaterEntry(entry.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="meals" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {["breakfast", "lunch", "dinner", "snack"].map((meal) => (
              <Card key={meal}>
                <CardHeader>
                  <CardTitle className="capitalize">{meal}</CardTitle>
                  <CardDescription>{getMealCalories(meal)} calories</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {loggedFoods
                      .filter((food) => food.meal === meal)
                      .map((food) => (
                        <div key={food.id} className="flex justify-between text-sm">
                          <span className="truncate mr-2">
                            {food.name} ({food.quantity}×)
                          </span>
                          <span className="flex-shrink-0">{Math.round(food.calories * food.quantity)} cal</span>
                        </div>
                      ))}
                    {loggedFoods.filter((food) => food.meal === meal).length === 0 && (
                      <p className="text-sm text-muted-foreground">No foods logged</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
