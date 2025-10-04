"use client"

import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ScheduleItem } from "../types/schedule"

interface DeleteScheduleItemDialogProps {
  item: ScheduleItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (deleteOption: "this" | "future" | "all") => void
}

export function DeleteScheduleItemDialog({
  item,
  open,
  onOpenChange,
  onConfirm
}: DeleteScheduleItemDialogProps) {
  const [deleteOption, setDeleteOption] = useState<"this" | "future" | "all">("this")

  const isRecurring = item?.isRecurring || item?.repeatPattern === "weekly"

  const handleConfirm = () => {
    onConfirm(deleteOption)
    onOpenChange(false)
    setDeleteOption("this") // Reset for next time
  }

  if (!item) return null

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete "{item.title}"?</AlertDialogTitle>
          <AlertDialogDescription>
            {isRecurring ? (
              <>This is a recurring event. Choose what you'd like to delete:</>
            ) : (
              <>This action cannot be undone. This will permanently delete this scheduled item.</>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {isRecurring && (
          <RadioGroup value={deleteOption} onValueChange={(value) => setDeleteOption(value as "this" | "future" | "all")}>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="this" id="delete-this" />
                <Label htmlFor="delete-this" className="font-normal cursor-pointer">
                  <span className="font-medium">This occurrence only</span>
                  <p className="text-xs text-muted-foreground">
                    Delete only this scheduled instance
                  </p>
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <RadioGroupItem value="future" id="delete-future" />
                <Label htmlFor="delete-future" className="font-normal cursor-pointer">
                  <span className="font-medium">This and future occurrences</span>
                  <p className="text-xs text-muted-foreground">
                    Delete from this date forward
                  </p>
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="delete-all" />
                <Label htmlFor="delete-all" className="font-normal cursor-pointer">
                  <span className="font-medium">All occurrences</span>
                  <p className="text-xs text-muted-foreground">
                    Delete all past, present, and future occurrences
                  </p>
                </Label>
              </div>
            </div>
          </RadioGroup>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
