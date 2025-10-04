"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Dumbbell,
  TrendingUp,
  Calendar,
  Pill,
  Settings,
  Zap,
  Play,
  Menu,
  X,
  LogOut,
} from "lucide-react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Generate", href: "/generate", icon: Zap },
  { name: "Workout", href: "/track", icon: Dumbbell },
  { name: "History", href: "/workouts", icon: Play },
  { name: "Statistics", href: "/progress", icon: TrendingUp },
  { name: "Schedule", href: "/schedule", icon: Calendar },
  { name: "Recovery", href: "/recovery", icon: Pill },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileOpen(false)
      }
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {mobileOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />}

      <div
        className={cn(
          "flex flex-col bg-card border-r border-border transition-all duration-300 z-50",
          "fixed lg:relative h-full",
          collapsed ? "w-16" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          {!collapsed && (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden">
            <img src="/android-chrome-512x512.png" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <span className="font-semibold">Archer Fitness</span>
        </div>
          )}
          <Button
        variant="ghost"
        size="sm"
        onClick={() => setCollapsed(!collapsed)}
        className="h-8 w-8 p-0 hidden lg:flex"
          >
        <LayoutDashboard className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href
        return (
          <Link key={item.name} href={item.href}>
            <Button
          variant={isActive ? "secondary" : "ghost"}
          className={cn("w-full justify-start gap-3 h-10", collapsed && "justify-center px-2 lg:px-2")}
            >
          <Icon className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span>{item.name}</span>}
            </Button>
          </Link>
        )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border space-y-2">
          <Link href="/settings">
        <Button
          variant="ghost"
          className={cn("w-full justify-start gap-3 h-10", collapsed && "justify-center px-2 lg:px-2")}
        >
          <Settings className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span>Settings</span>}
        </Button>
          </Link>
          <Button
        variant="ghost"
        className={cn("w-full justify-start gap-3 h-10 text-red-600 hover:text-red-600 hover:bg-red-50", collapsed && "justify-center px-2 lg:px-2")}
        onClick={() => signOut({ callbackUrl: "/auth/signin" })}
          >
        <LogOut className="h-4 w-4 flex-shrink-0" />
        {!collapsed && <span>Sign Out</span>}
          </Button>
        </div>
      </div>
    </>
  )
}
