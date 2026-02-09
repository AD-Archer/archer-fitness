"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { UnifiedProgressDashboard } from "@/app/progress/components/unified-progress-dashboard";
import { Sidebar } from "@/components/sidebar";

function ProgressPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => {
    const tabParam = searchParams.get("tab");
    return tabParam || "analytics";
  });

  // Update URL when tab changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (activeTab !== "analytics") {
      params.set("tab", activeTab);
    }

    const queryString = params.toString();
    const newPath = queryString ? `/progress?${queryString}` : "/progress";
    router.replace(newPath, { scroll: false });
  }, [activeTab, router]);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 p-4 md:p-6 lg:p-8 lg:ml-0">
        <div className="max-w-7xl mx-auto pt-12 lg:pt-0">
          <UnifiedProgressDashboard
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>
      </main>
    </div>
  );
}

export default function ProgressPage() {
  return (
    <Suspense fallback={null}>
      <ProgressPageContent />
    </Suspense>
  );
}
