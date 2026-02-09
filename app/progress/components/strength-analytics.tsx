"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, Award } from "lucide-react";
import { useEffect, useState } from "react";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { getWeightUnitAbbr } from "@/lib/weight-utils";
import { logger } from "@/lib/logger";

const IS_DEV = process.env.NODE_ENV !== "production";

interface StrengthProgress {
  date: string;
  [exerciseName: string]: number | string;
}

interface PersonalRecord {
  exercise: string;
  weight: number;
  date: string;
  improvement: string;
  reps: number;
}

interface StrengthProgressEntry {
  date: string;
  weight: number;
  reps: number;
}

interface PersonalRecordData {
  maxWeight: number;
  maxReps: number;
  maxVolume: number;
  averageReps: number;
  averageVolume: number;
  frequency: number;
  lastWorkout: string;
  muscleGroups: string[];
}

interface StrengthAnalyticsProps {
  timeRange?: string;
  metric?: "weight" | "reps";
  onMetricChange?: (metric: "weight" | "reps") => void;
}

export function StrengthAnalytics({
  timeRange = "3months",
  metric = "weight",
  onMetricChange,
}: StrengthAnalyticsProps) {
  const [strengthData, setStrengthData] = useState<StrengthProgress[]>([]);
  const [chartDataWeight, setChartDataWeight] = useState<StrengthProgress[]>(
    [],
  );
  const [chartDataReps, setChartDataReps] = useState<StrengthProgress[]>([]);
  const [exerciseFrequency, setExerciseFrequency] = useState<string[]>([]);
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const { units } = useUserPreferences();

  useEffect(() => {
    const fetchStrengthData = async () => {
      try {
        setLoading(true);
        setChartDataWeight([]);
        setChartDataReps([]);
        setPersonalRecords([]);
        setExerciseFrequency([]);
        const response = await fetch(
          `/api/workout-tracker/analytics?type=strength&timeRange=${timeRange}`,
        );
        if (response.ok) {
          const data = await response.json();

          // Convert the strength progress data to chart format
          const exerciseNames = Object.keys(data.strengthProgress);
          const allDates = new Set<string>();

          // Collect all unique dates
          exerciseNames.forEach((exercise) => {
            data.strengthProgress[exercise].forEach(
              (entry: StrengthProgressEntry) => {
                allDates.add(entry.date.split("T")[0]);
              },
            );
          });

          const sortedDates = Array.from(allDates).sort();

          // Determine date format and grouping based on time range
          let dateFormatter: (date: string) => string;
          let groupByMonth = false;

          switch (timeRange) {
            case "7days":
              dateFormatter = (date: string) => {
                const d = new Date(date);
                return d.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                });
              };
              break;
            case "4weeks":
            case "3months":
              dateFormatter = (date: string) => {
                const d = new Date(date);
                return d.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              };
              break;
            case "6months":
            case "1year":
              groupByMonth = true;
              dateFormatter = (date: string) => {
                const d = new Date(date);
                return d.toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                });
              };
              break;
            default:
              dateFormatter = (date: string) => {
                const d = new Date(date);
                return d.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              };
          }

          // Create chart data for both weight and reps
          const createChartData = (
            metricKey: "weight" | "reps",
          ): StrengthProgress[] => {
            const dataByLabel = new Map<string, StrengthProgress>();

            sortedDates.forEach((date) => {
              const label = dateFormatter(date);

              exerciseNames.forEach((exercise) => {
                const exerciseData = data.strengthProgress[exercise];
                // Find the entry for this exact date
                const dayEntries = exerciseData.filter(
                  (entry: StrengthProgressEntry) => {
                    const entryDate = entry.date.split("T")[0];
                    return entryDate === date;
                  },
                );

                // If there are entries for this date, use the max value
                if (dayEntries.length > 0) {
                  const maxValue = Math.max(
                    ...dayEntries.map(
                      (e: StrengthProgressEntry) => e[metricKey],
                    ),
                  );

                  // For reps, always show the value
                  // For weight, show even if 0 (bodyweight exercises)
                  if (metricKey === "reps" || maxValue >= 0) {
                    if (!dataByLabel.has(label)) {
                      dataByLabel.set(label, { date: label });
                    }
                    const dataPoint = dataByLabel.get(label)!;

                    // If grouping by month, keep the max value for the month
                    if (groupByMonth && dataPoint[exercise] !== undefined) {
                      dataPoint[exercise] = Math.max(
                        dataPoint[exercise] as number,
                        maxValue,
                      );
                    } else {
                      dataPoint[exercise] = maxValue;
                    }
                  }
                }
              });
            });

            return Array.from(dataByLabel.values()).filter(
              (point) => Object.keys(point).length > 1,
            );
          };

          const chartDataWeight = createChartData("weight");
          const chartDataReps = createChartData("reps");

          // Store both datasets for metric switching
          setChartDataWeight(chartDataWeight);
          setChartDataReps(chartDataReps);

          // Store debug info (development only)
          if (IS_DEV) {
            setDebugInfo({
              timeRange,
              exerciseNames: Object.keys(data.strengthProgress),
              totalDataPoints: chartDataReps.length,
              strengthProgress: data.strengthProgress,
            });
          } else {
            setDebugInfo(null);
          }

          // Get top 4 exercises - prioritize recent workouts over frequency
          // This ensures we see exercises from recent workouts even if they're not frequently trained
          const exerciseFrequency = Object.entries(data.personalRecords)
            .sort(([, a], [, b]) => {
              const aData = a as PersonalRecordData;
              const bData = b as PersonalRecordData;

              // Sort by most recent workout first
              const dateA = new Date(aData.lastWorkout).getTime();
              const dateB = new Date(bData.lastWorkout).getTime();

              return dateB - dateA;
            })
            .slice(0, 4)
            .map(([name]) => name);

          setExerciseFrequency(exerciseFrequency);

          // Create personal records array with more detailed info
          const records: PersonalRecord[] = Object.entries(data.personalRecords)
            .sort(
              ([, a], [, b]) =>
                (b as PersonalRecordData).maxWeight -
                (a as PersonalRecordData).maxWeight,
            )
            .slice(0, 6)
            .map(([exerciseName, record]) => {
              const recordData = record as PersonalRecordData;
              return {
                exercise: exerciseName,
                weight: recordData.maxWeight,
                reps: recordData.maxReps,
                date: new Date(recordData.lastWorkout).toLocaleDateString(
                  "en-US",
                  { month: "short", day: "numeric", year: "numeric" },
                ),
                improvement: `Max: ${recordData.maxWeight} ${getWeightUnitAbbr(units)} × ${recordData.maxReps}`,
              };
            });

          setPersonalRecords(records);
        }
      } catch (error) {
        logger.error("Failed to fetch strength data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStrengthData();
  }, [timeRange, units]);

  // Update chart data when metric changes
  useEffect(() => {
    const dataToUse = metric === "weight" ? chartDataWeight : chartDataReps;
    const filteredChartData = dataToUse
      .map((dataPoint) => {
        const filtered: StrengthProgress = { date: dataPoint.date };
        exerciseFrequency.forEach((exercise) => {
          if (dataPoint[exercise] !== undefined) {
            filtered[exercise] = dataPoint[exercise];
          }
        });
        return filtered;
      })
      .filter((point) => Object.keys(point).length > 1); // Only keep points with at least one exercise value

    setStrengthData(filteredChartData);
  }, [metric, chartDataWeight, chartDataReps, exerciseFrequency]);

  const getExerciseColor = (index: number) => {
    const colors = [
      "#3b82f6",
      "#10b981",
      "#f59e0b",
      "#ef4444",
      "#8b5cf6",
      "#06b6d4",
    ];
    return colors[index % colors.length];
  };

  const exerciseNames =
    strengthData.length > 0
      ? Object.keys(strengthData[0]).filter((key) => key !== "date")
      : [];

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Strength Progression
            </CardTitle>
            <CardDescription>Loading your strength data...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center">
              <div className="text-muted-foreground">Loading chart...</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-600" />
              Personal Records
            </CardTitle>
            <CardDescription>Loading your personal bests...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 4 }, (_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card/50 animate-pulse"
                >
                  <div>
                    <div className="h-4 bg-muted rounded w-24 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-16"></div>
                  </div>
                  <div className="text-right">
                    <div className="h-6 bg-muted rounded w-16 mb-1"></div>
                    <div className="h-4 bg-muted rounded w-12"></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Strength Progression
            </CardTitle>
            <CardDescription>
              Track your major lift improvements over time
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant={metric === "weight" ? "default" : "outline"}
              size="sm"
              onClick={() => onMetricChange?.("weight")}
            >
              Weight
            </Button>
            <Button
              variant={metric === "reps" ? "default" : "outline"}
              size="sm"
              onClick={() => onMetricChange?.("reps")}
            >
              Reps
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {strengthData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={strengthData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis
                    dataKey="date"
                    className="text-xs"
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis
                    className="text-xs"
                    stroke="hsl(var(--border))"
                    tick={{ fill: "hsl(var(--foreground))" }}
                    label={{
                      value:
                        metric === "weight"
                          ? `Weight (${getWeightUnitAbbr(units)})`
                          : "Reps",
                      angle: -90,
                      position: "insideLeft",
                      fill: "hsl(var(--foreground))",
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--foreground))",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                    formatter={(value) => [
                      value,
                      metric === "weight"
                        ? `${getWeightUnitAbbr(units)}`
                        : "reps",
                    ]}
                  />
                  {exerciseNames.map((exerciseName, index) => (
                    <Line
                      key={exerciseName}
                      type="monotone"
                      dataKey={exerciseName}
                      stroke={getExerciseColor(index)}
                      strokeWidth={2}
                      name={exerciseName}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      connectNulls={true}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-muted-foreground">
              No strength progression data available. Complete some workouts to
              see your progress!
            </div>
          )}
        </CardContent>
      </Card>

      {/* Personal Records */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-600" />
            Personal Records
          </CardTitle>
          <CardDescription>
            Your current best lifts and recent achievements
          </CardDescription>
        </CardHeader>
        <CardContent>
          {personalRecords.length > 0 ? (
            <div className="space-y-4">
              {personalRecords.map((record, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card/50"
                >
                  <div>
                    <h3 className="font-medium">{record.exercise}</h3>
                    <p className="text-sm text-muted-foreground">
                      {record.date}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold">
                      {record.weight} {getWeightUnitAbbr(units)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {record.reps} reps
                    </div>
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    >
                      Max: {record.weight} {getWeightUnitAbbr(units)} ×{" "}
                      {record.reps}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No personal records yet. Start tracking weights in your workouts
              to see your best lifts!
            </div>
          )}
        </CardContent>
      </Card>

      {/* Debug Panel */}
      {IS_DEV && debugInfo && (
        <Card className="mt-4 border-red-500">
          <CardHeader>
            <CardTitle className="text-red-500">
              Strength Debug Info
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-xs">
              <div>
                <strong>Component:</strong> StrengthAnalytics
              </div>
              <div>
                <strong>Time Range:</strong> {debugInfo.timeRange}
              </div>
              <div>
                <strong>Total Data Points:</strong> {debugInfo.totalDataPoints}
              </div>
              <div>
                <strong>Exercises in Data:</strong>{" "}
                {debugInfo.exerciseNames?.join(", ")}
              </div>
              <div>
                <strong>Top 4 Exercises:</strong> {exerciseFrequency.join(", ")}
              </div>
              <div>
                <strong>Chart Data Points:</strong> {strengthData.length}
              </div>
              <div>
                <strong>Current Metric:</strong> {metric}
              </div>
              <details>
                <summary className="cursor-pointer font-bold">
                  Raw Strength Progress Data
                </summary>
                <pre className="mt-2 p-2 bg-muted rounded overflow-auto max-h-96">
                  {JSON.stringify(debugInfo.strengthProgress, null, 2)}
                </pre>
              </details>
              <details>
                <summary className="cursor-pointer font-bold">
                  Chart Data ({metric})
                </summary>
                <pre className="mt-2 p-2 bg-muted rounded overflow-auto max-h-96">
                  {JSON.stringify(strengthData, null, 2)}
                </pre>
              </details>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
