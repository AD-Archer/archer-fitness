"use client";

import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { BodyDiagram } from "@/components/body-diagram";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface PainFeedback {
  id: string;
  bodyPart: string;
  feeling: "GOOD" | "TIGHT" | "SORE" | "INJURED";
  intensity: number | null;
  note: string | null;
  createdAt: string;
}

interface BodyPartData {
  name: string;
  slug: string;
  intensity: "none" | "light" | "moderate" | "heavy";
  lastWorked?: string;
  sets?: number;
}

export function PainBodyMap() {
  const [painData, setPainData] = useState<PainFeedback[]>([]);
  const [bodyParts, setBodyParts] = useState<BodyPartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchPainData = async () => {
    try {
      setLoading(true);
      // Fetch recovery feedback (pain reports)
      const response = await fetch("/api/recovery/feedback", {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch pain data");
      }

      const data = await response.json();

      // Filter to only show pain (not GOOD feeling)
      const painEntries = (data.feedback || []).filter(
        (f: PainFeedback) => f.feeling !== "GOOD",
      );

      setPainData(painEntries);

      // Map pain to body diagram format
      const painMap = new Map<string, PainFeedback>();
      painEntries.forEach((entry: PainFeedback) => {
        const existing = painMap.get(entry.bodyPart.toLowerCase());
        if (
          !existing ||
          new Date(entry.createdAt) > new Date(existing.createdAt)
        ) {
          painMap.set(entry.bodyPart.toLowerCase(), entry);
        }
      });

      const mapped: BodyPartData[] = [];
      painMap.forEach((entry) => {
        const intensity =
          entry.feeling === "INJURED"
            ? "heavy"
            : entry.feeling === "SORE"
              ? "moderate"
              : entry.feeling === "TIGHT"
                ? "light"
                : "none";

        mapped.push({
          name: entry.bodyPart,
          slug: entry.bodyPart.toLowerCase().replace(/\s+/g, "-"),
          intensity: intensity as "none" | "light" | "moderate" | "heavy",
          lastWorked: entry.createdAt,
          sets: entry.intensity || undefined,
        });
      });

      setBodyParts(mapped);
    } catch {
      toast({
        title: "Error loading pain data",
        description: "Unable to fetch your recovery feedback",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPainData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleResolvePain = async (feedbackId: string, bodyPart: string) => {
    try {
      setResolving(feedbackId);

      const response = await fetch(`/api/recovery/feedback/${feedbackId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to resolve pain");
      }

      toast({
        title: "Pain resolved",
        description: `${bodyPart} marked as no longer in pain`,
      });

      // Refresh the data
      await fetchPainData();
    } catch {
      toast({
        title: "Error",
        description: "Failed to resolve pain entry",
        variant: "destructive",
      });
    } finally {
      setResolving(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Body Readiness & Pain Map</CardTitle>
          <CardDescription>Areas reporting discomfort or pain</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96">
            <Skeleton className="w-full h-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasPain = painData.length > 0;

  return (
    <Card className={hasPain ? "border-rose-200 dark:border-rose-900/50" : ""}>
      <CardHeader>
        <CardTitle
          className={hasPain ? "text-rose-600 dark:text-rose-300" : ""}
        >
          Body Readiness & Pain Map
        </CardTitle>
        <CardDescription>
          {hasPain
            ? `${painData.length} area${painData.length > 1 ? "s" : ""} reporting discomfort`
            : "No pain or discomfort reported - you're ready to train!"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {hasPain && (
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-medium">Active Pain Reports:</h4>
            <div className="grid gap-2">
              {painData.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 bg-rose-50 dark:bg-rose-950/20 rounded-lg border border-rose-200 dark:border-rose-900/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          entry.feeling === "INJURED"
                            ? "destructive"
                            : entry.feeling === "SORE"
                              ? "default"
                              : "secondary"
                        }
                      >
                        {entry.feeling}
                      </Badge>
                      <span className="font-medium">{entry.bodyPart}</span>
                      {entry.intensity && (
                        <span className="text-sm text-muted-foreground">
                          (Level {entry.intensity}/10)
                        </span>
                      )}
                    </div>
                    {entry.note && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {entry.note}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Reported {new Date(entry.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleResolvePain(entry.id, entry.bodyPart)}
                    disabled={resolving === entry.id}
                    className="ml-2"
                  >
                    <X className="size-4 mr-1" />
                    Resolve
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-center overflow-auto">
          <BodyDiagram
            bodyParts={bodyParts}
            size="lg"
            colors={["#fb923c", "#f97316", "#dc2626"]} // Orange to red for pain
            interactive={false}
            dualView={true}
          />
        </div>
      </CardContent>
    </Card>
  );
}
