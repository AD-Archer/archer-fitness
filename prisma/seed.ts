import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const foods = [
  // Proteins
  { name: "Chicken Breast", brand: null, calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, sugar: 0, sodium: 74, servingSize: 100, servingUnit: "g", category: "protein", verified: true },
  { name: "Salmon", brand: null, calories: 208, protein: 20, carbs: 0, fat: 13, fiber: 0, sugar: 0, sodium: 59, servingSize: 100, servingUnit: "g", category: "protein", verified: true },
  { name: "Greek Yogurt", brand: null, calories: 59, protein: 10, carbs: 3.6, fat: 0.4, fiber: 0, sugar: 3.6, sodium: 36, servingSize: 100, servingUnit: "g", category: "dairy", verified: true },
  { name: "Eggs", brand: null, calories: 155, protein: 13, carbs: 1.1, fat: 11, fiber: 0, sugar: 0.6, sodium: 124, servingSize: 100, servingUnit: "g", category: "protein", verified: true },
  { name: "Tuna", brand: null, calories: 128, protein: 29, carbs: 0, fat: 1.3, fiber: 0, sugar: 0, sodium: 50, servingSize: 100, servingUnit: "g", category: "protein", verified: true },

  // Vegetables
  { name: "Broccoli", brand: null, calories: 34, protein: 2.8, carbs: 7, fat: 0.4, fiber: 2.6, sugar: 1.7, sodium: 33, servingSize: 100, servingUnit: "g", category: "vegetable", verified: true },
  { name: "Spinach", brand: null, calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2, sugar: 0.4, sodium: 79, servingSize: 100, servingUnit: "g", category: "vegetable", verified: true },
  { name: "Sweet Potato", brand: null, calories: 86, protein: 1.6, carbs: 20, fat: 0.1, fiber: 3, sugar: 4.2, sodium: 55, servingSize: 100, servingUnit: "g", category: "vegetable", verified: true },
  { name: "Carrots", brand: null, calories: 41, protein: 0.9, carbs: 10, fat: 0.2, fiber: 2.8, sugar: 4.9, sodium: 69, servingSize: 100, servingUnit: "g", category: "vegetable", verified: true },

  // Fruits
  { name: "Banana", brand: null, calories: 89, protein: 1.1, carbs: 23, fat: 0.3, fiber: 2.6, sugar: 12, sodium: 1, servingSize: 118, servingUnit: "g", category: "fruit", verified: true },
  { name: "Apple", brand: null, calories: 52, protein: 0.3, carbs: 14, fat: 0.2, fiber: 2.4, sugar: 10, sodium: 1, servingSize: 182, servingUnit: "g", category: "fruit", verified: true },
  { name: "Strawberries", brand: null, calories: 32, protein: 0.7, carbs: 7.7, fat: 0.3, fiber: 2, sugar: 4.9, sodium: 1, servingSize: 100, servingUnit: "g", category: "fruit", verified: true },

  // Grains
  { name: "Brown Rice", brand: null, calories: 111, protein: 2.6, carbs: 23, fat: 0.9, fiber: 1.8, sugar: 0.4, sodium: 10, servingSize: 100, servingUnit: "g", category: "grain", verified: true },
  { name: "Oats", brand: null, calories: 379, protein: 13, carbs: 67, fat: 6.9, fiber: 10, sugar: 1, sodium: 2, servingSize: 100, servingUnit: "g", category: "grain", verified: true },
  { name: "Quinoa", brand: null, calories: 120, protein: 4.4, carbs: 21, fat: 1.9, fiber: 2.8, sugar: 0.9, sodium: 13, servingSize: 100, servingUnit: "g", category: "grain", verified: true },

  // Nuts & Seeds
  { name: "Almonds", brand: null, calories: 579, protein: 21, carbs: 22, fat: 50, fiber: 12, sugar: 4.2, sodium: 1, servingSize: 100, servingUnit: "g", category: "nuts", verified: true },
  { name: "Peanut Butter", brand: null, calories: 588, protein: 25, carbs: 20, fat: 50, fiber: 6, sugar: 9, sodium: 17, servingSize: 100, servingUnit: "g", category: "nuts", verified: true },
  { name: "Chia Seeds", brand: null, calories: 486, protein: 17, carbs: 42, fat: 31, fiber: 34, sugar: 0, sodium: 16, servingSize: 100, servingUnit: "g", category: "seeds", verified: true },
]

async function main() {
  console.log("Seeding foods...")

  for (const food of foods) {
    await prisma.food.upsert({
      where: { id: `${food.name}-${food.servingSize}` }, // Create a unique identifier
      update: {},
      create: {
        ...food,
        userId: null, // Global foods
      },
    })
  }

  console.log("Foods seeded successfully!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
