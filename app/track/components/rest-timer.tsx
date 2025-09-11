"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatTime } from "../utils"

interface RestTimerProps {
  restTimer: number
  onSkipRest: () => void
}

export function RestTimer({ restTimer, onSkipRest }: RestTimerProps) {
  return (
    <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
      <CardContent className="pt-6">
        <div className="text-center">
          <div className="text-3xl font-bold text-orange-600 mb-2">{formatTime(restTimer)}</div>
          <div className="text-sm text-orange-700 dark:text-orange-300">Rest Time Remaining</div>
          <Button
            onClick={onSkipRest}
            variant="outline"
            className="mt-3 bg-transparent border-orange-300"
          >
            Skip Rest
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
