"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Clock, AlertTriangle, Activity } from "lucide-react"
import { cn } from "@/lib/utils"

interface BodyPartStatus {
  name: string
  status: "ready" | "caution" | "rest" | "worked-recently"
  lastWorked?: string
  hoursUntilReady?: number
  recommendedRest?: number
  avgRecoveryTime?: number
  sets?: number
}

interface AllBodyPartsViewProps {
  bodyPartsStatus: BodyPartStatus[]
}

const statusConfig = {
  ready: {
    icon: CheckCircle2,
    label: "Ready to Train",
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
    borderColor: "border-emerald-200 dark:border-emerald-900/50",
  },
  caution: {
    icon: Clock,
    label: "Proceed with Caution",
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/20",
    borderColor: "border-amber-200 dark:border-amber-900/50",
  },
  rest: {
    icon: AlertTriangle,
    label: "Needs Rest",
    color: "text-rose-600 dark:text-rose-400",
    bgColor: "bg-rose-50 dark:bg-rose-950/20",
    borderColor: "border-rose-200 dark:border-rose-900/50",
  },
  "worked-recently": {
    icon: Activity,
    label: "Recently Worked",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    borderColor: "border-blue-200 dark:border-blue-900/50",
  },
}

export function AllBodyPartsView({ bodyPartsStatus }: AllBodyPartsViewProps) {
  const groupedByStatus = {
    ready: bodyPartsStatus.filter(bp => bp.status === "ready"),
    caution: bodyPartsStatus.filter(bp => bp.status === "caution"),
    rest: bodyPartsStatus.filter(bp => bp.status === "rest"),
    "worked-recently": bodyPartsStatus.filter(bp => bp.status === "worked-recently"),
  }

  const formatTime = (hours?: number) => {
    if (!hours) return ""
    if (hours < 24) return `${Math.round(hours)}h`
    return `${Math.round(hours / 24)}d`
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Complete Body Status</CardTitle>
          <CardDescription>
            All muscle groups and their current recovery status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Ready to Train */}
          {groupedByStatus.ready.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-semibold text-emerald-600 dark:text-emerald-400">
                  Ready to Train ({groupedByStatus.ready.length})
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {groupedByStatus.ready.map((bp) => (
                  <Badge
                    key={bp.name}
                    variant="outline"
                    className={cn(
                      "py-1.5 px-3",
                      statusConfig.ready.bgColor,
                      statusConfig.ready.borderColor
                    )}
                  >
                    <span className={statusConfig.ready.color}>{bp.name}</span>
                    {bp.lastWorked && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        Last: {formatTime(
                          Math.floor((Date.now() - new Date(bp.lastWorked).getTime()) / (1000 * 60 * 60))
                        )}
                      </span>
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Proceed with Caution */}
          {groupedByStatus.caution.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <h3 className="font-semibold text-amber-600 dark:text-amber-400">
                  Proceed with Caution ({groupedByStatus.caution.length})
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {groupedByStatus.caution.map((bp) => (
                  <Badge
                    key={bp.name}
                    variant="outline"
                    className={cn(
                      "py-1.5 px-3",
                      statusConfig.caution.bgColor,
                      statusConfig.caution.borderColor
                    )}
                  >
                    <span className={statusConfig.caution.color}>{bp.name}</span>
                    {bp.hoursUntilReady && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {formatTime(bp.hoursUntilReady)} until fully ready
                      </span>
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Needs Rest */}
          {groupedByStatus.rest.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <h3 className="font-semibold text-rose-600 dark:text-rose-400">
                  Needs Rest ({groupedByStatus.rest.length})
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {groupedByStatus.rest.map((bp) => (
                  <Badge
                    key={bp.name}
                    variant="outline"
                    className={cn(
                      "py-1.5 px-3",
                      statusConfig.rest.bgColor,
                      statusConfig.rest.borderColor
                    )}
                  >
                    <span className={statusConfig.rest.color}>{bp.name}</span>
                    {bp.hoursUntilReady && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        Ready in {formatTime(bp.hoursUntilReady)}
                      </span>
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Recently Worked */}
          {groupedByStatus["worked-recently"].length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-blue-600 dark:text-blue-400">
                  Recently Worked ({groupedByStatus["worked-recently"].length})
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {groupedByStatus["worked-recently"].map((bp) => (
                  <Badge
                    key={bp.name}
                    variant="outline"
                    className={cn(
                      "py-1.5 px-3",
                      statusConfig["worked-recently"].bgColor,
                      statusConfig["worked-recently"].borderColor
                    )}
                  >
                    <span className={statusConfig["worked-recently"].color}>{bp.name}</span>
                    {bp.lastWorked && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {formatTime(
                          Math.floor((Date.now() - new Date(bp.lastWorked).getTime()) / (1000 * 60 * 60))
                        )} ago
                      </span>
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
