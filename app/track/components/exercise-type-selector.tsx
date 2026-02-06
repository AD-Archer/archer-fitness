"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Clock, Repeat2 } from "lucide-react";

interface ExerciseTypeSelectorProps {
  isOpen: boolean;
  onSelectType: (targetType: "reps" | "time") => void;
  onClose: () => void;
}

export function ExerciseTypeSelector({
  isOpen,
  onSelectType,
  onClose,
}: ExerciseTypeSelectorProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogTitle>Exercise Type</DialogTitle>
        <DialogDescription>
          Select how you want to track this exercise
        </DialogDescription>
        <div className="grid grid-cols-2 gap-4 py-4">
          <Card
            className="cursor-pointer border-2 hover:border-primary transition-colors"
            onClick={() => onSelectType("reps")}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Repeat2 className="w-5 h-5" />
                Reps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm">
                Track by repetitions and sets
              </CardDescription>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer border-2 hover:border-primary transition-colors"
            onClick={() => onSelectType("time")}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="w-5 h-5" />
                Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm">
                Track by duration
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
