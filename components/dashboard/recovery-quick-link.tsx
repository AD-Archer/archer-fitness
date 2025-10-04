"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Pill, Activity, ChevronRight } from "lucide-react"
import Link from "next/link"
import { logger } from "@/lib/logger"

interface ScheduleItem {
  id: string
  title: string
  day: number
  category?: string
  startTime: string
}

interface DaySchedule { dayOfWeek: number; items: ScheduleItem[] }

export function RecoveryQuickLink() {
  const [days, setDays] = useState<DaySchedule[] | null>(null)
  const [needsRest, setNeedsRest] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const getWeekStart = useCallback(() => {
    const today = new Date()
    const day = today.getDay()
    today.setHours(0,0,0,0)
    today.setDate(today.getDate() - day)
    return today
  }, [])

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setLoading(true)
        const weekStart = getWeekStart()
        const weekKey = weekStart.toISOString().split('T')[0]
        const res = await fetch(`/api/schedule?weekStart=${weekKey}`)
        if(!res.ok) return
        const data = await res.json()
        if(!(data.schedule && data.schedule.items)) return
        const built: DaySchedule[] = Array.from({length:7}, (_,i)=>({
          dayOfWeek: i,
          items: data.schedule.items.filter((it:ScheduleItem)=> Number(it.day)===i)
            .sort((a:ScheduleItem,b:ScheduleItem)=> a.startTime.localeCompare(b.startTime))
        }))
        setDays(built)
        // Simple fatigue heuristic: any category scheduled on 2+ consecutive days OR 3+ times in 5 days ending today
        const todayIdx = new Date().getDay()
        const categoryByDay: Array<Set<string>> = built.map(d => new Set(d.items.map(i => (i.category||'general').toLowerCase())))
        const consecutive = new Set<string>()
        for(let i=0;i<6;i++) {
          categoryByDay[i].forEach(cat => { if(categoryByDay[i+1].has(cat) && cat!=='general') consecutive.add(cat) })
        }
        const recentWindowCats: Record<string, number> = {}
        for(let offset=0; offset<5; offset++) {
          const idx = todayIdx - offset
          if(idx < 0) break
            categoryByDay[idx].forEach(cat => { if(cat!=='general') recentWindowCats[cat] = (recentWindowCats[cat]||0)+1 })
        }
        Object.entries(recentWindowCats).forEach(([cat,count])=>{ if(count>=3) consecutive.add(cat) })
        setNeedsRest(Array.from(consecutive).slice(0,3))
      } catch(e) {
        logger.error('Recovery quick link fetch failed', e)
      } finally {
        setLoading(false)
      }
    }
    fetchSchedule()
  }, [getWeekStart])

  const content = () => {
    if(loading) return <p className="text-[10px] text-muted-foreground">Loading recovery…</p>
    if(!days) return <p className="text-[10px] text-muted-foreground">No data</p>
    if(needsRest.length === 0) return <p className="text-[10px] text-green-600 dark:text-green-400 font-medium">All clear • Balanced</p>
    return (
      <div className="space-y-1">
        <p className="text-[10px] text-muted-foreground">Needs recovery:</p>
        <div className="flex flex-wrap gap-1">
          {needsRest.map(cat => (
            <span key={cat} className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/50">
              {cat}
            </span>
          ))}
        </div>
      </div>
    )
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-2.5 flex items-start gap-2">
        <div className="mt-0.5 text-muted-foreground">
          <Pill className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold flex items-center gap-1">Recovery <Activity className="h-3 w-3 text-muted-foreground" /></p>
            <Button asChild size="sm" variant="ghost" className="h-6 px-2 text-[10px]">
              <Link href="/recovery" aria-label="Go to Recovery">
                View <ChevronRight className="h-3 w-3 ml-0.5" />
              </Link>
            </Button>
          </div>
          {content()}
        </div>
      </CardContent>
    </Card>
  )
}
