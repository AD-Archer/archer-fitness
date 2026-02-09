"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { RecoveryMonitor } from "@/app/recovery/components/recovery-monitor";
import { Sidebar } from "@/components/sidebar";
import { DateSelector } from "@/app/recovery/components/date-selector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, PieChart } from "lucide-react";

const formatLocalDateParam = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseLocalDateParam = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);

  const date = new Date(year, monthIndex, day);
  date.setHours(0, 0, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date;
};

function RecoveryPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const dateParam = searchParams.get("date");
    if (dateParam) {
      const parsed = parseLocalDateParam(dateParam);
      if (parsed) {
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
      const dateStr = formatLocalDateParam(selectedDate);
      params.set("date", dateStr);
    }
    if (activeTab !== "overview") {
      params.set("tab", activeTab);
    }

    const queryString = params.toString();
    const newPath = queryString ? `/recovery?${queryString}` : "/recovery";
    router.replace(newPath, { scroll: false });
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

export default function RecoveryPage() {
  return (
    <Suspense fallback={null}>
      <RecoveryPageContent />
    </Suspense>
  );
}
