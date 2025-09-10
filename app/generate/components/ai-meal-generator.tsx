"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Brain, Clock, Target, Apple, Play, RefreshCw, ChefHat, Utensils } from "lucide-react"

interface Meal {
  name: string
  type: string
  calories: number
  protein: number
  carbs: number
  fat: number
  ingredients: string[]
  instructions: string[]
  prepTime: number
}

interface MealPlan {
  name: string
  days: number
  totalCalories: number
  meals: { [key: string]: Meal[] }
  shoppingList: string[]
}

const mealDatabase = {
  breakfast: {
    high_protein: [
      {
        name: "Greek Yogurt Protein Bowl",
        type: "breakfast",
        calories: 420,
        protein: 35,
        carbs: 25,
        fat: 18,
        ingredients: [
          "Greek yogurt (200g)",
          "Mixed berries (100g)",
          "Almonds (30g)",
          "Honey (1 tbsp)",
          "Chia seeds (1 tbsp)",
        ],
        instructions: ["Mix Greek yogurt with honey", "Top with berries and almonds", "Sprinkle chia seeds on top"],
        prepTime: 5,
      },
      {
        name: "Protein Scrambled Eggs",
        type: "breakfast",
        calories: 380,
        protein: 32,
        carbs: 8,
        fat: 24,
        ingredients: ["Eggs (3 large)", "Spinach (50g)", "Cheese (30g)", "Avocado (1/2)", "Olive oil (1 tsp)"],
        instructions: ["Heat oil in pan", "Scramble eggs with spinach", "Add cheese and serve with avocado"],
        prepTime: 10,
      },
    ],
    balanced: [
      {
        name: "Overnight Oats",
        type: "breakfast",
        calories: 350,
        protein: 15,
        carbs: 45,
        fat: 12,
        ingredients: ["Oats (50g)", "Milk (200ml)", "Banana (1 medium)", "Peanut butter (1 tbsp)", "Cinnamon"],
        instructions: ["Mix oats with milk", "Add sliced banana and peanut butter", "Refrigerate overnight"],
        prepTime: 5,
      },
    ],
  },
  lunch: {
    high_protein: [
      {
        name: "Grilled Chicken Salad",
        type: "lunch",
        calories: 450,
        protein: 40,
        carbs: 15,
        fat: 25,
        ingredients: [
          "Chicken breast (150g)",
          "Mixed greens (100g)",
          "Cherry tomatoes (100g)",
          "Cucumber (50g)",
          "Olive oil dressing (2 tbsp)",
        ],
        instructions: ["Grill chicken breast", "Prepare salad with vegetables", "Add dressing and sliced chicken"],
        prepTime: 15,
      },
      {
        name: "Salmon Quinoa Bowl",
        type: "lunch",
        calories: 520,
        protein: 35,
        carbs: 40,
        fat: 22,
        ingredients: [
          "Salmon fillet (120g)",
          "Quinoa (60g dry)",
          "Broccoli (100g)",
          "Sweet potato (100g)",
          "Lemon (1/2)",
        ],
        instructions: ["Cook quinoa", "Bake salmon and vegetables", "Combine in bowl with lemon"],
        prepTime: 25,
      },
    ],
    balanced: [
      {
        name: "Turkey Wrap",
        type: "lunch",
        calories: 380,
        protein: 25,
        carbs: 35,
        fat: 15,
        ingredients: [
          "Whole wheat tortilla",
          "Turkey slices (100g)",
          "Hummus (2 tbsp)",
          "Lettuce",
          "Tomato",
          "Cucumber",
        ],
        instructions: ["Spread hummus on tortilla", "Add turkey and vegetables", "Roll tightly and slice"],
        prepTime: 8,
      },
    ],
  },
  dinner: {
    high_protein: [
      {
        name: "Lean Beef Stir-fry",
        type: "dinner",
        calories: 480,
        protein: 38,
        carbs: 25,
        fat: 24,
        ingredients: [
          "Lean beef (150g)",
          "Mixed vegetables (200g)",
          "Brown rice (40g dry)",
          "Soy sauce (1 tbsp)",
          "Sesame oil (1 tsp)",
        ],
        instructions: ["Cook rice", "Stir-fry beef until browned", "Add vegetables and seasonings", "Serve over rice"],
        prepTime: 20,
      },
    ],
    balanced: [
      {
        name: "Baked Cod with Vegetables",
        type: "dinner",
        calories: 420,
        protein: 30,
        carbs: 35,
        fat: 18,
        ingredients: ["Cod fillet (150g)", "Sweet potato (150g)", "Green beans (100g)", "Olive oil (1 tbsp)", "Herbs"],
        instructions: ["Preheat oven to 200°C", "Season cod and vegetables", "Bake for 20 minutes"],
        prepTime: 25,
      },
    ],
  },
  snacks: [
    {
      name: "Protein Smoothie",
      type: "snack",
      calories: 250,
      protein: 20,
      carbs: 25,
      fat: 8,
      ingredients: ["Protein powder (1 scoop)", "Banana (1 small)", "Spinach (30g)", "Almond milk (200ml)"],
      instructions: ["Blend all ingredients until smooth"],
      prepTime: 3,
    },
    {
      name: "Apple with Almond Butter",
      type: "snack",
      calories: 190,
      protein: 6,
      carbs: 20,
      fat: 12,
      ingredients: ["Apple (1 medium)", "Almond butter (1 tbsp)"],
      instructions: ["Slice apple", "Serve with almond butter"],
      prepTime: 2,
    },
  ],
}

