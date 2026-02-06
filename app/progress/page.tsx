import { UnifiedProgressDashboard } from "@/app/progress/components/unified-progress-dashboard";
import { Sidebar } from "@/components/sidebar";

export default function ProgressPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 p-4 md:p-6 lg:p-8 lg:ml-0">
        <div className="max-w-7xl mx-auto pt-12 lg:pt-0">
          <UnifiedProgressDashboard />
        </div>
      </main>
    </div>
  );
}
