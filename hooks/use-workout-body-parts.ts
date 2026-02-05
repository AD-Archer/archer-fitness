"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { getBodyPartSlug } from "@/app/progress/components/body-part-mappings";
import { logger } from "@/lib/logger";

interface WorkoutBodyParts {
  bodyParts: string[];
  exercises: string[];
  loading: boolean;
  error: string | null;
}

/**
 * Hook to automatically fetch workout data for a specific date
 * and return the body parts that were worked
 */
export function useWorkoutBodyParts(date: Date = new Date()): WorkoutBodyParts {
  const [bodyParts, setBodyParts] = useState<string[]>([]);
  const [exercises, setExercises] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use date string to avoid infinite re-renders
  const dateStr = format(date, "yyyy-MM-dd");

  useEffect(() => {
    const fetchWorkoutData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(
          `/api/workout-tracker/workout-sessions?date=${dateStr}`,
        );
        
        if (!response.ok) {
          throw new Error("Failed to fetch workout data");
        }

        const sessions = await response.json();
        const sessionList = Array.isArray(sessions) ? sessions : [];

        const allExercises: string[] = [];
        const allBodyParts: string[] = [];

        for (const session of sessionList) {
          for (const ex of session.exercises || []) {
            if (ex.exercise?.name) {
              allExercises.push(ex.exercise.name);
            }

            // Collect body parts from the exercise's muscle/bodyPart relations
            for (const m of ex.exercise?.muscles || []) {
              if (m.muscle?.name) {
                const bodyPartSlug = getBodyPartSlug(m.muscle.name);
                allBodyParts.push(bodyPartSlug);
              }
            }
          }
        }

        // Remove duplicates and sort
        const uniqueBodyParts = [...new Set(allBodyParts)].sort();
        const uniqueExercises = [...new Set(allExercises)].sort();

        setBodyParts(uniqueBodyParts);
        setExercises(uniqueExercises);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to fetch workout data";
        setError(message);
        logger.error("Failed to fetch workout data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkoutData();
  }, [dateStr]); // Use dateStr instead of date object

  return {
    bodyParts,
    exercises,
    loading,
    error,
  };
}
