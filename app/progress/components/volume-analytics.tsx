"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Dumbbell } from "lucide-react";
import { useEffect, useState } from "react";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { getWeightUnitAbbr } from "@/lib/weight-utils";
import { logger } from "@/lib/logger";

const IS_DEV = process.env.NODE_ENV !== "production";

interface VolumeData {
  week: string;
  volume: number;
  workouts: number;
}

interface VolumeMetric {
  volume: number;
  workouts: number;
  sets: number;
}

interface VolumeStats {
  averageVolume: number;
  peakVolume: number;
  volumeTrend: number;
}

interface VolumeAnalyticsProps {
  timeRange?: string;
}

export function VolumeAnalytics({
  timeRange = "3months",
}: VolumeAnalyticsProps) {
  const [volumeData, setVolumeData] = useState<VolumeData[]>([]);
  const [volumeStats, setVolumeStats] = useState<VolumeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { units } = useUserPreferences();
  const debugPayload = {
    component: "VolumeAnalytics",
    timeRange,
    dataPoints: volumeData.length,
    hasStats: Boolean(volumeStats),
    volumeStats,
    volumeData,
  };

  useEffect(() => {
    const fetchVolumeData = async () => {
      try {
        setLoading(true);
        setVolumeData([]);
        setVolumeStats(null);
        const response = await fetch(
          `/api/workout-tracker/analytics?type=volume&timeRange=${timeRange}`,
        );
        if (response.ok) {
          const data = await response.json();

          // Convert volume metrics to chart data
          const allEntries = Object.entries(data.volumeMetrics).sort((a, b) =>
            a[0].localeCompare(b[0]),
          );

          // Determine how many data points and label format based on timeRange
          let dataPointsToShow = 8;
          let labelFormat: (date: string, index: number) => string;

          switch (timeRange) {
            case "7days":
              dataPointsToShow = 7;
              labelFormat = (date: string) => {
                const d = new Date(date);
                return d.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                });
              };
              break;
            case "4weeks":
              dataPointsToShow = 4;
              labelFormat = (_date: string, index: number) =>
                `Week ${index + 1}`;
              break;
            case "3months":
              dataPointsToShow = 12; // 12 weeks
              labelFormat = (date: string) => {
                const d = new Date(date);
                return d.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              };
              break;
            case "6months":
              dataPointsToShow = 26; // 26 weeks
              labelFormat = (date: string) => {
                const d = new Date(date);
                return d.toLocaleDateString("en-US", { month: "short" });
              };
              break;
            case "1year":
              dataPointsToShow = 12; // 12 months
              labelFormat = (date: string) => {
                const d = new Date(date);
                return d.toLocaleDateString("en-US", { month: "short" });
              };
              break;
            default:
              dataPointsToShow = 12;
              labelFormat = (_date: string, index: number) =>
                `Week ${index + 1}`;
          }

          const chartData: VolumeData[] = allEntries
            .slice(-dataPointsToShow)
            .map(([dateKey, volumeData], index) => {
              const metric = volumeData as VolumeMetric;

              // For month-based views (6 months, 1 year), aggregate by month name only
              const label = labelFormat(dateKey, index);

              return {
                week: label,
                volume: metric.volume,
                workouts: metric.workouts,
              };
            });

          // For 1 year view, consolidate duplicate month labels by summing their values
          let finalChartData = chartData;
          if (timeRange === "1year" || timeRange === "6months") {
            const monthMap = new Map<
              string,
              { volume: number; workouts: number }
            >();

            chartData.forEach((item) => {
              const existing = monthMap.get(item.week);
              if (existing) {
                existing.volume += item.volume;
                existing.workouts += item.workouts;
              } else {
                monthMap.set(item.week, {
                  volume: item.volume,
                  workouts: item.workouts,
                });
              }
            });

            finalChartData = Array.from(monthMap.entries()).map(
              ([label, data]) => ({
                week: label,
                volume: data.volume,
                workouts: data.workouts,
              }),
            );
          }

          setVolumeData(finalChartData);

          // Calculate stats from general stats
          const stats = data.generalStats;
          if (stats && chartData.length > 0) {
            const volumes = chartData.map((d) => d.volume);
            const averageVolume =
              volumes.length > 0
                ? volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length
                : 0;
            const peakVolume = volumes.length > 0 ? Math.max(...volumes) : 0;
            const firstWeekVolume = chartData[0]?.volume || 0;
            const lastWeekVolume = chartData[chartData.length - 1]?.volume || 0;
            const volumeTrend =
              firstWeekVolume > 0
                ? Math.round(
                    ((lastWeekVolume - firstWeekVolume) / firstWeekVolume) *
                      100,
                  )
                : 0;

            setVolumeStats({
              averageVolume,
              peakVolume,
              volumeTrend,
            });
          }
        }
      } catch (error) {
        logger.error("Failed to fetch volume data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVolumeData();
  }, [timeRange]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-green-600" />
              Training Volume Trends
            </CardTitle>
            <CardDescription>Loading your volume data...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center">
              <div className="text-muted-foreground">Loading chart...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-green-600" />
            Training Volume Trends
          </CardTitle>
          <CardDescription>
            Weekly volume and workout frequency analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          {volumeData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis
                    dataKey="week"
                    className="text-xs"
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis
                    className="text-xs"
                    stroke="hsl(var(--border))"
                    tick={{ fill: "hsl(var(--foreground))" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--foreground))",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                    formatter={(value?: number) =>
                      value !== undefined
                        ? [
                            `${value.toLocaleString()} ${getWeightUnitAbbr(units)}`,
                            "Volume",
                          ]
                        : ["", "Volume"]
                    }
                  />
                  <Bar
                    dataKey="volume"
                    fill="#10b981"
                    name={`Volume (${getWeightUnitAbbr(units)})`}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-muted-foreground">
              No volume data available. Complete workouts with tracked weights
              to see your training volume!
            </div>
          )}
        </CardContent>
      </Card>

      {/* Volume Breakdown */}
      {volumeStats && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Average Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {volumeStats.averageVolume.toLocaleString()}{" "}
                {getWeightUnitAbbr(units)}
              </div>
              <p className="text-sm text-muted-foreground">
                {getWeightUnitAbbr(units)} per week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Peak Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {volumeStats.peakVolume.toLocaleString()}{" "}
                {getWeightUnitAbbr(units)}
              </div>
              <p className="text-sm text-muted-foreground">highest week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Volume Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${volumeStats.volumeTrend >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {volumeStats.volumeTrend > 0 ? "+" : ""}
                {volumeStats.volumeTrend}%
              </div>
              <p className="text-sm text-muted-foreground">vs first week</p>
            </CardContent>
          </Card>
        </div>
      )}

      {IS_DEV && (
        <Card className="mt-4 border-red-500">
          <CardHeader>
            <CardTitle className="text-red-500">Volume Debug Info</CardTitle>
            <CardDescription>
              Visible only in non-production environments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-96">
              {JSON.stringify(debugPayload, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
