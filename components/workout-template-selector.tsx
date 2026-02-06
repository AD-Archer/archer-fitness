"use client";

import { useMemo, useState } from "react";
import { Dumbbell, Search, Filter, Clock, Zap, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface WorkoutTemplate {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  difficulty?: string | null;
  estimatedDuration?: number;
  exerciseCount?: number;
  usageCount?: number;
  isPredefined?: boolean;
  isPublic?: boolean;
}

interface WorkoutTemplateSelectorProps {
  templates: WorkoutTemplate[];
  onSelect: (template: WorkoutTemplate) => void;
  loading?: boolean;
  placeholder?: string;
  showCategories?: boolean;
  showDifficulty?: boolean;
  maxHeight?: string; // CSS value like "250px" or "300px"
  selectedId?: string; // ID of the currently selected template
}

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  intermediate:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  advanced:
    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  expert: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const DIFFICULTY_ORDER: Record<string, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
  expert: 4,
};

export function WorkoutTemplateSelector({
  templates,
  onSelect,
  loading = false,
  placeholder = "Search workouts...",
  showCategories = true,
  showDifficulty = true,
  maxHeight = "300px",
  selectedId,
}: WorkoutTemplateSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(
    null,
  );

  // Get unique categories and difficulties
  const categories = useMemo(() => {
    const cats = new Set(
      templates.map((t) => t.category).filter((c): c is string => Boolean(c)),
    );
    return Array.from(cats).sort();
  }, [templates]);

  const difficulties = useMemo(() => {
    const diffs = new Set(
      templates
        .map((t) => t.difficulty?.toLowerCase())
        .filter((d): d is string => Boolean(d)),
    );
    return Array.from(diffs).sort(
      (a, b) => (DIFFICULTY_ORDER[a] || 999) - (DIFFICULTY_ORDER[b] || 999),
    );
  }, [templates]);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      const matchesSearch =
        !searchQuery ||
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        !selectedCategory || template.category === selectedCategory;

      const matchesDifficulty =
        !selectedDifficulty ||
        template.difficulty?.toLowerCase() === selectedDifficulty;

      return matchesSearch && matchesCategory && matchesDifficulty;
    });
  }, [templates, searchQuery, selectedCategory, selectedDifficulty]);

  // Sort templates: predefined first, then by usage count
  const sortedTemplates = useMemo(() => {
    return [...filteredTemplates].sort((a, b) => {
      // Predefined first
      if (a.isPredefined && !b.isPredefined) return -1;
      if (!a.isPredefined && b.isPredefined) return 1;
      // Then by usage count
      return (b.usageCount || 0) - (a.usageCount || 0);
    });
  }, [filteredTemplates]);

  const hasFilters = selectedCategory || selectedDifficulty || searchQuery;

  return (
    <div className="w-full space-y-3 overflow-hidden">
      {/* Search and Filters */}
      <div className="space-y-2">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>

        {/* Filter Row */}
        {(showCategories || showDifficulty) && (
          <div className="flex gap-2 items-center overflow-x-auto scrollbar-hide">
            {showCategories && (
              <Select
                value={selectedCategory || "_all"}
                onValueChange={(value) =>
                  setSelectedCategory(value === "_all" ? null : value)
                }
              >
                <SelectTrigger className="w-auto h-9 text-sm">
                  <Filter className="h-3.5 w-3.5" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {showDifficulty && (
              <Select
                value={selectedDifficulty || "_all"}
                onValueChange={(value) =>
                  setSelectedDifficulty(value === "_all" ? null : value)
                }
              >
                <SelectTrigger className="w-auto h-9 text-sm">
                  <Zap className="h-3.5 w-3.5" />
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">All Difficulties</SelectItem>
                  {difficulties.map((diff) => (
                    <SelectItem key={diff} value={diff}>
                      {diff.charAt(0).toUpperCase() + diff.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory(null);
                  setSelectedDifficulty(null);
                }}
                className="h-9 text-xs"
              >
                Clear
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Templates List */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
        </div>
      ) : sortedTemplates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 rounded-lg border border-dashed bg-muted/20">
          <Dumbbell className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-xs text-muted-foreground text-center">
            {hasFilters
              ? "No workouts match your filters"
              : "No workout templates available"}
          </p>
        </div>
      ) : (
        <div
          className="rounded-lg border bg-background overflow-y-auto scrollbar-hide"
          style={{ maxHeight }}
        >
          <div className="flex flex-col gap-1.5 p-2">
            {sortedTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => onSelect(template)}
                className="text-left w-full min-w-0"
              >
                <div
                  className={`group rounded-md border px-3 py-2 transition-all active:scale-[0.98] ${
                    selectedId === template.id
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border bg-card hover:shadow-sm hover:border-primary/60"
                  }`}
                >
                  {/* Title Row */}
                  <div className="flex items-center gap-1.5 min-w-0 mb-1">
                    <Dumbbell className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <h4 className="text-sm font-semibold text-card-foreground truncate min-w-0 flex-1">
                      {template.name}
                    </h4>
                    {template.isPredefined && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] flex-shrink-0 py-0 px-1.5"
                      >
                        Suggested
                      </Badge>
                    )}
                  </div>

                  {template.description && (
                    <p className="text-xs text-muted-foreground mb-1 truncate">
                      {template.description}
                    </p>
                  )}

                  {/* Tags and Stats Row */}
                  <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
                    {template.category && (
                      <Badge
                        variant="outline"
                        className="text-[10px] py-0 px-1.5"
                      >
                        {template.category}
                      </Badge>
                    )}
                    {template.difficulty && (
                      <Badge
                        className={`text-[10px] py-0 px-1.5 ${
                          DIFFICULTY_COLORS[
                            template.difficulty.toLowerCase()
                          ] || "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {template.difficulty}
                      </Badge>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-1.5 ml-auto flex-shrink-0">
                      {template.estimatedDuration && (
                        <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                          <Clock className="h-2.5 w-2.5" />
                          {template.estimatedDuration}m
                        </span>
                      )}
                      {template.exerciseCount && (
                        <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                          <BarChart3 className="h-2.5 w-2.5" />
                          {template.exerciseCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Result count */}
      {!loading && sortedTemplates.length > 0 && (
        <p className="text-xs text-muted-foreground px-0.5">
          {sortedTemplates.length}/{templates.length} workouts
        </p>
      )}
    </div>
  );
}
