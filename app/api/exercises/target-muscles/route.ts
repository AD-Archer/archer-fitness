import { NextResponse } from "next/server";
import exercisesData from "@/data/all-exercises.json";

export async function GET() {
  try {
    const exercises = exercisesData.exercises || [];

    // Extract all unique target muscles
    const targetMusclesSet = new Set<string>();

    exercises.forEach((exercise: any) => {
      if (exercise.targetMuscles && Array.isArray(exercise.targetMuscles)) {
        exercise.targetMuscles.forEach((muscle: string) => {
          targetMusclesSet.add(muscle);
        });
      }
      // Also include target if it exists
      if (exercise.target) {
        targetMusclesSet.add(exercise.target);
      }
    });

    // Convert to sorted array
    const targetMuscles = Array.from(targetMusclesSet)
      .map((muscle) => {
        // Capitalize first letter of each word
        return muscle
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
      })
      .sort();

    return NextResponse.json(targetMuscles);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch target muscles" },
      { status: 500 },
    );
  }
}
