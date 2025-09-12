"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface ShoppingListProps {
  items: string[]
}

export function ShoppingList({ items }: ShoppingListProps) {
  return (
    <div>
      <h3 className="font-semibold mb-3 text-blue-600">Shopping List</h3>
      <div className="grid gap-2 md:grid-cols-3 text-sm">
        {items.map((item, index) => (
          <div key={index} className="flex items-center space-x-2">
            <Checkbox id={`item-${index}`} />
            <Label htmlFor={`item-${index}`} className="text-sm cursor-pointer">
              {item}
            </Label>
          </div>
        ))}
      </div>
    </div>
  )
}