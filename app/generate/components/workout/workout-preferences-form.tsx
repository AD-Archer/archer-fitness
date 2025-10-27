"use client";

import { useEffect } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Settings,
  Loader2,
  Target,
  Dumbbell,
  User,
  Clock,
  Zap,
  CheckCircle,
} from "lucide-react";
import { useWorkoutOptions } from "@/hooks/use-workout-options";
import { SearchableMultiSelect } from "../searchable-multi-select";

interface WorkoutPreferences {
  fitnessLevel: string;
  workoutType: string;
  duration: string;
  targetMuscles: string[];
  targetBodyParts: string[];
  equipment: string[];
  notes: string;
}

interface SavedWorkoutPrefs {
  defaultDuration: string;
  difficultyLevel: string;
  preferredTime: string;
  availableEquipment: string[];
  restDayReminders: boolean;
}

interface WorkoutPreferencesFormProps {
  preferences: WorkoutPreferences;
  onPreferencesChange: (preferences: WorkoutPreferences) => void;
  savedPrefs?: SavedWorkoutPrefs | null;
  isLoadingPrefs?: boolean;
}

export function WorkoutPreferencesForm({
  preferences,
  onPreferencesChange,
  savedPrefs,
  isLoadingPrefs = false,
}: WorkoutPreferencesFormProps) {
  const { options, isLoading, error } = useWorkoutOptions();

  useEffect(() => {
    const saved = localStorage.getItem("workoutPreferences");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        onPreferencesChange({ ...preferences, ...parsed });
      } catch {
        // Error parsing saved preferences
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    localStorage.setItem("workoutPreferences", JSON.stringify(preferences));
  }, [preferences]);

  const handleMuscleSelectionChange = (selected: string[]) => {
    onPreferencesChange({
      ...preferences,
      targetMuscles: selected,
    });
  };

  const handleBodyPartSelectionChange = (selected: string[]) => {
    onPreferencesChange({
      ...preferences,
      targetBodyParts: selected,
    });
  };

  const handleEquipmentSelectionChange = (selected: string[]) => {
    onPreferencesChange({
      ...preferences,
      equipment: selected,
    });
  };

  const updatePreference = (
    key: keyof WorkoutPreferences,
    value: string | string[]
  ) => {
    onPreferencesChange({
      ...preferences,
      [key]: value,
    });
  };

  return (
    <div className="space-y-6">
      {/* Saved Preferences Display */}
      {isLoadingPrefs ? (
        <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>
            Loading your saved workout preferences...
          </AlertDescription>
        </Alert>
      ) : savedPrefs ? (
        <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">
                Your saved workout preferences from settings:
              </p>
              <div className="flex flex-wrap gap-2 text-sm">
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                >
                  <Clock className="w-3 h-3 mr-1" />
                  {savedPrefs.defaultDuration} min default
                </Badge>
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                >
                  <Zap className="w-3 h-3 mr-1" />
                  {savedPrefs.difficultyLevel} level
                </Badge>
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                >
                  <Dumbbell className="w-3 h-3 mr-1" />
                  {savedPrefs.availableEquipment.length} equipment types
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                💡 These preferences have been applied below and can be adjusted
                for this workout.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
          <Settings className="h-4 w-4" />
          <AlertDescription>
            <span className="font-medium">Tip:</span> Set your default workout
            preferences in Settings to have them automatically applied here.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            Fitness Level <span className="text-red-500">*</span>
            {savedPrefs?.difficultyLevel &&
              preferences.fitnessLevel === savedPrefs.difficultyLevel && (
                <Badge
                  variant="outline"
                  className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                >
                  From Settings
                </Badge>
              )}
          </Label>
          <Select
            value={preferences.fitnessLevel}
            onValueChange={(value) => updatePreference("fitnessLevel", value)}
          >
            <SelectTrigger
              className={
                savedPrefs?.difficultyLevel &&
                preferences.fitnessLevel === savedPrefs.difficultyLevel
                  ? "border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-950"
                  : ""
              }
            >
              <SelectValue placeholder="Select your level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>
            Workout Type <span className="text-red-500">*</span>
          </Label>
          <Select
            value={preferences.workoutType}
            onValueChange={(value) => updatePreference("workoutType", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose workout type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="strength">Strength Training</SelectItem>
              <SelectItem value="cardio">Cardio</SelectItem>
              <SelectItem value="hiit">HIIT</SelectItem>
              <SelectItem value="flexibility">Flexibility</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            Duration (minutes) <span className="text-red-500">*</span>
            {savedPrefs?.defaultDuration &&
              preferences.duration === savedPrefs.defaultDuration && (
                <Badge
                  variant="outline"
                  className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                >
                  From Settings
                </Badge>
              )}
          </Label>
          <Select
            value={preferences.duration}
            onValueChange={(value) => updatePreference("duration", value)}
          >
            <SelectTrigger
              className={
                savedPrefs?.defaultDuration &&
                preferences.duration === savedPrefs.defaultDuration
                  ? "border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-950"
                  : ""
              }
            >
              <SelectValue placeholder="How long?" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15">15 minutes</SelectItem>
              <SelectItem value="30">30 minutes</SelectItem>
              <SelectItem value="45">45 minutes</SelectItem>
              <SelectItem value="60">60 minutes</SelectItem>
              <SelectItem value="90">90 minutes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <User className="w-4 h-4" />
          Target Body Parts (optional)
        </Label>
        {error && (
          <div className="text-sm text-red-500 py-2">
            Error loading body parts. Using default options.
          </div>
        )}
        <SearchableMultiSelect
          options={options.bodyParts}
          selected={preferences.targetBodyParts || []}
          onSelectionChange={handleBodyPartSelectionChange}
          placeholder="Search body parts..."
          maxDisplayed={8}
          isLoading={isLoading}
          className="w-full"
        />
      </div>

      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <Target className="w-4 h-4" />
          Target Muscle Groups (optional)
        </Label>
        {error && (
          <div className="text-sm text-red-500 py-2">
            Error loading muscle groups. Using default options.
          </div>
        )}
        <SearchableMultiSelect
          options={options.muscles}
          selected={preferences.targetMuscles}
          onSelectionChange={handleMuscleSelectionChange}
          placeholder="Search muscle groups..."
          maxDisplayed={10}
          isLoading={isLoading}
          className="w-full"
        />
      </div>

      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <Dumbbell className="w-4 h-4" />
          Available Equipment
          {savedPrefs?.availableEquipment &&
            savedPrefs.availableEquipment.some((eq) =>
              preferences.equipment.includes(eq)
            ) && (
              <Badge
                variant="outline"
                className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
              >
                Some from Settings
              </Badge>
            )}
        </Label>
        {error && (
          <div className="text-sm text-red-500 py-2">
            Error loading equipment options. Using default options.
          </div>
        )}
        <SearchableMultiSelect
          options={options.equipment}
          selected={preferences.equipment}
          onSelectionChange={handleEquipmentSelectionChange}
          placeholder="Search equipment..."
          maxDisplayed={12}
          isLoading={isLoading}
          className="w-full"
        />
        {savedPrefs?.availableEquipment &&
          savedPrefs.availableEquipment.length > 0 && (
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">From your settings:</span>{" "}
              {savedPrefs.availableEquipment.join(", ")}
            </div>
          )}
      </div>

      <div className="space-y-3">
        <Label htmlFor="ai-notes">Additional Notes & Preferences</Label>
        <Textarea
          id="ai-notes"
          placeholder="Tell us about any specific preferences, injuries to avoid, favorite exercises, time constraints, or other details that would help create the perfect workout for you..."
          value={preferences.notes}
          onChange={(e) => updatePreference("notes", e.target.value)}
          rows={4}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground">
          {`Examples: "I have a bad knee, avoid lunges", "I love compound movements", "Focus on upper body today", "I only have 20 minutes between meetings"`}
        </p>
      </div>
    </div>
  );
}
