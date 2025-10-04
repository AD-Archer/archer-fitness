"use client"

import { Flame } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

interface TrainingVolumeChartProps {
  trendData: Array<{ iso: string; label: string; volume: number }>
}

export function TrainingVolumeChart({ trendData }: TrainingVolumeChartProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Flame className="size-5 text-orange-500" /> Training volume trend
        </CardTitle>
        <CardDescription>Last 10 logged sessions aggregated across body parts</CardDescription>
      </CardHeader>
      <CardContent className="h-64">
        {trendData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="volumeGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.45} />
                  <stop offset="90%" stopColor="#6366f1" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
              <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis allowDecimals={false} stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  borderRadius: "0.75rem",
                  border: "1px solid hsl(var(--border))",
                }}
                labelFormatter={(value) => `Session on ${value}`}
                formatter={(value) => [`${value} sets`, "Volume"]}
              />
              <Area type="monotone" dataKey="volume" stroke="#6366f1" fill="url(#volumeGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No trend data yet
          </div>
        )}
      </CardContent>
    </Card>
  )
}