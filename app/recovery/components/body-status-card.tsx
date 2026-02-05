"use client";

import { formatDistanceToNow, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { BodyPartInsight, BodyPartStatus } from "@/types/recovery";

const STATUS_META: Record<
  BodyPartStatus,
  { label: string; badgeClass: string; dotClass: string; description: string }
> = {
  ready: {
    label: "Ready",
    badgeClass:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    dotClass: "bg-emerald-500",
    description: "Green light to train",
  },
  caution: {
    label: "Caution",
    badgeClass:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    dotClass: "bg-amber-500",
    description: "Light work or mobility only",
  },
  rest: {
    label: "Rest",
    badgeClass:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    dotClass: "bg-blue-500",
    description: "Needs more recovery",
  },
  pain: {
    label: "Pain",
    badgeClass:
      "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
    dotClass: "bg-rose-500",
    description: "Flagged by you",
  },
};

interface BodyStatusCardProps {
  part: BodyPartInsight;
  onResolve?: (feedbackId: string) => void;
}

export function BodyStatusCard({ part, onResolve }: BodyStatusCardProps) {
  const [resolving, setResolving] = useState(false);
  const { toast } = useToast();
  const meta = STATUS_META[part.status];
  const lastWorked = part.lastWorkout
    ? formatDistanceToNow(parseISO(part.lastWorkout), { addSuffix: true })
    : "Never";
  const remaining =
    part.hoursSinceLast !== null
      ? Math.max(0, part.recommendedRestHours - part.hoursSinceLast)
      : 0;

  const handleResolve = async () => {
    if (!part.feedback) return;

    // Find the feedback ID from the recovery API
    setResolving(true);
    try {
      // Fetch all feedback to find the ID
      const feedbackResponse = await fetch("/api/recovery/feedback");
      if (!feedbackResponse.ok) throw new Error("Failed to fetch feedback");

      const data = await feedbackResponse.json();
      const allFeedback = Array.isArray(data.feedback) ? data.feedback : [];
      const targetFeedback = allFeedback.find(
        (f: any) => f.bodyPart.toLowerCase() === part.bodyPart.toLowerCase(),
      );

      if (!targetFeedback) throw new Error("Feedback not found");

      const response = await fetch(
        `/api/recovery/feedback/${targetFeedback.id}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to resolve");
      }

      toast({
        title: "Pain resolved",
        description: `${part.bodyPart} marked as recovered.`,
      });

      onResolve?.(targetFeedback.id);
    } catch {
      toast({
        title: "Error",
        description: "Failed to resolve. Please try again.",
        variant: "destructive",
      });
    } finally {
      setResolving(false);
    }
  };

  return (
    <Card className="border-border/60">
      <CardHeader className="space-y-3 pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`size-2.5 rounded-full ${meta.dotClass}`}
              aria-hidden="true"
            />
            <CardTitle className="text-base font-semibold truncate">
              {part.bodyPart}
            </CardTitle>
          </div>
          <Badge className={meta.badgeClass}>{meta.label}</Badge>
        </div>
        <CardDescription className="text-xs text-muted-foreground">
          {meta.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-accent/60 px-2 py-0.5 text-accent-foreground">
            Last trained {lastWorked}
          </span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground dark:bg-muted/40">
            Avg. {part.averageSets} sets
          </span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground dark:bg-muted/40">
            {part.sevenDayCount} sessions this week
          </span>
        </div>
        <Separator className="my-2" />
        <div className="space-y-2 text-sm">
          <p className="flex items-center justify-between">
            <span className="text-muted-foreground">Recommended rest</span>
            <span>{part.recommendedRestHours}h</span>
          </p>
          <p className="flex items-center justify-between">
            <span className="text-muted-foreground">Ready in</span>
            <span>{remaining > 0 ? `${remaining.toFixed(1)}h` : "Now"}</span>
          </p>
        </div>
        {part.feedback && (
          <div className="rounded-lg border border-rose-200/70 bg-rose-50/60 p-3 text-xs dark:border-rose-900/40 dark:bg-rose-950/30 space-y-2">
            <div>
              <p className="font-medium text-rose-700 dark:text-rose-200">
                {part.feedback.feeling}
              </p>
              {part.feedback.note ? (
                <p className="mt-1 text-rose-600 dark:text-rose-300">
                  {part.feedback.note}
                </p>
              ) : (
                <p className="mt-1 text-muted-foreground">
                  Marked by you{" "}
                  {formatDistanceToNow(parseISO(part.feedback.createdAt), {
                    addSuffix: true,
                  })}
                </p>
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              className="w-full h-7 text-xs bg-white dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-emerald-950 border-rose-300 dark:border-rose-800"
              onClick={handleResolve}
              disabled={resolving}
            >
              {resolving ? (
                <span className="flex items-center gap-2">
                  <span className="size-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Resolving...
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3" />
                  Mark as Resolved
                </span>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
