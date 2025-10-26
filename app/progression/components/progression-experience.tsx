"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { logger } from "@/lib/logger";
import { progressionBranches } from "@/lib/progression/data";
import { useProgressionState } from "./use-progression-state";
import type {
  ExercisePreview,
  ProgressionNode,
  WorkoutSessionSummary,
  NodeStatus,
} from "@/lib/progression/types";
import { ProgressionSummary } from "./progression-summary";
import { ProgressionTree } from "./progression-tree";
import { NodeDetailDialog } from "./node-detail-dialog";
import { GoalSelector } from "./goal-selector";
import { ProgressionLeaderboard } from "./progression-leaderboard";

const dbStatusToClient: Record<string, NodeStatus> = {
  LOCKED: "locked",
  AVAILABLE: "available",
  COMPLETED: "completed",
};

type ApiExercise = {
  id: string;
  name: string;
  gifUrl?: string | null;
  description?: string | null;
  instructions?: string | null;
  muscles?: Array<{ muscle?: { name?: string | null } }>;
  equipments?: Array<{ equipment?: { name?: string | null } }>;
};

export function ProgressionExperience() {
  const router = useRouter();
  const [sessions, setSessions] = useState<WorkoutSessionSummary[]>([]);
  const [templateNames, setTemplateNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState(
    progressionBranches[0]?.id ?? ""
  );
  const [selectedNodeId, setSelectedNodeId] = useState(
    progressionBranches[0]?.milestones[0]?.id ?? ""
  );
  const [detailOpen, setDetailOpen] = useState(false);
  const [savingTemplateFor, setSavingTemplateFor] = useState<string | null>(
    null
  );
  const [startingSessionFor, setStartingSessionFor] = useState<string | null>(
    null
  );
  const [exerciseExamples, setExerciseExamples] = useState<
    Record<string, ExercisePreview | null>
  >({});
  const [examplesLoading, setExamplesLoading] = useState(false);
  const [storedProgress, setStoredProgress] = useState<
    Record<string, { status: NodeStatus; completionCount: number }>
  >({});
  const [profile, setProfile] = useState<{
    alias: string;
    crowns: number;
    totalXp: number;
  } | null>(null);
  const [leaderboardStats, setLeaderboardStats] = useState({
    totalPlayers: 0,
    nodes: {} as Record<string, { percent: number; clearedCount: number }>,
    players: [] as Array<{ alias: string; rank: number; xp: number }>,
    currentPlayer: null as { alias: string; rank: number; xp: number } | null,
  });
  const exampleCacheRef = useRef<
    Record<string, ExercisePreview | null | undefined>
  >({});
  const progressSyncRef = useRef<string>("");

  const nodeDictionary = useMemo(() => {
    const map = new Map<string, ProgressionNode>();
    progressionBranches.forEach((branch) => {
      branch.milestones.forEach((node) => map.set(node.id, node));
    });
    return map;
  }, []);

  const loadProgressionData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [sessionsRes, templatesRes, progressRes] = await Promise.all([
        fetch("/api/workout-tracker/workout-sessions?limit=80"),
        fetch("/api/workout-tracker/workout-templates?limit=100"),
        fetch("/api/progression/progress"),
      ]);

      if (
        sessionsRes.status === 401 ||
        templatesRes.status === 401 ||
        progressRes.status === 401
      ) {
        setError("Please sign in to view your progression.");
        setSessions([]);
        setTemplateNames([]);
        setStoredProgress({});
        setProfile(null);
        return;
      }

      if (!sessionsRes.ok) {
        throw new Error(
          `Failed to load workout sessions (${sessionsRes.status})`
        );
      }
      if (!templatesRes.ok) {
        throw new Error(
          `Failed to load workout templates (${templatesRes.status})`
        );
      }
      if (!progressRes.ok && progressRes.status !== 404) {
        throw new Error(
          `Failed to load progression state (${progressRes.status})`
        );
      }

      const [sessionsJson, templatesJson, progressJson] = await Promise.all([
        sessionsRes.json(),
        templatesRes.json(),
        progressRes.ok ? progressRes.json() : Promise.resolve({ records: [] }),
      ]);
      const templatePool = [
        ...(templatesJson.userTemplates || []),
        ...(templatesJson.predefinedTemplates || []),
      ];

      setSessions(Array.isArray(sessionsJson) ? sessionsJson : []);
      setTemplateNames(
        templatePool.map((tpl: { name?: string }) =>
          (tpl.name ?? "").toLowerCase()
        )
      );

      if (progressJson?.profile) {
        setProfile(progressJson.profile);
      }
      if (Array.isArray(progressJson?.records)) {
        const overrides: Record<
          string,
          { status: NodeStatus; completionCount: number }
        > = {};
        progressJson.records.forEach(
          (record: {
            nodeId?: string;
            status?: string;
            completionCount?: number;
          }) => {
            if (!record?.nodeId) return;
            const node = nodeDictionary.get(record.nodeId);
            if (!node) return;
            overrides[record.nodeId] = {
              status: dbStatusToClient[record.status ?? ""] ?? "locked",
              completionCount: Math.max(0, record.completionCount ?? 0),
            };
          }
        );
        setStoredProgress(overrides);
      }
    } catch (err) {
      logger.error("Failed to load progression data", err);
      setError("We couldn't load your progression data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [nodeDictionary]);

  useEffect(() => {
    loadProgressionData();
  }, [loadProgressionData]);

  useEffect(() => {
    let active = true;
    const loadLeaderboard = async () => {
      try {
        const res = await fetch("/api/progression/leaderboard");
        if (!res.ok) return;
        const data = await res.json();
        if (!active) return;
        const nodes = (data.nodes || data.leaderboard || []).reduce(
          (
            acc: Record<string, { percent: number; clearedCount: number }>,
            entry: { nodeId: string; percent: number; clearedCount: number }
          ) => {
            if (!entry?.nodeId) return acc;
            acc[entry.nodeId] = {
              percent: entry.percent ?? 0,
              clearedCount: entry.clearedCount ?? 0,
            };
            return acc;
          },
          {}
        );
        setLeaderboardStats({
          totalPlayers: data.totalPlayers ?? 0,
          nodes,
          players: data.players ?? [],
          currentPlayer: data.currentPlayer ?? null,
        });
      } catch (error) {
        logger.warn("Failed to load leaderboard", error);
      }
    };

    loadLeaderboard();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const branch = progressionBranches.find((b) => b.id === selectedBranchId);
    if (!branch) return;
    if (!branch.milestones.some((node) => node.id === selectedNodeId)) {
      setSelectedNodeId(branch.milestones[0]?.id ?? "");
    }
  }, [selectedBranchId, selectedNodeId]);

  const progressionState = useProgressionState(
    progressionBranches,
    sessions,
    storedProgress
  );

  const templateNameSet = useMemo(
    () => new Set(templateNames),
    [templateNames]
  );

  const selectedBranch =
    progressionBranches.find((branch) => branch.id === selectedBranchId) ??
    progressionBranches[0];
  const selectedNode =
    selectedBranch?.milestones.find((node) => node.id === selectedNodeId) ??
    selectedBranch?.milestones[0];
  const selectedNodeState = selectedNode
    ? progressionState.nodeStates[selectedNode.id]
    : undefined;

  const prerequisiteLabels =
    selectedNode?.prerequisites.map(
      (id) => nodeDictionary.get(id)?.name ?? "Milestone"
    ) ?? [];

  useEffect(() => {
    const payload = Object.entries(progressionState.nodeStates)
      .filter(([, state]) => state.status !== "locked")
      .map(([nodeId, state]) => {
        const node = nodeDictionary.get(nodeId);
        if (!node) return null;
        return {
          nodeId,
          status: state.status,
          completionCount: state.completionCount,
          xpEarned: Math.round(node.xp * state.progress),
        };
      })
      .filter(Boolean) as Array<{
      nodeId: string;
      status: NodeStatus;
      completionCount: number;
      xpEarned: number;
    }>;

    if (!payload.length) return;
    const body = JSON.stringify(payload);
    if (body === progressSyncRef.current) return;
    progressSyncRef.current = body;

    fetch("/api/progression/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    }).catch((error) =>
      logger.warn("Failed to sync progression progress", error)
    );
  }, [nodeDictionary, progressionState.nodeStates]);

  const handleSelectNode = (node: ProgressionNode) => {
    setSelectedNodeId(node.id);
    setDetailOpen(true);
  };

  const handleSelectGoal = (nodeId: string) => {
    setSelectedNodeId(nodeId);
  };

  const fetchExerciseExample = useCallback(async (name: string) => {
    const normalized = name.toLowerCase();
    if (exampleCacheRef.current[normalized] !== undefined) {
      return exampleCacheRef.current[normalized];
    }

    try {
      const res = await fetch(
        `/api/workout-tracker/exercises?limit=5&search=${encodeURIComponent(
          name
        )}`
      );
      if (!res.ok) throw new Error("Failed to fetch exercise example");
      const data = await res.json();
      const pool: ApiExercise[] = [
        ...(data.userExercises || []),
        ...(data.predefinedExercises || []),
      ];
      const keyword = normalized.split(" ")[0];
      const exact = pool.find(
        (exercise) => exercise.name?.toLowerCase() === normalized
      );
      const fallback = pool.find((exercise) =>
        exercise.name?.toLowerCase().includes(keyword)
      );
      const match = exact || fallback;

      if (match) {
        const preview: ExercisePreview = {
          id: match.id,
          name: match.name,
          gifUrl: match.gifUrl,
          instructions: match.instructions,
          description: match.description,
          primaryMuscles: (match.muscles || [])
            .map((m) => m.muscle?.name || undefined)
            .filter((value): value is string => Boolean(value)),
          equipment: (match.equipments || [])
            .map((e) => e.equipment?.name || undefined)
            .filter((value): value is string => Boolean(value)),
        };
        exampleCacheRef.current[normalized] = preview;
        return preview;
      }

      exampleCacheRef.current[normalized] = null;
      return null;
    } catch (err) {
      logger.error("Failed to fetch exercise example", err);
      exampleCacheRef.current[normalized] = null;
      return null;
    }
  }, []);

  useEffect(() => {
    if (!detailOpen || !selectedNode) {
      return;
    }

    const names = Array.from(
      new Set(
        selectedNode.template.exercises.map((exercise) =>
          exercise.name.toLowerCase()
        )
      )
    );
    const unresolved = names.filter(
      (name) => exampleCacheRef.current[name] === undefined
    );

    const updateExampleState = () => {
      setExerciseExamples(() =>
        names.reduce((acc, name) => {
          acc[name] = exampleCacheRef.current[name] ?? null;
          return acc;
        }, {} as Record<string, ExercisePreview | null>)
      );
    };

    if (unresolved.length === 0) {
      updateExampleState();
      return;
    }

    setExamplesLoading(true);
    Promise.all(unresolved.map((name) => fetchExerciseExample(name)))
      .then(() => {
        updateExampleState();
      })
      .finally(() => {
        setExamplesLoading(false);
      });
  }, [detailOpen, fetchExerciseExample, selectedNode]);

  const handleSaveTemplate = async (node: ProgressionNode) => {
    try {
      setSavingTemplateFor(node.id);
      const response = await fetch("/api/workout-tracker/workout-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: node.template.name,
          description: node.template.description,
          estimatedDuration: node.template.estimatedDuration,
          category: node.template.category,
          difficulty: node.template.difficulty,
          exercises: node.template.exercises.map((exercise) => ({
            name: exercise.name,
            targetSets: exercise.targetSets,
            targetReps: exercise.targetReps,
            targetType: exercise.targetType || "reps",
            notes: exercise.instructions,
          })),
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.error || "Failed to save template");
      }

      toast.success(
        "Template saved. Find it under Workout → Custom templates."
      );
      setTemplateNames((prev) =>
        Array.from(new Set([...prev, node.template.name.toLowerCase()]))
      );
    } catch (err) {
      logger.error("Failed to save progression template", err);
      toast.error("Could not save this template right now.");
    } finally {
      setSavingTemplateFor(null);
    }
  };

  const handleStartPractice = async (node: ProgressionNode) => {
    try {
      setStartingSessionFor(node.id);
      const response = await fetch("/api/workout-tracker/workout-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: node.template.name,
          description: node.template.description,
          exercises: node.template.exercises.map((exercise) => ({
            name: exercise.name,
            targetSets: exercise.targetSets,
            targetReps: exercise.targetReps,
            targetType: exercise.targetType || "reps",
            notes: exercise.instructions,
          })),
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.error || "Failed to start session");
      }

      toast.success("Session created. Redirecting you to the tracker.");
      router.push("/track");
    } catch (err) {
      logger.error("Failed to start practice session", err);
      toast.error("Could not start that session. Please try again.");
    } finally {
      setStartingSessionFor(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="space-y-4 text-center">
          <p className="text-lg font-semibold">Progression isn't loading yet</p>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={loadProgressionData}>Try again</Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <ProgressionSummary
        branches={progressionBranches}
        branchProgress={progressionState.branchProgress}
        selectedBranchId={selectedBranchId}
        onSelectBranch={setSelectedBranchId}
        totals={progressionState.totals}
        playerAlias={
          profile?.alias ?? leaderboardStats.currentPlayer?.alias ?? undefined
        }
        playerRank={leaderboardStats.currentPlayer?.rank ?? undefined}
        playerCrowns={profile?.crowns}
        playerXp={profile?.totalXp}
      />

      {selectedBranch && (
        <GoalSelector
          branch={selectedBranch}
          selectedNodeId={selectedNodeId}
          onSelectGoal={handleSelectGoal}
        />
      )}

      <Card className="p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Currently exploring
            </p>
            <h2 className="text-2xl font-semibold">{selectedBranch?.title}</h2>
          </div>
          <div className="flex items-center gap-4">
            {selectedNode && selectedNodeState && (
              <div className="rounded-2xl border px-4 py-2">
                <p className="text-xs text-muted-foreground">Selected node</p>
                <p className="text-sm font-semibold">{selectedNode.name}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedNodeState.completionCount}/
                  {selectedNode.targetSessions} runs
                </p>
              </div>
            )}
            <Button
              variant="outline"
              onClick={() => setDetailOpen(true)}
              disabled={!selectedNode}
            >
              View node details
            </Button>
          </div>
        </div>
        <Separator />
        {selectedBranch ? (
          <ProgressionTree
            branch={selectedBranch}
            nodeStates={progressionState.nodeStates}
            selectedNodeId={selectedNodeId}
            onSelectNode={handleSelectNode}
          />
        ) : (
          <p className="text-muted-foreground">No branch selected.</p>
        )}
      </Card>

      <ProgressionLeaderboard
        branches={progressionBranches}
        nodes={leaderboardStats.nodes}
        totalPlayers={leaderboardStats.totalPlayers}
        players={leaderboardStats.players}
        currentPlayer={leaderboardStats.currentPlayer}
      />

      <NodeDetailDialog
        node={selectedNode ?? null}
        state={selectedNodeState}
        prerequisites={prerequisiteLabels}
        open={detailOpen && !!selectedNode}
        onOpenChange={setDetailOpen}
        onStartPractice={handleStartPractice}
        onSaveTemplate={handleSaveTemplate}
        templateExists={
          selectedNode
            ? templateNameSet.has(selectedNode.template.name.toLowerCase())
            : false
        }
        savingTemplateFor={savingTemplateFor}
        startingSessionFor={startingSessionFor}
        exerciseExamples={exerciseExamples}
        examplesLoading={examplesLoading}
      />

      <Card className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border bg-card/70 px-5 py-4 text-sm text-muted-foreground">
        <div>
          <p className="text-foreground">History sync ready</p>
          <p>
            {sessions.length} workouts scanned • new runs update the tree
            instantly.
          </p>
        </div>
        <Badge variant="outline" className="whitespace-nowrap">
          Auto-sync
        </Badge>
      </Card>
    </div>
  );
}
