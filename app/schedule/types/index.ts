// New simplified schedule types

export interface WorkoutTemplateBasic {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  difficulty?: string | null;
  estimatedDuration?: number;
}

// Daily Template - A single workout day (e.g., "Upper Body", "Leg Day")
export interface DailyTemplate {
  id: string;
  userId: string;
  name: string;
  workoutTemplateId: string | null;
  workoutTemplate: WorkoutTemplateBasic | null;
  cardioType: string | null; // "bike", "walk", "run", "jump_rope"
  startTime: string; // HH:MM
  duration: number; // minutes
  color: string;
  isRestDay: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DailyTemplateInput {
  name: string;
  workoutTemplateId?: string | null;
  cardioType?: string | null;
  startTime?: string;
  duration?: number;
  color?: string;
  isRestDay?: boolean;
  notes?: string | null;
}

// Weekly Template Day - Assignment of a daily template to a day of week
export interface WeeklyTemplateDay {
  id: string;
  weeklyTemplateId: string;
  dailyTemplateId: string | null;
  dailyTemplate: DailyTemplate | null;
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  overrideTime: string | null; // Override daily template's time for this day
}

// Weekly Template - 7 days of workouts
export interface WeeklyTemplate {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  isPublic: boolean;
  usageCount: number;
  days: WeeklyTemplateDay[];
  createdAt: string;
  updatedAt: string;
}

export interface WeeklyTemplateInput {
  name: string;
  description?: string | null;
  isPublic?: boolean;
  days: Array<{
    dayOfWeek: number;
    dailyTemplateId: string | null;
    overrideTime?: string | null;
  }>;
}

// Active Schedule - A weekly template applied to your calendar
export interface ActiveSchedule {
  id: string;
  userId: string;
  weeklyTemplateId: string;
  weeklyTemplate: WeeklyTemplate;
  name: string | null;
  startDate: string;
  endDate: string | null; // null = repeat forever
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ActiveScheduleInput {
  weeklyTemplateId: string;
  name?: string;
  startDate: string;
  endDate?: string | null;
}

// Calendar View Types
export interface CalendarWorkout {
  date: string;
  dayOfWeek: number;
  dailyTemplateId: string | null;
  dailyTemplateName: string | null;
  workoutTemplateId: string | null;
  workoutTemplateName: string | null;
  workoutCategory: string | null;
  workoutDifficulty: string | null;
  startTime: string;
  duration: number;
  color: string;
  isRestDay: boolean;
  activeScheduleId: string;
  activeScheduleName: string | null;
  isCompleted?: boolean;
  completionStatus?: string | null;
  completionNotes?: string | null;
}

export interface CalendarResponse {
  workouts: CalendarWorkout[];
  startDate: string;
  endDate: string;
  totalDays: number;
  activeScheduleCount: number;
}

// UI State Types
export type ScheduleTab = "calendar" | "daily" | "weekly" | "active";

export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const DAY_NAMES_SHORT = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
] as const;

export type DayName = (typeof DAY_NAMES)[number];

// Color presets for daily templates
export const TEMPLATE_COLORS = [
  { name: "Red", value: "#ef4444" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Green", value: "#22c55e" },
  { name: "Yellow", value: "#eab308" },
  { name: "Purple", value: "#a855f7" },
  { name: "Pink", value: "#ec4899" },
  { name: "Orange", value: "#f97316" },
  { name: "Teal", value: "#14b8a6" },
  { name: "Gray", value: "#6b7280" },
] as const;

// Helper functions
export function getDayName(dayOfWeek: number): DayName {
  return DAY_NAMES[dayOfWeek];
}

export function getShortDayName(dayOfWeek: number): string {
  return DAY_NAMES_SHORT[dayOfWeek];
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(":");
  const h = parseInt(hours);
  const ampm = h >= 12 ? "PM" : "AM";
  const displayHour = h % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

export function getWeekStartDate(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getWeekEndDate(date: Date = new Date()): Date {
  const start = getWeekStartDate(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return end;
}

export function formatDateForAPI(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function addWeeks(date: Date, weeks: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + weeks * 7);
  return result;
}
