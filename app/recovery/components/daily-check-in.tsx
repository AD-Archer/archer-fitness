"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DailyCheckInProps {
  onComplete?: () => void;
}

const bodyPartsList = [
  "Chest",
  "Back",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Core",
  "Glutes",
  "Hamstrings",
  "Quadriceps",
  "Calves",
];

export function DailyCheckIn({ onComplete }: DailyCheckInProps) {
  const [open, setOpen] = useState(false);
  const [selectedBodyPart, setSelectedBodyPart] = useState<string>("");
  const [sorenessLevel, setSorenessLevel] = useState<number[]>([5]);
  const [energyLevel, setEnergyLevel] = useState<number[]>([5]);
  const [notes, setNotes] = useState("");
  const [checkIns, setCheckIns] = useState<
    Array<{ bodyPart: string; soreness: number }>
  >([]);
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const handleAddBodyPart = () => {
    if (!selectedBodyPart) return;

    setCheckIns([
      ...checkIns,
      { bodyPart: selectedBodyPart, soreness: sorenessLevel[0] },
    ]);
    setSelectedBodyPart("");
    setSorenessLevel([5]);
  };

  const handleRemoveBodyPart = (index: number) => {
    setCheckIns(checkIns.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      // Submit check-in data
      const response = await fetch("/api/recovery/daily-check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: new Date().toISOString(),
          energyLevel: energyLevel[0],
          bodyParts: checkIns,
          notes: notes || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit check-in");
      }

      toast({
        title: "Check-in saved",
        description: "Your daily recovery status has been recorded.",
      });

      setOpen(false);
      setCheckIns([]);
      setNotes("");
      setEnergyLevel([5]);
      onComplete?.();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to save check-in. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const availableBodyParts = bodyPartsList.filter(
    (bp) => !checkIns.some((ci) => ci.bodyPart === bp),
  );

  return (
    <>
      <Card
        className="border-2 border-dashed border-primary/20 hover:border-primary/40 transition-colors cursor-pointer"
        onClick={() => setOpen(true)}
      >
        <CardContent className="flex flex-col items-center justify-center py-8 gap-3">
          <Calendar className="w-10 h-10 text-primary" />
          <div className="text-center">
            <h3 className="font-semibold text-lg">Daily Check-In</h3>
            <p className="text-sm text-muted-foreground">
              How are you feeling today?
            </p>
          </div>
          <Button variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Log Today's Status
          </Button>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Daily Recovery Check-In</DialogTitle>
            <DialogDescription>
              Track how you're feeling to help optimize your training schedule
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Overall Energy Level */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">
                How's your overall energy today?
              </Label>
              <div className="space-y-2">
                <Slider
                  min={1}
                  max={10}
                  step={1}
                  value={energyLevel}
                  onValueChange={setEnergyLevel}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Exhausted</span>
                  <span className="font-bold text-lg text-foreground">
                    {energyLevel[0]}/10
                  </span>
                  <span>Energized</span>
                </div>
              </div>
            </div>

            {/* Body Parts Soreness */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">
                Any muscle soreness or fatigue?
              </Label>

              {/* Added body parts */}
              {checkIns.length > 0 && (
                <div className="space-y-2 mb-4">
                  {checkIns.map((checkIn, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex-1">
                        <span className="font-medium">{checkIn.bodyPart}</span>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>Soreness:</span>
                          <div className="flex gap-1">
                            {[...Array(10)].map((_, i) => (
                              <div
                                key={i}
                                className={`w-2 h-4 rounded-sm ${
                                  i < checkIn.soreness
                                    ? "bg-orange-500"
                                    : "bg-muted-foreground/20"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="font-semibold">
                            {checkIn.soreness}/10
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveBodyPart(index)}
                        className="h-8 w-8 p-0"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add body part */}
              {availableBodyParts.length > 0 && (
                <div className="space-y-3 p-4 border rounded-lg">
                  <div className="grid grid-cols-3 gap-2">
                    {availableBodyParts.map((bp) => (
                      <Button
                        key={bp}
                        variant={
                          selectedBodyPart === bp ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setSelectedBodyPart(bp)}
                        className="h-auto py-2"
                      >
                        {bp}
                      </Button>
                    ))}
                  </div>

                  {selectedBodyPart && (
                    <div className="space-y-2">
                      <Label>Soreness Level for {selectedBodyPart}</Label>
                      <Slider
                        min={1}
                        max={10}
                        step={1}
                        value={sorenessLevel}
                        onValueChange={setSorenessLevel}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>No soreness</span>
                        <span className="font-bold text-foreground">
                          {sorenessLevel[0]}/10
                        </span>
                        <span>Very sore</span>
                      </div>
                      <Button
                        onClick={handleAddBodyPart}
                        className="w-full"
                        size="sm"
                      >
                        Add {selectedBodyPart}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Additional Notes (Optional)</Label>
              <Textarea
                placeholder="Any other observations? Sleep quality, stress level, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Submit */}
            <div className="flex gap-2">
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1"
              >
                {submitting ? "Saving..." : "Save Check-In"}
              </Button>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
