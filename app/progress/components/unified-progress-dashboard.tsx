"use client";

import React, { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Zap,
  TrendingUp,
  Activity,
  Camera,
  Dumbbell,
  BarChart3,
  PieChart,
  Scale,
  Trophy,
} from "lucide-react";
import { ProgressPhotoWithBody } from "./progress-photo-with-body";
import { BodyPartFilter } from "./body-part-filter";
import { ProgressPhotoUpload } from "./progress-photo-upload";
import { KeyMetricsCards } from "./key-metrics-cards";
import { FitnessOverview } from "./fitness-overview";
import { StrengthAnalytics } from "./strength-analytics";
import { VolumeAnalytics } from "./volume-analytics";
import { DistributionAnalytics } from "./distribution-analytics";
import { BodyCompositionAnalytics } from "./body-composition-analytics";
import { AchievementsAnalytics } from "./achievements-analytics";
import { BodyDiagram } from "@/components/body-diagram";
import { photoMatchesFilter, slugToName } from "./body-part-mappings";
import { logger } from "@/lib/logger";

interface ProgressPhoto {
  id: string;
  url: string;
  notes?: string;
  bodyParts?: string[];
  uploadDate: string;
  createdAt: string;
}

interface DayStats {
  workouts: number;
  totalVolume: number;
  totalSets: number;
  exercises: string[];
  bodyParts: string[];
}

interface UnifiedProgressDashboardProps {
  onPhotoUploaded?: () => void;
}

