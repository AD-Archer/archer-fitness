import { WorkoutTemplate, WorkoutTemplateExercise } from "@prisma/client";
import {
  TemplateGenerationCriteria,
  ScheduleTemplate,
  ScheduleItem,
} from "@/app/schedule/types/schedule";

export const DEFAULT_GENERATED_TEMPLATE_START_TIME = "18:00";
const DEFAULT_DAYS_SEQUENCE = [1, 3, 5, 0, 2, 4, 6];

export type WorkoutTemplateWithExercises = WorkoutTemplate & {
  exercises: Array<
    WorkoutTemplateExercise & {
      exercise: {
        name: string;
        description: string | null;
        instructions?: string | null;
        muscles: Array<{
          muscle: {
            name: string;
          };
          isPrimary: boolean;
        }>;
        equipments?: Array<{
          equipment: {
            name: string;
          };
        }>;
      };
    }
  >;
};

const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max);
};

const sanitizeEquipmentName = (value: string | null | undefined): string => {
  if (!value) return "";
  return value.trim().toLowerCase();
};

const getRequiredEquipment = (
  template: WorkoutTemplateWithExercises,
): string[] => {
  const equipment = new Set<string>();
  template.exercises.forEach((exercise: any) => {
    exercise.exercise.equipments?.forEach((relation: any) => {
      const name = sanitizeEquipmentName(relation?.equipment?.name);
      if (name) {
        equipment.add(name);
      }
    });
  });
  return Array.from(equipment);
};

const templateMatchesEquipment = (
  template: WorkoutTemplateWithExercises,
  allowedEquipment: Set<string>,
): boolean => {
  if (allowedEquipment.size === 0) {
    return true;
  }

  const requiredEquipment = getRequiredEquipment(template);
  if (requiredEquipment.length === 0) {
    return true;
  }

  return requiredEquipment.every((required) => {
    if (!required || required === "bodyweight" || required === "none") {
      return true;
    }
    return allowedEquipment.has(required);
  });
};

const isCardioTemplate = (template: WorkoutTemplateWithExercises): boolean => {
  const category = template.category?.toLowerCase() ?? "";
  if (
    category.includes("cardio") ||
    category.includes("hiit") ||
    category.includes("endurance")
  ) {
    return true;
  }

  const name = template.name.toLowerCase();
  if (
    name.includes("cardio") ||
    name.includes("interval") ||
    name.includes("run") ||
    name.includes("cycle")
  ) {
    return true;
  }

  return template.exercises.some((exercise: any) => {
    const exerciseName = exercise.exercise.name.toLowerCase();
    if (
      exerciseName.includes("cardio") ||
      exerciseName.includes("sprint") ||
      exerciseName.includes("run") ||
      exerciseName.includes("bike") ||
      exerciseName.includes("row")
    ) {
      return true;
    }

    return exercise.exercise.muscles.some((relation: any) => {
      const muscleName = relation.muscle.name.toLowerCase();
      return (
        muscleName.includes("cardio") ||
        muscleName.includes("aerobic") ||
        muscleName.includes("endurance")
      );
    });
  });
};

const normalizeTime = (time?: string | null): string => {
  if (!time || typeof time !== "string") {
    return DEFAULT_GENERATED_TEMPLATE_START_TIME;
  }

  const parts = time.split(":");
  if (parts.length !== 2) {
    return DEFAULT_GENERATED_TEMPLATE_START_TIME;
  }

  const [rawHour, rawMinute] = parts;
  const hour = clamp(Number.parseInt(rawHour, 10), 0, 23);
  const minute = clamp(Number.parseInt(rawMinute, 10), 0, 59);
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
};

const addMinutesToTime = (
  startTime: string,
  durationMinutes: number,
): string => {
  const [hour, minute] = startTime.split(":").map(Number);
  const total = hour * 60 + minute + durationMinutes;
  const wrapped = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  const endHour = Math.floor(wrapped / 60);
  const endMinute = wrapped % 60;
  return `${String(endHour).padStart(2, "0")}:${String(endMinute).padStart(2, "0")}`;
};

