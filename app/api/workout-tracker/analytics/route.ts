import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";

// Weight conversion utilities
const LBS_TO_KG_RATIO = 0.453592;

function lbsToKg(lbs: number): number {
  return lbs * LBS_TO_KG_RATIO;
}

function convertWeightToUserUnits(
  weightInLbs: number,
  userUnits: string,
): number {
  const converted = userUnits === "metric" ? lbsToKg(weightInLbs) : weightInLbs;
  return Math.round(converted * 100) / 100; // Round to 2 decimal places
}

function convertVolumeToUserUnits(
  volumeInLbs: number,
  userUnits: string,
): number {
  const converted = userUnits === "metric" ? lbsToKg(volumeInLbs) : volumeInLbs;
  return Math.round(converted * 100) / 100; // Round to 2 decimal places
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // "strength", "volume", "records", "all"
    const limit = parseInt(searchParams.get("limit") || "100");
    const timeRange = searchParams.get("timeRange"); // "7days", "4weeks", "3months", "6months", "1year"

    // Get user preferences for unit conversion
    const userPrefs = await prisma.userPreference.findUnique({
      where: { userId: session.user.id },
      select: { app: true },
    });

    const appPrefs = userPrefs?.app as { units?: string } | null;
    const userUnits = appPrefs?.units || "imperial";

    // Calculate date filter based on time range
    let dateFilter = {};
    if (timeRange) {
      const now = new Date();
      let daysAgo = 0;

      switch (timeRange) {
        case "7days":
          daysAgo = 7;
          break;
        case "4weeks":
          daysAgo = 28;
          break;
        case "3months":
          daysAgo = 90;
          break;
        case "6months":
          daysAgo = 180;
          break;
        case "1year":
          daysAgo = 365;
          break;
        default:
          daysAgo = 90; // Default to 3 months
      }

      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - daysAgo);

      dateFilter = {
        startTime: {
          gte: startDate,
        },
      };
    }

    // Get all workout sessions with exercise and set data
    const workoutSessions = await prisma.workoutSession.findMany({
      where: {
        userId: session.user.id,
        ...dateFilter,
      },
      include: {
        exercises: {
          include: {
            exercise: {
              include: {
                muscles: {
                  include: {
                    muscle: true,
                  },
                },
              },
            },
            sets: {
              orderBy: {
                setNumber: "asc",
              },
            },
          },
          orderBy: {
            order: "asc",
          },
        },
      },
      orderBy: {
        startTime: "desc",
      },
      take: limit,
    });

    // Get all weight entries for the user to calculate bodyweight on specific dates
    const weightEntries = await prisma.weightEntry.findMany({
      where: { userId: session.user.id },
      orderBy: { date: "asc" },
      select: { weight: true, date: true },
    });

    // Helper function to get user's body weight on or before a specific date
    const getBodyWeightForDate = (targetDate: Date): number => {
      if (weightEntries.length === 0) return 150; // Default to 150 lbs

      // Find the weight entry closest to and before/on the target date
      let closestWeight = weightEntries[0].weight;
      for (const entry of weightEntries) {
        if (entry.date <= targetDate) {
          closestWeight = entry.weight;
        } else {
          break;
        }
      }
      return closestWeight;
    };

    // Process data based on type
    const analytics = {
      personalRecords: {},
      strengthProgress: {},
      volumeMetrics: {},
      generalStats: {},
      workoutSessions: workoutSessions, // Include full session data for duration calculations
    };

    // Calculate personal records and strength metrics
    const exerciseRecords = new Map<
      string,
      {
        maxWeight: number;
        maxReps: number;
        maxVolume: number;
        totalSets: number;
        totalReps: number;
        totalVolume: number;
        lastWorkout: string;
        frequency: number;
        muscleGroups: string[];
      }
    >();

    let totalCompletedSets = 0;
    let totalWorkoutTime = 0;
    let totalVolume = 0;
    const workoutDates = new Set<string>();

    workoutSessions.forEach((session) => {
      const sessionDateTime = new Date(session.startTime);
      const sessionDate = sessionDateTime.toISOString().split("T")[0];
      const sessionBodyWeight = getBodyWeightForDate(sessionDateTime);
      workoutDates.add(sessionDate);

      if (session.duration) {
        totalWorkoutTime += session.duration;
      }

      session.exercises.forEach((sessionEx) => {
        const exerciseName = sessionEx.exercise.name;
        const completedSets = sessionEx.sets.filter((set) => set.completed);
        totalCompletedSets += completedSets.length;

        if (!exerciseRecords.has(exerciseName)) {
          exerciseRecords.set(exerciseName, {
            maxWeight: 0,
            maxReps: 0,
            maxVolume: 0,
            totalSets: 0,
            totalReps: 0,
            totalVolume: 0,
            lastWorkout: sessionDate,
            frequency: 0,
            muscleGroups: sessionEx.exercise.muscles.map((m) => m.muscle.name),
          });
        }

        const record = exerciseRecords.get(exerciseName)!;
        record.frequency += 1;
        record.totalSets += completedSets.length;

        completedSets.forEach((set) => {
          // Track if this is a bodyweight exercise (no external weight)
          const isBodyweight = !set.weight || set.weight === 0;
          // Use body weight for volume calculations (from workout date)
          const weight = set.weight || sessionBodyWeight;

          // For personal records, only update maxWeight if there's actual external weight
          if (!isBodyweight && weight && weight > record.maxWeight) {
            record.maxWeight = weight;
          }
          if (set.reps && set.reps > record.maxReps) {
            record.maxReps = set.reps;
          }
          if (set.reps) {
            record.totalReps += set.reps;
          }
          if (set.reps) {
            const setVolume = weight * set.reps;
            record.totalVolume += setVolume;
            totalVolume += setVolume;
            if (setVolume > record.maxVolume) {
              record.maxVolume = setVolume;
            }
          }
        });

        if (sessionDate > record.lastWorkout) {
          record.lastWorkout = sessionDate;
        }
      });
    });

    // Convert to response format
    analytics.personalRecords = Object.fromEntries(
      Array.from(exerciseRecords.entries()).map(([name, data]) => [
        name,
        {
          maxWeight: convertWeightToUserUnits(data.maxWeight, userUnits),
          maxReps: data.maxReps,
          maxVolume: convertVolumeToUserUnits(data.maxVolume, userUnits),
          averageReps:
            data.totalSets > 0
              ? Math.round(data.totalReps / data.totalSets)
              : 0,
          averageVolume:
            data.totalSets > 0
              ? Math.round(
                  convertVolumeToUserUnits(
                    data.totalVolume / data.totalSets,
                    userUnits,
                  ) * 100,
                ) / 100
              : 0,
          frequency: data.frequency,
          lastWorkout: data.lastWorkout,
          muscleGroups: data.muscleGroups,
        },
      ]),
    );

    analytics.generalStats = {
      totalWorkouts: workoutDates.size,
      totalSets: totalCompletedSets,
      totalVolume: convertVolumeToUserUnits(totalVolume, userUnits),
      averageWorkoutTime:
        workoutDates.size > 0
          ? Math.round(totalWorkoutTime / workoutDates.size)
          : 0,
      averageSetsPerWorkout:
        workoutDates.size > 0
          ? Math.round(totalCompletedSets / workoutDates.size)
          : 0,
      averageVolumePerWorkout:
        workoutDates.size > 0
          ? Math.round(
              convertVolumeToUserUnits(
                totalVolume / workoutDates.size,
                userUnits,
              ) * 100,
            ) / 100
          : 0,
      uniqueExercises: exerciseRecords.size,
      workoutFrequency: workoutDates.size, // Could calculate per week if needed
    };

    // Strength progression (uses timeRange from dateFilter)
    const strengthProgress = new Map<
      string,
      Array<{ date: string; weight: number; reps: number }>
    >();

    workoutSessions.forEach((session) => {
      const sessionDate = session.startTime;
      const sessionBodyWeight = getBodyWeightForDate(new Date(sessionDate));
      session.exercises.forEach((sessionEx) => {
        const exerciseName = sessionEx.exercise.name;
        const bestSet = sessionEx.sets
          .filter((set) => set.completed && set.reps)
          .reduce(
            (best, current) => {
              // Use body weight for exercises with 0 weight
              const currentWeight = current.weight || sessionBodyWeight;
              const bestWeight = best?.weight || sessionBodyWeight;
              const currentScore = currentWeight * (current.reps || 1);
              const bestScore = bestWeight * (best?.reps || 1);
              return currentScore > bestScore ? current : best;
            },
            null as (typeof sessionEx.sets)[0] | null,
          );

        if (bestSet && bestSet.reps) {
          // For strength progression, store the actual weight (0 for bodyweight exercises)
          // Don't substitute body weight here - let the frontend handle display
          const weight = bestSet.weight || 0;
          if (!strengthProgress.has(exerciseName)) {
            strengthProgress.set(exerciseName, []);
          }
          strengthProgress.get(exerciseName)!.push({
            date: new Date(sessionDate).toISOString(),
            weight: convertWeightToUserUnits(weight, userUnits),
            reps: bestSet.reps,
          });
        }
      });
    });

    analytics.strengthProgress = Object.fromEntries(
      Array.from(strengthProgress.entries()).map(([name, progress]) => [
        name,
        progress.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        ),
      ]),
    );

    // Volume metrics - group by day, week, or month based on timeRange
    const volumeMetrics = new Map<
      string,
      { volume: number; workouts: number; sets: number }
    >();

    // Determine grouping strategy based on timeRange
    const getGroupKey = (sessionDate: Date): string => {
      if (timeRange === "7days") {
        // Group by day
        return sessionDate.toISOString().split("T")[0];
      } else if (timeRange === "6months" || timeRange === "1year") {
        // Group by month
        const year = sessionDate.getFullYear();
        const month = String(sessionDate.getMonth() + 1).padStart(2, "0");
        return `${year}-${month}-01`;
      } else {
        // Group by week for 4weeks and 3months
        const weekStart = new Date(sessionDate);
        weekStart.setDate(sessionDate.getDate() - sessionDate.getDay());
        return weekStart.toISOString().split("T")[0];
      }
    };

    workoutSessions.forEach((session) => {
      const sessionDate = new Date(session.startTime);
      const sessionBodyWeight = getBodyWeightForDate(sessionDate);
      const groupKey = getGroupKey(sessionDate);

      let sessionVolume = 0;
      let sessionSets = 0;
      session.exercises.forEach((exercise) => {
        const completedSets = exercise.sets.filter((set) => set.completed);
        sessionSets += completedSets.length;
        completedSets.forEach((set) => {
          if (set.reps) {
            // Use body weight if weight is 0 or missing
            const weight = set.weight || sessionBodyWeight;
            sessionVolume += weight * set.reps;
          }
        });
      });

      const current = volumeMetrics.get(groupKey) || {
        volume: 0,
        workouts: 0,
        sets: 0,
      };
      volumeMetrics.set(groupKey, {
        volume: convertVolumeToUserUnits(
          current.volume + sessionVolume,
          userUnits,
        ),
        workouts: current.workouts + 1,
        sets: current.sets + sessionSets,
      });
    });

    analytics.volumeMetrics = Object.fromEntries(
      Array.from(volumeMetrics.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, data]) => [date, data]),
    );

    // Filter response based on type parameter
    if (type === "strength") {
      return NextResponse.json({
        strengthProgress: analytics.strengthProgress,
        personalRecords: analytics.personalRecords,
        workoutSessions: analytics.workoutSessions,
      });
    } else if (type === "volume") {
      return NextResponse.json({
        volumeMetrics: analytics.volumeMetrics,
        generalStats: analytics.generalStats,
        workoutSessions: analytics.workoutSessions,
      });
    } else if (type === "records") {
      return NextResponse.json({
        personalRecords: analytics.personalRecords,
        workoutSessions: analytics.workoutSessions,
      });
    }

    return NextResponse.json(analytics);
  } catch (error) {
    logger.error("Error fetching workout analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch workout analytics" },
      { status: 500 },
    );
  }
}