export function UnifiedProgressDashboard({
  onPhotoUploaded,
}: UnifiedProgressDashboardProps) {
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedParts, setSelectedParts] = useState<string[]>([]);
  const [timeRange, setTimeRange] = useState("3months");
  const [dayStats, setDayStats] = useState<Record<string, DayStats>>({});
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState("analytics");
  const [analyticsTab, setAnalyticsTab] = useState("overview");
  const [strengthMetric, setStrengthMetric] = useState<"weight" | "reps">(
    "weight",
  );

  // Fetch photos
  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/progress/photos", {
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch progress photos");
        }

        const data = await response.json();
        setPhotos(data.photos || []);
      } catch (error) {
        logger.error("Failed to fetch photos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPhotos();
  }, [refreshKey]);

  // Fetch stats for each unique date with photos
  useEffect(() => {
    const fetchDayStats = async () => {
      const uniqueDates = [
        ...new Set(
          photos.map((p) => format(new Date(p.uploadDate), "yyyy-MM-dd")),
        ),
      ];

      // Also ensure today is always included
      const today = format(new Date(), "yyyy-MM-dd");
      if (!uniqueDates.includes(today)) {
        uniqueDates.push(today);
      }

      const stats: Record<string, DayStats> = {};

      for (const date of uniqueDates) {
        try {
          const response = await fetch(
            `/api/workout-tracker/workout-sessions?date=${date}`,
          );
          if (response.ok) {
            const sessions = await response.json();
            // sessions is an array of workout sessions
            const sessionList = Array.isArray(sessions) ? sessions : [];

            const allExercises: string[] = [];
            const allBodyParts: string[] = [];
            let totalSets = 0;
            let totalVolume = 0;

            for (const session of sessionList) {
              for (const ex of session.exercises || []) {
                allExercises.push(ex.exercise?.name || "Unknown");

                // Collect body parts from the exercise's muscle/bodyPart relations
                for (const m of ex.exercise?.muscles || []) {
                  if (m.muscle?.name) allBodyParts.push(m.muscle.name);
                }

                for (const s of ex.sets || []) {
                  if (s.completed) {
                    totalSets++;
                    totalVolume += (s.weight || 0) * (s.reps || 0);
                  }
                }
              }
            }

            stats[date] = {
              workouts: sessionList.length,
              totalVolume,
              totalSets,
              exercises: [...new Set(allExercises)],
              bodyParts: [...new Set(allBodyParts)],
            };
          }
        } catch (error) {
          logger.error(`Failed to fetch stats for ${date}:`, error);
        }
      }

      setDayStats(stats);
    };

    fetchDayStats();
  }, [photos, refreshKey]);

  // Filter photos by selected body parts (selectedParts are now slugs)
  const filteredPhotos = useMemo(() => {
    if (selectedParts.length === 0) {
      return photos;
    }

    return photos.filter((photo) => {
      const photoParts = photo.bodyParts || [];
      return photoMatchesFilter(photoParts, selectedParts);
    });
  }, [photos, selectedParts]);

  const handlePhotoUploaded = () => {
    setRefreshKey((prev) => prev + 1);
    onPhotoUploaded?.();
  };

  // Get stats for today
  const todayStats = useMemo(() => {
    const todayKey = format(new Date(), "yyyy-MM-dd");
    return dayStats[todayKey];
  }, [dayStats]);

  // Get all-time stats
  const allTimeStats = useMemo(() => {
    if (Object.keys(dayStats).length === 0) return null;

    const totalWorkouts = Object.values(dayStats).reduce(
      (sum, stat) => sum + stat.workouts,
      0,
    );
    const totalVolume = Object.values(dayStats).reduce(
      (sum, stat) => sum + stat.totalVolume,
      0,
    );
    const totalSets = Object.values(dayStats).reduce(
      (sum, stat) => sum + stat.totalSets,
      0,
    );

    return {
      totalWorkouts,
      totalVolume,
      totalSets,
      uniqueExercises: new Set(
        Object.values(dayStats).flatMap((stat) => stat.exercises),
      ).size,
      uniqueBodyParts: new Set(
        Object.values(dayStats).flatMap((stat) => stat.bodyParts),
      ).size,
    };
  }, [dayStats]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Progress Analytics
          </h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive insights into your fitness journey and performance
            trends
          </p>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="photos">Photos & Body</TabsTrigger>
          <TabsTrigger value="filter">Body Parts</TabsTrigger>
          <TabsTrigger value="upload">Upload</TabsTrigger>
        </TabsList>

        {/* Analytics Tab - contains all dashboards */}
        <TabsContent value="analytics" className="space-y-6">
          {/* View Period Selector */}
          <div className="flex items-center gap-2 p-4 border rounded-lg bg-card/50">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">View period:</span>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="4weeks">Last 4 Weeks</SelectItem>
                <SelectItem value="3months">Last 3 Months</SelectItem>
                <SelectItem value="6months">Last 6 Months</SelectItem>
                <SelectItem value="1year">Last Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Key Metrics: Workouts + Weight */}
          <KeyMetricsCards timeRange={timeRange} />
          {/* Quick stats row */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  Today&apos;s Workouts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {todayStats?.workouts || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {todayStats?.exercises.length || 0} exercises
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-500" />
                  Today&apos;s Volume
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {todayStats?.totalVolume.toLocaleString() || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {todayStats?.totalSets || 0} sets
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-green-500" />
                  Total Workouts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {allTimeStats?.totalWorkouts || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">all time</p>
              </CardContent>
            </Card>

            {/* Photo count card (no actual photos shown) */}
            <Card
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => setActiveTab("photos")}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Camera className="h-4 w-4 text-pink-500" />
                  Progress Photos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{photos.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {photos.length === 0
                    ? "Upload your first photo"
                    : "Click to view photos"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Analytics Sub-Tabs */}
          <Tabs
            value={analyticsTab}
            onValueChange={setAnalyticsTab}
            className="space-y-6"
          >
            {/* Desktop: full tabs */}
            <div className="hidden lg:block">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="overview" className="gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="strength" className="gap-1.5">
                  <Dumbbell className="h-3.5 w-3.5" />
                  Strength
                </TabsTrigger>
                <TabsTrigger value="volume" className="gap-1.5">
                  <BarChart3 className="h-3.5 w-3.5" />
                  Volume
                </TabsTrigger>
                <TabsTrigger value="distribution" className="gap-1.5">
                  <PieChart className="h-3.5 w-3.5" />
                  Muscle Distribution
                </TabsTrigger>
                <TabsTrigger value="body" className="gap-1.5">
                  <Scale className="h-3.5 w-3.5" />
                  Body Comp
                </TabsTrigger>
                <TabsTrigger value="achievements" className="gap-1.5">
                  <Trophy className="h-3.5 w-3.5" />
                  Achievements
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Mobile: dropdown */}
            <div className="block lg:hidden">
              <Select value={analyticsTab} onValueChange={setAnalyticsTab}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">Overview</SelectItem>
                  <SelectItem value="strength">Strength</SelectItem>
                  <SelectItem value="volume">Volume</SelectItem>
                  <SelectItem value="distribution">
                    Muscle Distribution
                  </SelectItem>
                  <SelectItem value="body">Body Comp</SelectItem>
                  <SelectItem value="achievements">Achievements</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <TabsContent value="overview">
              <FitnessOverview timeRange={timeRange} />
            </TabsContent>
            <TabsContent value="strength">
              <StrengthAnalytics
                timeRange={timeRange}
                metric={strengthMetric}
                onMetricChange={setStrengthMetric}
              />
            </TabsContent>
            <TabsContent value="volume">
              <VolumeAnalytics timeRange={timeRange} />
            </TabsContent>
            <TabsContent value="distribution">
              <DistributionAnalytics timeRange={timeRange} />
            </TabsContent>
            <TabsContent value="body">
              <BodyCompositionAnalytics timeRange={timeRange} />
            </TabsContent>
            <TabsContent value="achievements">
              <AchievementsAnalytics timeRange={timeRange} />
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Photos & Body Tab */}
        <TabsContent value="photos" className="space-y-6">
          {filteredPhotos.length > 0 ? (
            <ProgressPhotoWithBody
              photos={filteredPhotos}
              loading={loading}
              onPhotoDeleted={() => setRefreshKey((prev) => prev + 1)}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Photo & Body Analysis</CardTitle>
              </CardHeader>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  {selectedParts.length > 0
                    ? "No photos found for selected body parts"
                    : "No progress photos yet"}
                </p>
                {selectedParts.length === 0 && (
                  <Button
                    onClick={() => setActiveTab("upload")}
                    className="mt-2"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Upload Your First Photo
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Body Parts Filter Tab */}
        <TabsContent value="filter" className="space-y-6">
          <BodyPartFilter
            selectedParts={selectedParts}
            onPartSelect={setSelectedParts}
            showLastWorked={true}
            lastWorkedDates={
              selectedParts.reduce(
                (acc, slug) => {
                  const dates = Object.entries(dayStats)
                    .filter(([, stat]) =>
                      stat.bodyParts.some((p) => {
                        const pLower = p.toLowerCase();
                        const slugLower = slug.toLowerCase();
                        return (
                          pLower === slugLower ||
                          pLower.includes(slugLower) ||
                          slugLower.includes(pLower)
                        );
                      }),
                    )
                    .map(([date]) => date)
                    .sort()
                    .reverse();

                  acc[slug] = dates[0]
                    ? format(new Date(dates[0] + "T12:00:00"), "MMM d, yyyy")
                    : "Never";
                  return acc;
                },
                {} as Record<string, string>,
              ) || {}
            }
          />

          {/* Body Diagram showing selected parts */}
          {selectedParts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Selected Muscle Groups</CardTitle>
                <CardDescription>
                  Highlighting {selectedParts.length} selected body part
                  {selectedParts.length !== 1 ? "s" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BodyDiagram
                  bodyParts={selectedParts.map((slug) => ({
                    name: slugToName(slug),
                    slug,
                    intensity: "moderate" as const,
                  }))}
                  size="lg"
                  interactive={false}
                  dualView
                  showLegend={false}
                  colors={["#22c55e", "#16a34a", "#15803d"]}
                />
              </CardContent>
            </Card>
          )}

          {/* Filtered Results */}
          {selectedParts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Filtered Results</CardTitle>
                <CardDescription>
                  Showing {filteredPhotos.length} photo
                  {filteredPhotos.length !== 1 ? "s" : ""} for selected body
                  parts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {filteredPhotos.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      No photos found for the selected body parts
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Upload photos and tag them with body parts to see them
                      here
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredPhotos.map((photo) => (
                      <div
                        key={photo.id}
                        className="relative group rounded-lg overflow-hidden bg-muted aspect-square"
                      >
                        {photo.url ? (
                          <img
                            src={photo.url}
                            alt="Progress"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                            N/A
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
                        <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/80 to-transparent">
                          <p className="text-xs text-white font-medium">
                            {format(new Date(photo.uploadDate), "MMM d, yyyy")}
                          </p>
                          {photo.bodyParts && photo.bodyParts.length > 0 && (
                            <p className="text-[10px] text-white/80 mt-0.5 truncate">
                              {photo.bodyParts.map(slugToName).join(", ")}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Upload Tab */}
        <TabsContent value="upload" className="space-y-6">
          <ProgressPhotoUpload onPhotoUploaded={handlePhotoUploaded} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