const shuffle = <T>(input: T[]): T[] => {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const coerceDays = (days: number[] | undefined, count: number): number[] => {
  const cleaned = Array.isArray(days)
    ? days
        .map((value) => Number.parseInt(String(value), 10))
        .filter((value) => Number.isInteger(value) && value >= 0 && value <= 6)
    : [];

  if (cleaned.length >= count) {
    return cleaned.slice(0, count);
  }

  const fallback = DEFAULT_DAYS_SEQUENCE.filter(
    (day) => !cleaned.includes(day),
  );
  return [...cleaned, ...fallback].slice(0, count);
};

const buildItemDescription = (
  template: WorkoutTemplateWithExercises,
): string => {
  const exerciseCount = template.exercises.length;
  const muscles = template.exercises
    .flatMap((exercise: any) =>
      exercise.exercise.muscles.filter((muscle: any) => muscle.isPrimary),
    )
    .map((entry: any) => entry.muscle.name);

  const distinctMuscles = Array.from(new Set(muscles)).slice(0, 3);
  const muscleText =
    distinctMuscles.length > 0 ? ` • ${distinctMuscles.join(", ")}` : "";
  const difficulty = template.difficulty ? ` • ${template.difficulty}` : "";
  return `${exerciseCount} exercises${muscleText}${difficulty}`;
};

const toGeneratorData = (template: WorkoutTemplateWithExercises) => {
  return {
    name: template.name,
    duration: template.estimatedDuration ?? 60,
    difficulty: template.difficulty ?? "Mixed",
    exercises: template.exercises.map((exercise: any) => ({
      name: exercise.exercise.name,
      sets: exercise.targetSets,
      reps: exercise.targetReps,
      rest: `${exercise.restTime}s`,
      instructions:
        exercise.exercise.description || exercise.exercise.instructions || "",
      targetMuscles: exercise.exercise.muscles.map(
        (relation: any) => relation.muscle.name,
      ),
      equipment:
        exercise.exercise.equipments?.map(
          (relation: any) => relation.equipment.name,
        ) ?? [],
    })),
    warmup: [],
    cooldown: [],
  };
};

const createScheduleItem = (
  template: WorkoutTemplateWithExercises,
  day: number,
  criteria: TemplateGenerationCriteria,
  startTime: string,
): Omit<ScheduleItem, "id"> => {
  const duration = template.estimatedDuration ?? 60;
  const endTime = addMinutesToTime(startTime, duration);
  const repeatInterval =
    criteria.repeatIntervalWeeks && criteria.repeatIntervalWeeks > 0
      ? criteria.repeatIntervalWeeks
      : 1;

  return {
    type: "workout",
    title: template.name,
    description: template.description || buildItemDescription(template),
    day,
    startTime,
    endTime,
    category: template.category ?? undefined,
    difficulty: template.difficulty ?? undefined,
    duration,
    isFromGenerator: true,
    generatorData: toGeneratorData(template),
    isRecurring: true,
    repeatPattern: "weekly",
    repeatInterval,
    repeatEndsOn: null,
    repeatDaysOfWeek: [day],
    recurrenceRule: {
      frequency: "weekly",
      interval: repeatInterval,
      daysOfWeek: [day],
      meta: {
        source: "auto-generator",
      },
    },
  };
};

const buildTemplateName = (
  criteria: TemplateGenerationCriteria,
  iteration: number,
  categories: string[],
): string => {
  const difficultyLabel = criteria.difficulty ?? "balanced";
  const categoryLabel =
    categories.length > 0 ? categories.join(" • ") : "mixed focus";
  return `${difficultyLabel === "mixed" ? "Balanced" : capitalize(difficultyLabel)} ${criteria.daysPerWeek}-Day ${capitalizeWords(categoryLabel)} Plan #${iteration + 1}`;
};

const buildTemplateDescription = (
  criteria: TemplateGenerationCriteria,
  days: number[],
  categories: string[],
): string => {
  const dayNames = days.map((day) => WEEKDAY_LABELS[day]).join(", ");
  const focusText =
    categories.length > 0 ? categories.join(", ") : "mixed focus";
  const cadence =
    criteria.repeatIntervalWeeks && criteria.repeatIntervalWeeks > 1
      ? `Repeats every ${criteria.repeatIntervalWeeks} weeks`
      : "Repeats weekly";

  return `${criteria.daysPerWeek} workouts on ${dayNames}. Focus: ${focusText}. ${cadence}.`;
};

const capitalize = (value: string): string => {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const capitalizeWords = (value: string): string => {
  return value.split(/\s+/).map(capitalize).join(" ");
};

const WEEKDAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const collectCategories = (
  templates: WorkoutTemplateWithExercises[],
): string[] => {
  return Array.from(
    new Set(
      templates
        .map((template) => template.category)
        .filter((category): category is string => Boolean(category)),
    ),
  );
};

const collectDifficulties = (
  templates: WorkoutTemplateWithExercises[],
): string[] => {
  return Array.from(
    new Set(
      templates
        .map((template) => template.difficulty)
        .filter((difficulty): difficulty is string => Boolean(difficulty)),
    ),
  );
};

const createInsights = (
  templates: WorkoutTemplateWithExercises[],
  days: number[],
): string[] => {
  const categories = collectCategories(templates);
  const difficulties = collectDifficulties(templates);
  const focusInsight =
    categories.length > 0
      ? `Focus areas: ${categories.join(", ")}`
      : "Balanced focus";
  const difficultyInsight =
    difficulties.length > 0
      ? `Difficulty mix: ${difficulties.join(", ")}`
      : "Varied difficulty";
  const scheduleInsight = `Training days: ${days.map((day) => WEEKDAY_LABELS[day]).join(", ")}`;
  return [focusInsight, difficultyInsight, scheduleInsight];
};

const ensureMinimumPool = (
  pool: WorkoutTemplateWithExercises[],
  backup: WorkoutTemplateWithExercises[],
): WorkoutTemplateWithExercises[] => {
  if (pool.length > 0) {
    return pool;
  }
  return [...backup];
};

export const normalizeGenerationCriteria = (
  criteria: Partial<TemplateGenerationCriteria>,
): TemplateGenerationCriteria => {
  const daysPerWeek = clamp(
    Number.parseInt(String(criteria.daysPerWeek ?? 3), 10),
    1,
    7,
  );
  const preferredDays = coerceDays(criteria.preferredDays, daysPerWeek);
  const allowedEquipment = Array.from(
    new Set(
      (criteria.allowedEquipment ?? [])
        .map(sanitizeEquipmentName)
        .filter((value) => value.length > 0),
    ),
  );
  return {
    daysPerWeek,
    preferredDays,
    difficulty: criteria.difficulty ?? null,
    focus:
      criteria.focus?.filter(
        (value): value is string =>
          typeof value === "string" && value.trim().length > 0,
      ) ?? [],
    preferredStartTime: normalizeTime(criteria.preferredStartTime ?? null),
    repeatIntervalWeeks:
      criteria.repeatIntervalWeeks && criteria.repeatIntervalWeeks > 0
        ? criteria.repeatIntervalWeeks
        : 1,
    timezone: criteria.timezone ?? null,
    allowBackToBack: criteria.allowBackToBack ?? false,
    includeRecovery: criteria.includeRecovery ?? false,
    includeCardio: criteria.includeCardio ?? false,
    allowedEquipment,
  };
};

export const buildGeneratedTemplates = ({
  workoutTemplates,
  criteria,
  count,
  backupPool,
  cardioTemplates,
  allowedEquipment,
}: {
  workoutTemplates: WorkoutTemplateWithExercises[];
  criteria: TemplateGenerationCriteria;
  count: number;
  backupPool: WorkoutTemplateWithExercises[];
  cardioTemplates?: WorkoutTemplateWithExercises[];
  allowedEquipment?: string[];
}): ScheduleTemplate[] => {
  if (workoutTemplates.length === 0 && backupPool.length === 0) {
    return [];
  }

  const normalizedCount = clamp(count, 1, 6);
  const templates: ScheduleTemplate[] = [];

  const allowedEquipmentSet = new Set(
    (criteria.allowedEquipment ?? allowedEquipment ?? [])
      .map(sanitizeEquipmentName)
      .filter((value) => value.length > 0),
  );

  const filteredPrimaryPool = workoutTemplates.filter((template) =>
    templateMatchesEquipment(template, allowedEquipmentSet),
  );
  const filteredBackupPool = backupPool.filter((template) =>
    templateMatchesEquipment(template, allowedEquipmentSet),
  );

  const effectivePrimaryPool =
    filteredPrimaryPool.length > 0 ? filteredPrimaryPool : workoutTemplates;
  const effectiveBackupPool =
    filteredBackupPool.length > 0 ? filteredBackupPool : backupPool;

  const cardioPrimaryCandidates = (
    cardioTemplates ?? effectivePrimaryPool
  ).filter(
    (template) =>
      isCardioTemplate(template) &&
      templateMatchesEquipment(template, allowedEquipmentSet),
  );
  const cardioBackupCandidates = effectiveBackupPool.filter(
    (template) =>
      isCardioTemplate(template) &&
      templateMatchesEquipment(template, allowedEquipmentSet),
  );

  for (let iteration = 0; iteration < normalizedCount; iteration += 1) {
    let availablePool = shuffle([...effectivePrimaryPool]);
    let cardioPool = shuffle([...cardioPrimaryCandidates]);
    const assignments: Array<{
      day: number;
      workout: WorkoutTemplateWithExercises;
    }> = [];

    const daySequence = (
      criteria.preferredDays && criteria.preferredDays.length > 0
        ? [...criteria.preferredDays]
        : DEFAULT_DAYS_SEQUENCE
    ).slice(0, criteria.daysPerWeek);

    const cardioSessionsNeeded = criteria.includeCardio
      ? Math.min(
          daySequence.length,
          Math.max(1, Math.round(criteria.daysPerWeek / 3)),
        )
      : 0;
    let cardioSessionsAssigned = 0;

    const takeFromCardioPool = (): WorkoutTemplateWithExercises | undefined => {
      if (!criteria.includeCardio) {
        return undefined;
      }

      if (cardioPool.length === 0 && cardioBackupCandidates.length > 0) {
        cardioPool = ensureMinimumPool(
          shuffle([...cardioBackupCandidates]),
          cardioBackupCandidates,
        );
      }

      return cardioPool.shift();
    };

    const takeFromAvailablePool = ():
      | WorkoutTemplateWithExercises
      | undefined => {
      if (availablePool.length === 0) {
        availablePool = ensureMinimumPool(
          shuffle([...effectiveBackupPool]),
          effectiveBackupPool,
        );
      }
      return availablePool.shift();
    };

    daySequence.forEach((day) => {
      if (assignments.length >= criteria.daysPerWeek) {
        return;
      }

      let nextWorkout: WorkoutTemplateWithExercises | undefined;

      if (cardioSessionsAssigned < cardioSessionsNeeded) {
        const cardioCandidate = takeFromCardioPool();
        if (cardioCandidate) {
          nextWorkout = cardioCandidate;
          cardioSessionsAssigned += 1;
          availablePool = availablePool.filter(
            (item) => item.id !== cardioCandidate.id,
          );
        }
      }

      if (!nextWorkout) {
        nextWorkout = takeFromAvailablePool();
      }

      if (!nextWorkout) {
        return;
      }

      const lastAssignment = assignments[assignments.length - 1];
      const shouldAvoidBackToBack =
        !criteria.allowBackToBack &&
        lastAssignment?.workout?.id === nextWorkout.id;
      if (shouldAvoidBackToBack) {
        const alternative = takeFromAvailablePool();
        if (alternative) {
          availablePool = availablePool.filter(
            (item) => item.id !== alternative.id,
          );
          availablePool.push(nextWorkout);
          availablePool = shuffle(availablePool);
          nextWorkout = alternative;
        }
      }

      assignments.push({ day, workout: nextWorkout });
    });

    if (assignments.length === 0) {
      continue;
    }

    const categories = Array.from(
      new Set(
        assignments
          .map(({ workout }) => workout.category)
          .filter((value): value is string => Boolean(value)),
      ),
    );
    const templateItems: Array<Omit<ScheduleItem, "id">> = assignments.map(
      ({ workout, day }) =>
        createScheduleItem(
          workout,
          day,
          criteria,
          criteria.preferredStartTime ?? DEFAULT_GENERATED_TEMPLATE_START_TIME,
        ),
    );

    const templateId = `generated-${Date.now()}-${iteration}-${Math.random().toString(36).slice(2, 10)}`;
    const allowedEquipmentArray =
      allowedEquipmentSet.size > 0
        ? Array.from(allowedEquipmentSet)
        : (criteria.allowedEquipment ?? allowedEquipment ?? []);

    const template: ScheduleTemplate = {
      id: templateId,
      name: buildTemplateName(criteria, iteration, categories),
      description: buildTemplateDescription(
        criteria,
        assignments.map(({ day }) => day),
        categories,
      ),
      items: templateItems,
      isDefault: false,
      usageCount: 0,
      metadata: {
        source: "generated",
        generatedAt: new Date().toISOString(),
        criteria,
        tags: Array.from(
          new Set([
            ...(criteria.difficulty ? [criteria.difficulty] : []),
            ...categories,
            ...(criteria.includeCardio ? ["cardio"] : []),
          ]),
        ),
        insights: createInsights(
          assignments.map(({ workout }) => workout),
          assignments.map(({ day }) => day),
        ),
        allowedEquipment: allowedEquipmentArray,
      },
    };

    templates.push(template);
  }

  return templates;
};
