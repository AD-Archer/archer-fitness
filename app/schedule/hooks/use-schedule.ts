"use client";

import { useState, useCallback } from "react";
import {
  DailyTemplate,
  DailyTemplateInput,
  WeeklyTemplate,
  WeeklyTemplateInput,
  ActiveSchedule,
  ActiveScheduleInput,
  CalendarResponse,
} from "../types";

// ============================================
// Daily Templates API
// ============================================

export function useDailyTemplates() {
  const [dailyTemplates, setDailyTemplates] = useState<DailyTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDailyTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/schedule/daily-templates");
      if (!res.ok) throw new Error("Failed to fetch daily templates");
      const data = await res.json();
      setDailyTemplates(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createDailyTemplate = useCallback(
    async (input: DailyTemplateInput): Promise<DailyTemplate | null> => {
      setError(null);
      try {
        const res = await fetch("/api/schedule/daily-templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to create daily template");
        }
        const newTemplate = await res.json();
        setDailyTemplates((prev) => [...prev, newTemplate]);
        return newTemplate;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        return null;
      }
    },
    [],
  );

  const updateDailyTemplate = useCallback(
    async (
      id: string,
      input: Partial<DailyTemplateInput>,
    ): Promise<DailyTemplate | null> => {
      setError(null);
      try {
        const res = await fetch(`/api/schedule/daily-templates/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to update daily template");
        }
        const updated = await res.json();
        setDailyTemplates((prev) =>
          prev.map((t) => (t.id === id ? updated : t)),
        );
        return updated;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        return null;
      }
    },
    [],
  );

  const deleteDailyTemplate = useCallback(
    async (id: string): Promise<boolean> => {
      setError(null);
      try {
        const res = await fetch(`/api/schedule/daily-templates/${id}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to delete daily template");
        }
        setDailyTemplates((prev) => prev.filter((t) => t.id !== id));
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        return false;
      }
    },
    [],
  );

  return {
    dailyTemplates,
    loading,
    error,
    fetchDailyTemplates,
    createDailyTemplate,
    updateDailyTemplate,
    deleteDailyTemplate,
  };
}

// ============================================
// Weekly Templates API
// ============================================

export function useWeeklyTemplates() {
  const [weeklyTemplates, setWeeklyTemplates] = useState<WeeklyTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeeklyTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/schedule/weekly-templates");
      if (!res.ok) throw new Error("Failed to fetch weekly templates");
      const data = await res.json();
      setWeeklyTemplates(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createWeeklyTemplate = useCallback(
    async (input: WeeklyTemplateInput): Promise<WeeklyTemplate | null> => {
      setError(null);
      try {
        const res = await fetch("/api/schedule/weekly-templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to create weekly template");
        }
        const newTemplate = await res.json();
        setWeeklyTemplates((prev) => [...prev, newTemplate]);
        return newTemplate;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        return null;
      }
    },
    [],
  );

  const updateWeeklyTemplate = useCallback(
    async (
      id: string,
      input: Partial<WeeklyTemplateInput>,
    ): Promise<WeeklyTemplate | null> => {
      setError(null);
      try {
        const res = await fetch(`/api/schedule/weekly-templates/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to update weekly template");
        }
        const updated = await res.json();
        setWeeklyTemplates((prev) =>
          prev.map((t) => (t.id === id ? updated : t)),
        );
        return updated;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        return null;
      }
    },
    [],
  );

  const deleteWeeklyTemplate = useCallback(
    async (id: string): Promise<boolean> => {
      setError(null);
      try {
        const res = await fetch(`/api/schedule/weekly-templates/${id}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to delete weekly template");
        }
        setWeeklyTemplates((prev) => prev.filter((t) => t.id !== id));
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        return false;
      }
    },
    [],
  );

  return {
    weeklyTemplates,
    loading,
    error,
    fetchWeeklyTemplates,
    createWeeklyTemplate,
    updateWeeklyTemplate,
    deleteWeeklyTemplate,
  };
}

// ============================================
// Active Schedules API
// ============================================

export function useActiveSchedules() {
  const [activeSchedules, setActiveSchedules] = useState<ActiveSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActiveSchedules = useCallback(async (activeOnly = true) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/schedule/active?active=${activeOnly ? "true" : "false"}`,
      );
      if (!res.ok) throw new Error("Failed to fetch active schedules");
      const data = await res.json();
      setActiveSchedules(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const activateSchedule = useCallback(
    async (input: ActiveScheduleInput): Promise<ActiveSchedule | null> => {
      setError(null);
      try {
        const res = await fetch("/api/schedule/active", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to activate schedule");
        }
        const newSchedule = await res.json();
        setActiveSchedules((prev) => [...prev, newSchedule]);
        return newSchedule;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        return null;
      }
    },
    [],
  );

  const updateActiveSchedule = useCallback(
    async (
      id: string,
      input: { name?: string; endDate?: string | null; isActive?: boolean },
    ): Promise<ActiveSchedule | null> => {
      setError(null);
      try {
        const res = await fetch(`/api/schedule/active/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to update schedule");
        }
        const updated = await res.json();
        setActiveSchedules((prev) =>
          prev.map((s) => (s.id === id ? updated : s)),
        );
        return updated;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        return null;
      }
    },
    [],
  );

  const deactivateSchedule = useCallback(
    async (id: string): Promise<boolean> => {
      return (await updateActiveSchedule(id, { isActive: false })) !== null;
    },
    [updateActiveSchedule],
  );

  const deleteActiveSchedule = useCallback(
    async (id: string): Promise<boolean> => {
      setError(null);
      try {
        const res = await fetch(`/api/schedule/active/${id}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to delete schedule");
        }
        setActiveSchedules((prev) => prev.filter((s) => s.id !== id));
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        return false;
      }
    },
    [],
  );

  return {
    activeSchedules,
    loading,
    error,
    fetchActiveSchedules,
    activateSchedule,
    updateActiveSchedule,
    deactivateSchedule,
    deleteActiveSchedule,
  };
}

// ============================================
// Calendar API
// ============================================

export function useCalendar() {
  const [calendarData, setCalendarData] = useState<CalendarResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCalendar = useCallback(
    async (
      startDate: string,
      endDate: string,
    ): Promise<CalendarResponse | null> => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/schedule/calendar?start=${startDate}&end=${endDate}`,
        );
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to fetch calendar");
        }
        const data = await res.json();
        setCalendarData(data);
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    calendarData,
    loading,
    error,
    fetchCalendar,
  };
}

// ============================================
// Workout Templates (for selecting in daily templates)
// ============================================

export interface WorkoutTemplateOption {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  difficulty: string | null;
  estimatedDuration: number;
}

export function useWorkoutTemplates() {
  const [workoutTemplates, setWorkoutTemplates] = useState<
    WorkoutTemplateOption[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkoutTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/workout-tracker/workout-templates");
      if (!res.ok) throw new Error("Failed to fetch workout templates");
       
      const data = (await res.json()) as any;

      // Combine user templates and predefined templates
      const combined = [
        ...(data.userTemplates || []),
        ...(data.predefinedTemplates || []),
      ].map((template: any) => ({
        id: template.id,
        name: template.name,
        description: template.description || null,
        category: template.category || null,
        difficulty: template.difficulty || null,
        estimatedDuration: template.estimatedDuration || 60,
      }));

      setWorkoutTemplates(combined);
      return combined;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    workoutTemplates,
    loading,
    error,
    fetchWorkoutTemplates,
  };
}
