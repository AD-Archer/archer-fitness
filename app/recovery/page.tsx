"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { RecoveryMonitor } from "@/app/recovery/components/recovery-monitor";
import { Sidebar } from "@/components/sidebar";
import { DateSelector } from "@/app/recovery/components/date-selector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, PieChart } from "lucide-react";

export default function RecoveryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const dateParam = searchParams.get("date");
    if (dateParam) {
      const parsed = new Date(dateParam);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }
    return new Date();
  });

  const [activeTab, setActiveTab] = useState(() => {
    const tabParam = searchParams.get("tab");
    return tabParam === "body-distribution" ? "body-distribution" : "overview";
  });

  // Update URL when date or tab changes
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);

    const params = new URLSearchParams();
    if (selected.getTime() !== today.getTime()) {
      const dateStr = selectedDate.toISOString().split("T")[0];
      params.set("date", dateStr);
    }
    if (activeTab !== "overview") {
      params.set("tab", activeTab);
    }

    const queryString = params.toString();
    const newPath = queryString ? `/recovery?${queryString}` : "/recovery";
    router.push(newPath, { scroll: false });
  }, [selectedDate, activeTab, router]);

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 p-4 md:p-6 lg:p-8 lg:ml-0">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 pt-12 lg:pt-0">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-balance">
                  Recovery Monitor
                </h1>
                <p className="text-muted-foreground text-pretty mt-2">
                  Track your recovery metrics and get personalized
                  recommendations for optimal performance
                </p>
              </div>
            </div>
          </div>

          {/* Main Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <TabsList className="grid grid-cols-2 sm:grid-cols-2 w-full sm:w-auto">
                <TabsTrigger
                  value="overview"
                  className="text-xs sm:text-sm px-2 sm:px-4"
                >
                  <Activity className="sm:hidden h-4 w-4" />
                  <span className="hidden sm:inline">Overview</span>
                </TabsTrigger>
                <TabsTrigger
                  value="body-distribution"
                  className="text-xs sm:text-sm px-2 sm:px-4"
                >
                  <PieChart className="sm:hidden h-4 w-4" />
                  <span className="hidden sm:inline">Body</span>
                </TabsTrigger>
              </TabsList>
              <div className="w-full sm:w-auto">
                <DateSelector
                  selectedDate={selectedDate}
                  onDateChange={handleDateChange}
                />
              </div>
            </div>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <RecoveryMonitor selectedDate={selectedDate} />
            </TabsContent>

            {/* Body Distribution Tab */}
            <TabsContent value="body-distribution" className="space-y-6">
              <RecoveryMonitor
                selectedDate={selectedDate}
                showBodyDistribution
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