export function AIMealGenerator() {
  const [preferences, setPreferences] = useState({
    goal: "",
    calorieTarget: "",
    days: "",
    mealsPerDay: "",
    dietaryRestrictions: [] as string[],
    cookingTime: "",
  })
  const [generatedPlan, setGeneratedPlan] = useState<MealPlan | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleRestrictionToggle = (restriction: string) => {
    setPreferences((prev) => ({
      ...prev,
      dietaryRestrictions: prev.dietaryRestrictions.includes(restriction)
        ? prev.dietaryRestrictions.filter((r) => r !== restriction)
        : [...prev.dietaryRestrictions, restriction],
    }))
  }

  const generateMealPlan = async () => {
    setIsGenerating(true)

    // Simulate AI processing time
    await new Promise((resolve) => setTimeout(resolve, 2500))

    const { goal, calorieTarget, days, mealsPerDay } = preferences
    const daysNum = Number.parseInt(days)
    const mealsNum = Number.parseInt(mealsPerDay)
    const caloriesNum = Number.parseInt(calorieTarget)

    // Select meal style based on goal
    const mealStyle = goal === "muscle_gain" ? "high_protein" : "balanced"

    // Generate meals for each day
    const meals: { [key: string]: Meal[] } = {}
    const allIngredients = new Set<string>()

    for (let day = 1; day <= daysNum; day++) {
      const dayMeals: Meal[] = []

      // Add breakfast
      const breakfastOptions =
        mealDatabase.breakfast[mealStyle as keyof typeof mealDatabase.breakfast] || mealDatabase.breakfast.balanced
      const breakfast = breakfastOptions[Math.floor(Math.random() * breakfastOptions.length)]
      dayMeals.push(breakfast)
      breakfast.ingredients.forEach((ing) => allIngredients.add(ing))

      // Add lunch
      const lunchOptions =
        mealDatabase.lunch[mealStyle as keyof typeof mealDatabase.lunch] || mealDatabase.lunch.balanced
      const lunch = lunchOptions[Math.floor(Math.random() * lunchOptions.length)]
      dayMeals.push(lunch)
      lunch.ingredients.forEach((ing) => allIngredients.add(ing))

      // Add dinner
      const dinnerOptions =
        mealDatabase.dinner[mealStyle as keyof typeof mealDatabase.dinner] || mealDatabase.dinner.balanced
      const dinner = dinnerOptions[Math.floor(Math.random() * dinnerOptions.length)]
      dayMeals.push(dinner)
      dinner.ingredients.forEach((ing) => allIngredients.add(ing))

      // Add snacks if needed
      if (mealsNum > 3) {
        const snack = mealDatabase.snacks[Math.floor(Math.random() * mealDatabase.snacks.length)]
        dayMeals.push(snack)
        snack.ingredients.forEach((ing) => allIngredients.add(ing))
      }

      meals[`Day ${day}`] = dayMeals
    }

    const mealPlan: MealPlan = {
      name: `AI-Generated ${goal.replace("_", " ")} Meal Plan`,
      days: daysNum,
      totalCalories: caloriesNum,
      meals,
      shoppingList: Array.from(allIngredients).sort(),
    }

    setGeneratedPlan(mealPlan)
    setIsGenerating(false)
  }

  const canGenerate = preferences.goal && preferences.calorieTarget && preferences.days && preferences.mealsPerDay

  return (
    <div className="space-y-6">
      {/* Generator Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-emerald-600" />
            AI Meal Plan Generator
          </CardTitle>
          <CardDescription>Tell me about your nutrition goals and I&apos;ll create a personalized meal plan</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Nutrition Goal */}
            <div className="space-y-2">
              <Label>Nutrition Goal</Label>
              <Select
                value={preferences.goal}
                onValueChange={(value) => setPreferences((prev) => ({ ...prev, goal: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your goal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weight_loss">Weight Loss</SelectItem>
                  <SelectItem value="muscle_gain">Muscle Gain</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="performance">Athletic Performance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Calorie Target */}
            <div className="space-y-2">
              <Label>Daily Calorie Target</Label>
              <Input
                type="number"
                placeholder="e.g., 2200"
                value={preferences.calorieTarget}
                onChange={(e) => setPreferences((prev) => ({ ...prev, calorieTarget: e.target.value }))}
              />
            </div>

            {/* Number of Days */}
            <div className="space-y-2">
              <Label>Plan Duration</Label>
              <Select
                value={preferences.days}
                onValueChange={(value) => setPreferences((prev) => ({ ...prev, days: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="How many days?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 days</SelectItem>
                  <SelectItem value="5">5 days</SelectItem>
                  <SelectItem value="7">7 days (1 week)</SelectItem>
                  <SelectItem value="14">14 days (2 weeks)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Meals Per Day */}
            <div className="space-y-2">
              <Label>Meals Per Day</Label>
              <Select
                value={preferences.mealsPerDay}
                onValueChange={(value) => setPreferences((prev) => ({ ...prev, mealsPerDay: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="How many meals?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 meals</SelectItem>
                  <SelectItem value="4">3 meals + 1 snack</SelectItem>
                  <SelectItem value="5">3 meals + 2 snacks</SelectItem>
                  <SelectItem value="6">6 small meals</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Cooking Time */}
            <div className="space-y-2">
              <Label>Max Cooking Time</Label>
              <Select
                value={preferences.cookingTime}
                onValueChange={(value) => setPreferences((prev) => ({ ...prev, cookingTime: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Time available?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quick">Quick (under 15 min)</SelectItem>
                  <SelectItem value="moderate">Moderate (15-30 min)</SelectItem>
                  <SelectItem value="extended">Extended (30+ min)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dietary Restrictions */}
          <div className="space-y-3">
            <Label>Dietary Restrictions (optional)</Label>
            <div className="flex flex-wrap gap-2">
              {["vegetarian", "vegan", "gluten_free", "dairy_free", "keto", "paleo", "low_carb", "high_protein"].map(
                (restriction) => (
                  <div key={restriction} className="flex items-center space-x-2">
                    <Checkbox
                      id={restriction}
                      checked={preferences.dietaryRestrictions.includes(restriction)}
                      onCheckedChange={() => handleRestrictionToggle(restriction)}
                    />
                    <Label htmlFor={restriction} className="text-sm capitalize cursor-pointer">
                      {restriction.replace("_", " ")}
                    </Label>
                  </div>
                ),
              )}
            </div>
          </div>

          <Button
            onClick={generateMealPlan}
            disabled={!canGenerate || isGenerating}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Generating Your Meal Plan...
              </>
            ) : (
              <>
                <ChefHat className="w-4 h-4 mr-2" />
                Generate AI Meal Plan
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Meal Plan */}
      {generatedPlan && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-emerald-600" />
                  {generatedPlan.name}
                </CardTitle>
                <CardDescription className="flex items-center gap-4 mt-2">
                  <Badge variant="outline">{generatedPlan.days} days</Badge>
                  <div className="flex items-center gap-1">
                    <Apple className="w-3 h-3" />
                    {generatedPlan.totalCalories} cal/day target
                  </div>
                  <div className="flex items-center gap-1">
                    <Utensils className="w-3 h-3" />
                    {Object.keys(generatedPlan.meals).length} days planned
                  </div>
                </CardDescription>
              </div>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Play className="w-4 h-4 mr-2" />
                Start Plan
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Daily Meal Plans */}
            <div className="space-y-6">
              {Object.entries(generatedPlan.meals).map(([day, dayMeals]) => (
                <div key={day}>
                  <h3 className="font-semibold mb-4 text-emerald-600">{day}</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {dayMeals.map((meal, index) => (
                      <div key={index} className="p-4 rounded-lg border bg-card/50">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium">{meal.name}</h4>
                            <Badge variant="secondary" className="text-xs mt-1 capitalize">
                              {meal.type}
                            </Badge>
                          </div>
                          <div className="text-right text-sm">
                            <div className="font-semibold">{meal.calories} cal</div>
                            <div className="text-xs text-muted-foreground">
                              P: {meal.protein}g | C: {meal.carbs}g | F: {meal.fat}g
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div>
                            <p className="font-medium text-muted-foreground mb-1">Ingredients:</p>
                            <ul className="text-xs text-muted-foreground space-y-0.5">
                              {meal.ingredients.map((ingredient, i) => (
                                <li key={i}>• {ingredient}</li>
                              ))}
                            </ul>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {meal.prepTime} min prep
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            {/* Shopping List */}
            <div>
              <h3 className="font-semibold mb-3 text-blue-600">Shopping List</h3>
              <div className="grid gap-2 md:grid-cols-3 text-sm">
                {generatedPlan.shoppingList.map((item, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Checkbox id={`item-${index}`} />
                    <Label htmlFor={`item-${index}`} className="text-sm cursor-pointer">
                      {item}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1 bg-transparent">
                Save Plan
              </Button>
              <Button variant="outline" className="flex-1 bg-transparent">
                Export Shopping List
              </Button>
              <Button onClick={generateMealPlan} variant="outline">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
