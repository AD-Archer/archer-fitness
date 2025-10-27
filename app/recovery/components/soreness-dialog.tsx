"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import type { RecoveryFeeling } from "@/types/recovery";

const FEELINGS: Array<{
  value: RecoveryFeeling;
  label: string;
  description: string;
}> = [
  {
    value: "GOOD",
    label: "All clear",
    description: "Feels great—ready to train",
  },
  { value: "TIGHT", label: "Tight", description: "A little stiff or fatigued" },
  { value: "SORE", label: "Sore", description: "Soreness present" },
  { value: "INJURED", label: "Hurts", description: "Painful or needs rest" },
];

interface SorenessDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  bodyPartOptions: string[];
  onSubmit: (data: {
    bodyPart: string;
    feeling: RecoveryFeeling;
    intensity: number;
    note?: string;
  }) => Promise<boolean>;
  submitting: boolean;
}

export function SorenessDialog({
  isOpen,
  onOpenChange,
  bodyPartOptions,
  onSubmit,
  submitting,
}: SorenessDialogProps) {
  const [selectedBodyPart, setSelectedBodyPart] = useState<string>("");
  const [feeling, setFeeling] = useState<RecoveryFeeling>("SORE");
  const [intensity, setIntensity] = useState<number>(5);
  const [note, setNote] = useState<string>("");

  const handleSubmit = async () => {
    if (!selectedBodyPart) return;
    const success = await onSubmit({
      bodyPart: selectedBodyPart,
      feeling,
      intensity,
      note: note.trim() ? note.trim() : undefined,
    });

    if (success) {
      onOpenChange(false);
      setNote("");
      setIntensity(5);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Body check-in</DialogTitle>
          <DialogDescription>
            Capture how each area feels right now. These notes help guide your
            next session plan.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-5 pr-1">
          <div className="space-y-2">
            <Label>Body part</Label>
            <Select
              value={selectedBodyPart}
              onValueChange={setSelectedBodyPart}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose an area" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {bodyPartOptions.length ? (
                  bodyPartOptions.map((part) => (
                    <SelectItem key={part} value={part}>
                      {part}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="general">General</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>How does it feel?</Label>
            <div className="grid gap-3 sm:grid-cols-2">
              {FEELINGS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setFeeling(item.value)}
                  className={`rounded-lg border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/80 focus-visible:ring-offset-2 ${
                    feeling === item.value
                      ? "border-primary bg-primary/5"
                      : "border-border bg-background hover:bg-accent/40"
                  }`}
                >
                  <p className="font-medium text-sm">{item.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm font-medium">
              <Label htmlFor="intensity">Intensity {intensity}/10</Label>
              <span className="text-muted-foreground">
                0 = fine, 10 = severe
              </span>
            </div>
            <Slider
              id="intensity"
              max={10}
              min={0}
              step={1}
              value={[intensity]}
              onValueChange={(value) => setIntensity(value[0])}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Notes (optional)</Label>
            <Textarea
              id="note"
              placeholder="Anything specific you want to remember for next time?"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={3}
            />
          </div>
        </div>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end flex-shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedBodyPart || submitting}
            className="w-full sm:w-auto"
          >
            <CheckCircle2 className="mr-2 size-4" /> Save feedback
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
