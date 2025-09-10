"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Trash2, Target, TrendingUp, Apple, Droplets, Minus, Database, ChefHat, Users, Lock, Eye } from "lucide-react"

interface FoodItem {
  id: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
  sugar?: number
  sodium?: number
  servingSize?: number
  servingUnit?: string
  category?: string
  brand?: string
  verified?: boolean
  isPublic?: boolean
  userId?: string
  usageCount?: number
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

interface Meal {
  id: string
  name: string
  description?: string
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFat: number
  totalFiber?: number
  totalSugar?: number
  totalSodium?: number
  isPublic: boolean
  userId: string
  ingredients: MealIngredient[]
  createdAt: Date
}

interface MealIngredient {
  id: string
  mealId: string
  foodId: string
  quantity: number
  food: FoodItem
}

const SAMPLE_FOODS: FoodItem[] = [
  { id: "1", name: "Chicken Breast", calories: 165, protein: 31, carbs: 0, fat: 3.6, servingSize: 100, servingUnit: "g", category: "protein", verified: true, usageCount: 150 },
  { id: "2", name: "Brown Rice", calories: 111, protein: 2.6, carbs: 23, fat: 0.9, servingSize: 100, servingUnit: "g", category: "grain", verified: true, usageCount: 120 },
  { id: "3", name: "Broccoli", calories: 34, protein: 2.8, carbs: 7, fat: 0.4, servingSize: 100, servingUnit: "g", category: "vegetable", verified: true, usageCount: 95 },
  { id: "4", name: "Banana", calories: 89, protein: 1.1, carbs: 23, fat: 0.3, servingSize: 118, servingUnit: "g", category: "fruit", verified: true, usageCount: 200 },
  { id: "5", name: "Greek Yogurt", calories: 59, protein: 10, carbs: 3.6, fat: 0.4, servingSize: 100, servingUnit: "g", category: "dairy", verified: true, usageCount: 85 },
  { id: "6", name: "Almonds", calories: 579, protein: 21, carbs: 22, fat: 50, servingSize: 100, servingUnit: "g", category: "nuts", verified: true, usageCount: 75 },
  { id: "7", name: "Salmon", calories: 208, protein: 20, carbs: 0, fat: 13, servingSize: 100, servingUnit: "g", category: "protein", verified: true, usageCount: 60 },
  { id: "8", name: "Sweet Potato", calories: 86, protein: 1.6, carbs: 20, fat: 0.1, servingSize: 100, servingUnit: "g", category: "vegetable", verified: true, usageCount: 55 },
]

export function CalorieTracker() {
  const [loggedFoods, setLoggedFoods] = useState<LoggedFood[]>([])
  const [waterEntries, setWaterEntries] = useState<WaterEntry[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedMeal, setSelectedMeal] = useState("breakfast")
  const [customWaterAmount, setCustomWaterAmount] = useState("")
  const [dailyGoal] = useState(2200)
  const [dailyWaterGoal] = useState(2000) // 2000ml daily water goal
  const [availableFoods, setAvailableFoods] = useState<FoodItem[]>(SAMPLE_FOODS)
  const [useDatabase, setUseDatabase] = useState(false)
  const [meals, setMeals] = useState<Meal[]>([])
  const [isLoadingMeals, setIsLoadingMeals] = useState(false)
  const [mealIngredients, setMealIngredients] = useState<MealIngredient[]>([])
  const [mealForm, setMealForm] = useState({
    name: "",
    description: "",
    isPublic: false
  })
  const [searchResults, setSearchResults] = useState<FoodItem[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [duplicateCheckResults, setDuplicateCheckResults] = useState<FoodItem[]>([])
  const [showDuplicates, setShowDuplicates] = useState(false)
  const [quickAddMode, setQuickAddMode] = useState(false)
  const [quickAddFood, setQuickAddFood] = useState({
    name: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: ""
  })

  // Fetch foods from database on component mount
  useEffect(() => {
    const fetchFoods = async () => {
      try {
        const response = await fetch('/api/foods')
        if (response.ok) {
          const dbFoods = await response.json()
          setAvailableFoods([...SAMPLE_FOODS, ...dbFoods])
          setUseDatabase(true)
        }
      } catch {
        setAvailableFoods(SAMPLE_FOODS)
      }
    }

    fetchFoods()
  }, [])

  // Fetch meals
  useEffect(() => {
    const fetchMeals = async () => {
      try {
        setIsLoadingMeals(true)
        const response = await fetch('/api/meals')
        if (response.ok) {
          const dbMeals = await response.json()
          setMeals(dbMeals)
        }
      } catch {
      } finally {
        setIsLoadingMeals(false)
      }
    }

    fetchMeals()
  }, [])

  const filteredFoods = availableFoods.filter((food) =>
    food.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const addFood = async (food: FoodItem, quantity = 1) => {
    const loggedFood: LoggedFood = {
      ...food,
      quantity,
      meal: selectedMeal,
      timestamp: new Date(),
    }
    setLoggedFoods([...loggedFoods, { ...loggedFood, id: Date.now().toString() }])

    // Increment usage count if food has an ID (database food)
    if (food.id && useDatabase) {
      try {
        await fetch(`/api/foods/${food.id}/usage`, {
          method: 'POST'
        })
      } catch {
      }
    }
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

  const [customFood, setCustomFood] = useState({
    name: "",
    brand: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
    servingSize: "100",
    servingUnit: "g",
    category: "",
    isPublic: false
  })

  const addCustomFood = async () => {
    if (!customFood.name || !customFood.calories) return

    try {
      const response = await fetch('/api/foods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...customFood,
          calories: parseFloat(customFood.calories),
          protein: parseFloat(customFood.protein) || 0,
          carbs: parseFloat(customFood.carbs) || 0,
          fat: parseFloat(customFood.fat) || 0,
          servingSize: parseFloat(customFood.servingSize),
          checkDuplicates: true
        })
      })

      if (response.ok) {
        const result = await response.json()

        // Check if duplicates were found
        if (result.duplicates) {
          setDuplicateCheckResults(result.duplicates)
          setShowDuplicates(true)
          return
        }

        // Food was created successfully
        const newFood = result
        setAvailableFoods(prev => [...prev, newFood])
        setCustomFood({
          name: "",
          brand: "",
          calories: "",
          protein: "",
          carbs: "",
          fat: "",
          servingSize: "100",
          servingUnit: "g",
          category: "",
          isPublic: false
        })
      }
    } catch (error) {
      console.error('Error adding custom food:', error)
    }
  }

  const handleFoodSearch = async (term: string) => {
    if (!term.trim()) {
      setSearchResults([])
      setShowDuplicates(false)
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/foods?search=${encodeURIComponent(term)}&checkDuplicates=true`)
      if (response.ok) {
        const result = await response.json()

        if (result.isDuplicateCheck) {
          setDuplicateCheckResults(result.foods)
          setShowDuplicates(true)
          setSearchResults([])
        } else {
          setSearchResults(result)
          setShowDuplicates(false)
        }
      }
    } catch {
      setSearchResults(filteredFoods.slice(0, 10))
    } finally {
      setIsSearching(false)
    }
  }

  const addQuickFood = async () => {
    if (!quickAddFood.name || !quickAddFood.calories) return

    try {
      const response = await fetch('/api/foods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...quickAddFood,
          calories: parseFloat(quickAddFood.calories),
          protein: parseFloat(quickAddFood.protein) || 0,
          carbs: parseFloat(quickAddFood.carbs) || 0,
          fat: parseFloat(quickAddFood.fat) || 0,
          servingSize: 100,
          servingUnit: "g",
          category: "other",
          isPublic: false
        })
      })

      if (response.ok) {
        const newFood = await response.json()
        setAvailableFoods(prev => [...prev, newFood])
        addFood(newFood)
        setQuickAddMode(false)
        setQuickAddFood({
          name: "",
          calories: "",
          protein: "",
          carbs: "",
          fat: ""
        })
      }
    } catch {
      console.error('Error adding quick food')
    }
  }

  const addIngredientToMeal = (food: FoodItem, quantity: number) => {
    const ingredient: MealIngredient = {
      id: Date.now().toString(),
      mealId: "",
      foodId: food.id,
      quantity,
      food
    }
    setMealIngredients([...mealIngredients, ingredient])
  }

  const removeIngredientFromMeal = (id: string) => {
    setMealIngredients(mealIngredients.filter(ing => ing.id !== id))
  }

  const createMeal = async () => {
    if (!mealForm.name || mealIngredients.length === 0) return

    try {
      const response = await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...mealForm,
          ingredients: mealIngredients.map(ing => ({
            foodId: ing.foodId,
            quantity: ing.quantity
          }))
        })
      })

      if (response.ok) {
        const newMeal = await response.json()
        setMeals(prev => [newMeal, ...prev])
        setMealForm({
          name: "",
          description: "",
          isPublic: false
        })
        setMealIngredients([])
      }
    } catch {
      console.error('Error creating meal')
    }
  }

  const addMealToLog = (meal: Meal) => {
    // Add each ingredient as a logged food
    meal.ingredients.forEach(ingredient => {
      addFood(ingredient.food, ingredient.quantity)
    })
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
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="log" className="text-xs sm:text-sm">
            Food Log
          </TabsTrigger>
          <TabsTrigger value="search" className="text-xs sm:text-sm">
            Add Food
          </TabsTrigger>
          <TabsTrigger value="custom" className="text-xs sm:text-sm">
            Custom Food
          </TabsTrigger>
          <TabsTrigger value="meals" className="text-xs sm:text-sm">
            Meals
          </TabsTrigger>
          <TabsTrigger value="water" className="text-xs sm:text-sm">
            Water
          </TabsTrigger>
          <TabsTrigger value="create-meal" className="text-xs sm:text-sm">
            Create Meal
          </TabsTrigger>
        </TabsList>

        <TabsContent value="log" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Today&#39;s Food Log</CardTitle>
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
                          {food.usageCount && (
                            <Badge variant="secondary" className="text-xs">
                              Popular
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {food.quantity} × {food.servingSize || 100}{food.servingUnit || 'g'} • {Math.round(food.calories * food.quantity)} cal
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
                    onChange={(e) => {
                      setSearchTerm(e.target.value)
                      handleFoodSearch(e.target.value)
                    }}
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

              {showDuplicates && duplicateCheckResults.length > 0 && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                    Similar foods found:
                  </h4>
                  <div className="space-y-2">
                    {duplicateCheckResults.slice(0, 5).map((food) => (
                      <div key={food.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded">
                        <div>
                          <span className="font-medium">{food.name}</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            {food.calories} cal • {food.protein}g protein
                          </span>
                          {food.usageCount && food.usageCount > 10 && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              Popular ({food.usageCount} uses)
                            </Badge>
                          )}
                        </div>
                        <Button size="sm" onClick={() => addFood(food)}>
                          Use This
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowDuplicates(false)
                        setQuickAddMode(true)
                        setQuickAddFood(prev => ({ ...prev, name: searchTerm }))
                      }}
                    >
                      Create New Food
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDuplicates(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {!showDuplicates && (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {isSearching ? (
                    <div className="text-center py-4">Searching...</div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((food) => (
                      <div key={food.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{food.name}</h4>
                            {food.usageCount && food.usageCount > 20 && (
                              <Badge variant="secondary" className="text-xs">
                                🔥 Popular
                              </Badge>
                            )}
                            {food.verified && (
                              <Badge variant="outline" className="text-xs">
                                Verified
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {food.calories} cal • {food.protein}g protein • {food.servingSize || 100}{food.servingUnit || 'g'}
                          </p>
                        </div>
                        <Button size="sm" onClick={() => addFood(food)}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  ) : searchTerm && !isSearching ? (
                    <div className="text-center py-8">
                      <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-muted-foreground mb-4">{`No foods found for "${searchTerm}"`}</p>
                      <Button onClick={() => {
                        setQuickAddMode(true)
                        setQuickAddFood(prev => ({ ...prev, name: searchTerm }))
                      }}>
                        Quick Add Calories
                      </Button>
                    </div>
                  ) : (
                    filteredFoods.slice(0, 10).map((food) => (
                      <div key={food.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{food.name}</h4>
                            {food.usageCount && food.usageCount > 20 && (
                              <Badge variant="secondary" className="text-xs">
                                🔥 Popular
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {food.calories} cal • {food.protein}g protein • {food.servingSize || 100}{food.servingUnit || 'g'}
                          </p>
                        </div>
                        <Button size="sm" onClick={() => addFood(food)}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          {quickAddMode ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-green-500" />
                  Quick Add Food
                </CardTitle>
                <CardDescription>{`Add basic nutritional info for "${quickAddFood.name}"`}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Food Name</label>
                    <Input
                      value={quickAddFood.name}
                      onChange={(e) => setQuickAddFood(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Calories *</label>
                    <Input
                      type="number"
                      placeholder="250"
                      value={quickAddFood.calories}
                      onChange={(e) => setQuickAddFood(prev => ({ ...prev, calories: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Protein (g)</label>
                    <Input
                      type="number"
                      placeholder="20"
                      value={quickAddFood.protein}
                      onChange={(e) => setQuickAddFood(prev => ({ ...prev, protein: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Carbs (g)</label>
                    <Input
                      type="number"
                      placeholder="25"
                      value={quickAddFood.carbs}
                      onChange={(e) => setQuickAddFood(prev => ({ ...prev, carbs: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Fat (g)</label>
                    <Input
                      type="number"
                      placeholder="8"
                      value={quickAddFood.fat}
                      onChange={(e) => setQuickAddFood(prev => ({ ...prev, fat: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={addQuickFood} disabled={!quickAddFood.name || !quickAddFood.calories} className="flex-1">
                    <Plus className="h-4 w-4 mr-2" />
                    Add to Log
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setQuickAddMode(false)
                      setQuickAddFood({
                        name: "",
                        calories: "",
                        protein: "",
                        carbs: "",
                        fat: ""
                      })
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-purple-500" />
                  Create Custom Food
                </CardTitle>
                <CardDescription>Add your own foods to the database</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Food Name *</label>
                    <Input
                      placeholder="e.g., Homemade Protein Bar"
                      value={customFood.name}
                      onChange={(e) => setCustomFood(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Brand (optional)</label>
                    <Input
                      placeholder="e.g., My Kitchen"
                      value={customFood.brand}
                      onChange={(e) => setCustomFood(prev => ({ ...prev, brand: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Calories *</label>
                    <Input
                      type="number"
                      placeholder="250"
                      value={customFood.calories}
                      onChange={(e) => setCustomFood(prev => ({ ...prev, calories: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Protein (g)</label>
                    <Input
                      type="number"
                      placeholder="20"
                      value={customFood.protein}
                      onChange={(e) => setCustomFood(prev => ({ ...prev, protein: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Carbs (g)</label>
                    <Input
                      type="number"
                      placeholder="25"
                      value={customFood.carbs}
                      onChange={(e) => setCustomFood(prev => ({ ...prev, carbs: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Fat (g)</label>
                    <Input
                      type="number"
                      placeholder="8"
                      value={customFood.fat}
                      onChange={(e) => setCustomFood(prev => ({ ...prev, fat: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Serving Size</label>
                    <Input
                      type="number"
                      placeholder="100"
                      value={customFood.servingSize}
                      onChange={(e) => setCustomFood(prev => ({ ...prev, servingSize: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Unit</label>
                    <Select value={customFood.servingUnit} onValueChange={(value) => setCustomFood(prev => ({ ...prev, servingUnit: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="g">grams (g)</SelectItem>
                        <SelectItem value="ml">milliliters (ml)</SelectItem>
                        <SelectItem value="oz">ounces (oz)</SelectItem>
                        <SelectItem value="cup">cup</SelectItem>
                        <SelectItem value="tbsp">tablespoon</SelectItem>
                        <SelectItem value="tsp">teaspoon</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <Select value={customFood.category} onValueChange={(value) => setCustomFood(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="protein">Protein</SelectItem>
                        <SelectItem value="vegetable">Vegetable</SelectItem>
                        <SelectItem value="fruit">Fruit</SelectItem>
                        <SelectItem value="grain">Grain</SelectItem>
                        <SelectItem value="dairy">Dairy</SelectItem>
                        <SelectItem value="nuts">Nuts/Seeds</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={addCustomFood} disabled={!customFood.name || !customFood.calories} className="flex-1">
                    <Plus className="h-4 w-4 mr-2" />
                    Add to Database
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setCustomFood({
                      name: "",
                      brand: "",
                      calories: "",
                      protein: "",
                      carbs: "",
                      fat: "",
                      servingSize: "100",
                      servingUnit: "g",
                      category: "",
                      isPublic: false
                    })}
                  >
                    Clear
                  </Button>
                </div>

                {useDatabase && (
                  <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-sm text-green-800 dark:text-green-200">
                      ✓ Database connected! Your custom foods will be saved and available across sessions.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="meals" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ChefHat className="h-5 w-5 text-orange-500" />
                  Your Meals
                </CardTitle>
                <CardDescription>Meals you&#39;ve created</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingMeals ? (
                  <div className="text-center py-4">Loading meals...</div>
                ) : meals.filter(meal => meal.userId === 'current-user').length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ChefHat className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No meals created yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {meals.filter(meal => meal.userId === 'current-user').map((meal) => (
                      <div key={meal.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{meal.name}</h4>
                            {meal.isPublic ? (
                              <Badge variant="secondary" className="text-xs">
                                <Eye className="h-3 w-3 mr-1" />
                                Public
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                <Lock className="h-3 w-3 mr-1" />
                                Private
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {Math.round(meal.totalCalories)} cal • {meal.ingredients.length} ingredients
                          </p>
                        </div>
                        <Button size="sm" onClick={() => addMealToLog(meal)}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  Community Meals
                </CardTitle>
                <CardDescription>Meals shared by other users</CardDescription>
              </CardHeader>
              <CardContent>
                {meals.filter(meal => meal.isPublic && meal.userId !== 'current-user').length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No community meals yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {meals.filter(meal => meal.isPublic && meal.userId !== 'current-user').map((meal) => (
                      <div key={meal.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{meal.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {Math.round(meal.totalCalories)} cal • {meal.ingredients.length} ingredients
                          </p>
                        </div>
                        <Button size="sm" onClick={() => addMealToLog(meal)}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="create-meal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChefHat className="h-5 w-5 text-orange-500" />
                Create Meal
              </CardTitle>
              <CardDescription>Build a meal from multiple ingredients</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Meal Name *</label>
                  <Input
                    placeholder="e.g., Protein Power Bowl"
                    value={mealForm.name}
                    onChange={(e) => setMealForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description (optional)</label>
                  <Input
                    placeholder="e.g., High-protein breakfast bowl"
                    value={mealForm.description}
                    onChange={(e) => setMealForm(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="meal-public"
                  checked={mealForm.isPublic}
                  onChange={(e) => setMealForm(prev => ({ ...prev, isPublic: e.target.checked }))}
                  className="rounded"
                />
                <label htmlFor="meal-public" className="text-sm font-medium">
                  Make this meal public (visible to other users)
                </label>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Add Ingredients</h3>
                <div className="grid gap-2">
                  {availableFoods.slice(0, 20).map((food) => (
                    <div key={food.id} className="flex items-center gap-2 p-2 border rounded">
                      <span className="flex-1 text-sm">{food.name} ({food.calories} cal)</span>
                      <Input
                        type="number"
                        placeholder="Qty"
                        className="w-16"
                        min="0.1"
                        step="0.1"
                        onChange={(e) => {
                          const quantity = parseFloat(e.target.value)
                          if (quantity > 0) {
                            addIngredientToMeal(food, quantity)
                          }
                        }}
                      />
                      <Button size="sm" variant="outline">
                        Add
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {mealIngredients.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-medium">Meal Ingredients</h3>
                  <div className="space-y-2">
                    {mealIngredients.map((ingredient) => (
                      <div key={ingredient.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <div>
                          <span className="font-medium">{ingredient.food.name}</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            {ingredient.quantity} × {Math.round(ingredient.food.calories * ingredient.quantity)} cal
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeIngredientFromMeal(ingredient.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <h4 className="font-medium text-blue-800 dark:text-blue-200">Meal Totals</h4>
                    <div className="grid grid-cols-4 gap-2 mt-2 text-sm">
                      <div>Calories: {Math.round(mealIngredients.reduce((total, ing) => total + ing.food.calories * ing.quantity, 0))}</div>
                      <div>Protein: {Math.round(mealIngredients.reduce((total, ing) => total + ing.food.protein * ing.quantity, 0))}g</div>
                      <div>Carbs: {Math.round(mealIngredients.reduce((total, ing) => total + ing.food.carbs * ing.quantity, 0))}g</div>
                      <div>Fat: {Math.round(mealIngredients.reduce((total, ing) => total + ing.food.fat * ing.quantity, 0))}g</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={createMeal}
                  disabled={!mealForm.name || mealIngredients.length === 0}
                  className="flex-1"
                >
                  <ChefHat className="h-4 w-4 mr-2" />
                  Create Meal
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setMealForm({
                      name: "",
                      description: "",
                      isPublic: false
                    })
                    setMealIngredients([])
                  }}
                >
                  Clear
                </Button>
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
                  <Button variant="outline" onClick={() => addWater(1000)} className="flex flex-col h-16 bg-transparent">
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
                <h3 className="font-medium">Today&#39;s Water Log</h3>
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
      </Tabs>
    </div>
  )
}
