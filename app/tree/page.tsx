import { Sidebar } from "@/components/sidebar"
import { ProgressionExperience } from "./components/progression-experience"

export default function ProgressionPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 p-4 md:p-6 lg:p-8 lg:ml-0">
        <div className="mx-auto w-full max-w-6xl space-y-8">
          <header className="pt-10 lg:pt-0 space-y-3 text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Progression Game</p>
            <h1 className="text-4xl font-black tracking-tight">Climb your skill tree</h1>
            <p className="text-sm text-muted-foreground">Tap a tree · pick your end goal · train the exact workout.</p>
          </header>

          <ProgressionExperience />
        </div>
      </main>
    </div>
  )
}
