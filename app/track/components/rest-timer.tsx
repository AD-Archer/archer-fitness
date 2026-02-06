"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatTime } from "../utils";
import { Plus, Minus } from "lucide-react";

interface RestTimerProps {
  restTimer: number;
  onSkipRest: () => void;
  onAddTime?: (seconds: number) => void;
  onRemoveTime?: (seconds: number) => void;
}

export function RestTimer({
  restTimer,
  onSkipRest,
  onAddTime,
  onRemoveTime,
}: RestTimerProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/20 to-transparent z-40">
      <Card className="border-2 border-primary bg-primary/10 dark:bg-primary/20 backdrop-blur-sm mx-auto max-w-md">
        <CardContent className="pt-8 pb-6">
          <div className="text-center space-y-4">
            <div>
              <div className="text-5xl md:text-6xl font-bold text-primary mb-2 tabular-nums">
                {formatTime(restTimer)}
              </div>
              <div className="text-sm text-muted-foreground uppercase tracking-wide">
                Rest Time Remaining
              </div>
            </div>

            <div className="flex items-center justify-center gap-2">
              <Button
                onClick={() => onRemoveTime?.(15)}
                variant="outline"
                size="sm"
                className="h-9 w-9 p-0"
                title="Remove 15 seconds"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => onAddTime?.(15)}
                variant="outline"
                size="sm"
                className="h-9 w-9 p-0"
                title="Add 15 seconds"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <Button
              onClick={onSkipRest}
              variant="default"
              className="w-full bg-primary hover:bg-primary/90"
            >
              Skip Rest
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
