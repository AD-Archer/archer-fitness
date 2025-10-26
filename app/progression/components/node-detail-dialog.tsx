import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { ExercisePreview, NodeProgressState, ProgressionNode } from "@/lib/progression/types"

interface NodeDetailDialogProps {
  node: ProgressionNode | null
  state?: NodeProgressState
  prerequisites: string[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onStartPractice: (node: ProgressionNode) => void
  onSaveTemplate: (node: ProgressionNode) => void
  templateExists: boolean
  savingTemplateFor?: string | null
  startingSessionFor?: string | null
  exerciseExamples: Record<string, ExercisePreview | null>
  examplesLoading: boolean
}

export function NodeDetailDialog({
  node,
  state,
  prerequisites,
  open,
  onOpenChange,
  onStartPractice,
  onSaveTemplate,
  templateExists,
  savingTemplateFor,
  startingSessionFor,
  exerciseExamples,
  examplesLoading,
}: NodeDetailDialogProps) {
  if (!node || !state) return null

  const exercises = node.template.exercises
  const progressPercent = Math.round(state.progress * 100)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">{node.name}</DialogTitle>
          <DialogDescription>{node.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <InfoBlock label="Focus" value={node.focus} />
            <InfoBlock label="Reward" value={node.reward} />
            <InfoBlock label="XP" value={`${node.xp}`} />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Progress</p>
              <span className="text-sm font-semibold">
                {state.completionCount}/{node.targetSessions} runs ({progressPercent}%)
              </span>
            </div>
            <Progress className="mt-2" value={progressPercent} />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Prerequisites</p>
            <div className="flex flex-wrap gap-2">
              {prerequisites.length === 0 ? (
                <Badge variant="outline">None</Badge>
              ) : (
                prerequisites.map((name) => (
                  <Badge key={name} variant="outline">
                    {name}
                  </Badge>
                ))
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Practice template</p>
                <p className="text-sm text-muted-foreground">{node.template.description}</p>
              </div>
              <Badge variant="secondary">{node.template.focus}</Badge>
            </div>
            <ScrollArea className="h-44 rounded-lg border p-3">
              <ol className="space-y-3 text-sm text-muted-foreground">
                {exercises.map((exercise) => {
                  const lookupKey = exercise.name.toLowerCase()
                  const example = exerciseExamples[lookupKey]
                  return (
                    <li key={`${node.id}-${exercise.name}`} className="rounded-lg bg-muted/50 p-3 space-y-2">
                      <div>
                        <p className="font-medium text-foreground">{exercise.name}</p>
                        <p className="text-xs uppercase tracking-wide">
                          {exercise.targetSets} sets · {exercise.targetReps}
                        </p>
                        {exercise.instructions && <p className="text-xs mt-1">{exercise.instructions}</p>}
                      </div>
                      <ExamplePreview example={example} loading={examplesLoading} />
                    </li>
                  )
                })}
              </ol>
            </ScrollArea>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              className="flex-1"
              onClick={() => onStartPractice(node)}
              disabled={startingSessionFor === node.id}
            >
              {startingSessionFor === node.id ? "Starting session..." : "Start practice in Tracker"}
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onSaveTemplate(node)}
              disabled={templateExists || savingTemplateFor === node.id}
            >
              {templateExists ? "Template synced" : savingTemplateFor === node.id ? "Saving..." : "Save as template"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-muted/40 p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-base font-semibold mt-1">{value}</p>
    </div>
  )
}

function ExamplePreview({ example, loading }: { example?: ExercisePreview | null; loading: boolean }) {
  if (loading && !example) {
    return <p className="text-xs text-muted-foreground">Searching the exercise database…</p>
  }

  if (!example) {
    return <p className="text-xs text-muted-foreground">No preview yet. Add this move once to save it.</p>
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-background/80 p-2">
      {example.gifUrl ? (
        <img
          src={example.gifUrl}
          alt={example.name}
          className="h-14 w-14 rounded-md object-cover"
        />
      ) : (
        <div className="h-14 w-14 rounded-md bg-muted flex items-center justify-center text-[10px] text-muted-foreground uppercase">
          {example.name.slice(0, 3)}
        </div>
      )}
      <div className="text-xs">
        <p className="font-semibold text-foreground">{example.name}</p>
        {example.primaryMuscles?.length ? (
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            {example.primaryMuscles.join(", ")}
          </p>
        ) : null}
        {example.equipment?.length ? (
          <p className="text-[11px] text-muted-foreground">Eq: {example.equipment.join(", ")}</p>
        ) : null}
      </div>
    </div>
  )
}
