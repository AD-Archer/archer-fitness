"use client";

import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Layers, CalendarDays, PlayCircle } from "lucide-react";
import {
  ScheduleCalendar,
  DailyTemplateManager,
  WeeklyTemplateBuilder,
  ActiveScheduleManager,
} from "./components";
import { ScheduleTab } from "./types";

export default function SchedulePage() {
  const [activeTab, setActiveTab] = useState<ScheduleTab>("calendar");

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 p-4 md:p-6 lg:p-8 lg:ml-0">
        <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">
          <div className="pt-12 lg:pt-0">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-balance">
              Schedule
            </h1>
            <p className="text-muted-foreground text-pretty mt-2">
              Build your perfect workout week with daily and weekly templates
            </p>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as ScheduleTab)}
            className="space-y-6"
          >
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
              <TabsTrigger value="calendar" className="gap-2">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Calendar</span>
              </TabsTrigger>
              <TabsTrigger value="daily" className="gap-2">
                <Layers className="h-4 w-4" />
                <span className="hidden sm:inline">Daily</span>
              </TabsTrigger>
              <TabsTrigger value="weekly" className="gap-2">
                <CalendarDays className="h-4 w-4" />
                <span className="hidden sm:inline">Weekly</span>
              </TabsTrigger>
              <TabsTrigger value="active" className="gap-2">
                <PlayCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Active</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="calendar" className="mt-6">
              <ScheduleCalendar />
            </TabsContent>

            <TabsContent value="daily" className="mt-6">
              <DailyTemplateManager />
            </TabsContent>

            <TabsContent value="weekly" className="mt-6">
              <WeeklyTemplateBuilder />
            </TabsContent>

            <TabsContent value="active" className="mt-6">
              <ActiveScheduleManager />
            </TabsContent>
          </Tabs>

          {/* Quick Help */}
          <div className="text-sm text-muted-foreground border rounded-lg p-4 bg-muted/30">
            <h3 className="font-medium mb-2">How it works:</h3>
            <ol className="list-decimal list-inside space-y-1">
              <li>
                <strong>Daily Templates</strong> — Create workout days (e.g.,
                &quot;Upper Body&quot;, &quot;Leg Day&quot;, &quot;Cardio&quot;)
              </li>
              <li>
                <strong>Weekly Templates</strong> — Arrange daily templates into
                a weekly schedule (e.g., &quot;Push Pull Legs&quot;)
              </li>
              <li>
                <strong>Activate</strong> — Start a weekly template with a date
                range to see workouts on your calendar
              </li>
              <li>
                <strong>Track</strong> — Click on today&apos;s workout to start
                tracking
              </li>
            </ol>
          </div>
        </div>
      </main>
    </div>
  );
}
