"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Timer, Target } from "lucide-react"

interface ExerciseTimerProps {
  exerciseTimer: number
  targetTime: string
  formatTime: (seconds: number) => string
}

export function ExerciseTimer({ exerciseTimer, targetTime, formatTime }: ExerciseTimerProps) {
  // Parse target time to seconds
  const parseTimeToSeconds = (timeStr: string): number => {
    if (timeStr.includes(":")) {
      const [mins, secs] = timeStr.split(":").map(Number)
      return (mins || 0) * 60 + (secs || 0)
    } else if (timeStr.includes("s")) {
      return Number.parseInt(timeStr.replace("s", ""))
    } else {
      return Number.parseInt(timeStr) || 0
    }
  }

  const targetSeconds = parseTimeToSeconds(targetTime)
  const isOverTarget = exerciseTimer > targetSeconds

  return (
    <Card className={`border-blue-200 ${isOverTarget ? 'bg-green-50 dark:bg-green-950 border-green-200' : 'bg-blue-50 dark:bg-blue-950'}`}>
      <CardContent className="pt-6">
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            <Timer className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Exercise Timer</span>
          </div>

          <div className="text-3xl font-bold text-blue-600">
            {formatTime(exerciseTimer)}
          </div>

          <div className="flex items-center justify-center gap-2">
            <Target className="w-4 h-4 text-muted-foreground" />
            <Badge variant="outline" className="text-xs">
              Target: {targetTime}
            </Badge>
            {isOverTarget && (
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs">
                +{formatTime(exerciseTimer - targetSeconds)}
              </Badge>
            )}
          </div>

          <div className="text-xs text-muted-foreground">
            {isOverTarget ? "Great job going beyond your target!" : "Keep going!"}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
