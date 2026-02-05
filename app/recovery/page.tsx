"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { RecoveryMonitor } from "@/app/recovery/components/recovery-monitor";
import { Sidebar } from "@/components/sidebar";
import { DateSelector } from "@/app/recovery/components/date-selector";

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

  // Update URL when date changes
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);

    if (selected.getTime() === today.getTime()) {
      // If today, remove date param
      router.push("/recovery", { scroll: false });
    } else {
      // Format as YYYY-MM-DD
      const dateStr = selectedDate.toISOString().split("T")[0];
      router.push(`/recovery?date=${dateStr}`, { scroll: false });
    }
  }, [selectedDate, router]);

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
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
              <DateSelector
                selectedDate={selectedDate}
                onDateChange={handleDateChange}
              />
            </div>
          </div>

          <RecoveryMonitor selectedDate={selectedDate} />
        </div>
      </main>
    </div>
  );
}
