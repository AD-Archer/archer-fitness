import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Zap, Plus, BarChart3, Calendar } from "lucide-react"

const actions = [
  {
    title: "AI Workout",
    description: "Generate personalized workout",
    icon: Zap,
    color: "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700",
  },
  {
    title: "Quick Log",
    description: "Log completed workout",
    icon: Plus,
    color: "bg-green-600 hover:bg-green-700",
  },
  {
    title: "View Stats",
    description: "Detailed progress analytics",
    icon: BarChart3,
    color: "bg-orange-600 hover:bg-orange-700",
  },
  {
    title: "Schedule",
    description: "Plan upcoming workouts",
    icon: Calendar,
    color: "bg-purple-600 hover:bg-purple-700",
  },
]

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <Button
              key={action.title}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-accent bg-transparent"
            >
              <div className={`w-8 h-8 rounded-lg ${action.color} flex items-center justify-center`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <div className="text-center">
                <div className="text-sm font-medium">{action.title}</div>
                <div className="text-xs text-muted-foreground">{action.description}</div>
              </div>
            </Button>
          )
        })}
      </CardContent>
    </Card>
  )
}
