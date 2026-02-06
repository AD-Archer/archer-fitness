"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChevronDown, X } from "lucide-react";
import { BODY_PARTS, slugToName } from "./body-part-mappings";

interface BodyPartFilterProps {
  /** Selected body part **slugs** (e.g. "hamstring", "chest") */
  selectedParts: string[];
  onPartSelect: (parts: string[]) => void;
  showLastWorked?: boolean;
  lastWorkedDates?: Record<string, string>;
}

export function BodyPartFilter({
  selectedParts,
  onPartSelect,
  showLastWorked = false,
  lastWorkedDates,
}: BodyPartFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handlePartToggle = (slug: string) => {
    if (selectedParts.includes(slug)) {
      onPartSelect(selectedParts.filter((p) => p !== slug));
    } else {
      onPartSelect([...selectedParts, slug]);
    }
  };

  const handleClearAll = () => {
    onPartSelect([]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Filter by Body Part</CardTitle>
        <CardDescription>
          Select body parts to view progress for specific muscle groups
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <span>Select Body Parts</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {BODY_PARTS.map((bp) => (
                <DropdownMenuCheckboxItem
                  key={bp.slug}
                  checked={selectedParts.includes(bp.slug)}
                  onCheckedChange={() => handlePartToggle(bp.slug)}
                >
                  {bp.name}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {selectedParts.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="text-muted-foreground hover:text-destructive"
            >
              Clear all
            </Button>
          )}
        </div>

        {/* Selected Parts Display */}
        {selectedParts.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {selectedParts.length} body part
              {selectedParts.length !== 1 ? "s" : ""} selected
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedParts.map((slug) => (
                <Badge
                  key={slug}
                  variant="secondary"
                  className="flex items-center gap-1 px-3 py-1"
                >
                  {slugToName(slug)}
                  <button
                    onClick={() => handlePartToggle(slug)}
                    className="ml-1 hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>

            {/* Last Worked Dates - Optional */}
            {showLastWorked && lastWorkedDates && selectedParts.length > 0 && (
              <div className="mt-4 space-y-2 pt-4 border-t">
                <p className="text-sm font-medium">Last Worked</p>
                <div className="grid gap-2">
                  {selectedParts.map((slug) => (
                    <div
                      key={slug}
                      className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm"
                    >
                      <span className="text-muted-foreground">
                        {slugToName(slug)}
                      </span>
                      <span className="font-medium">
                        {lastWorkedDates[slug] || "Never"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Info Text */}
        {selectedParts.length === 0 && (
          <p className="text-xs text-muted-foreground italic">
            Select body parts to filter your progress photos and view stats
            specific to those muscle groups
          </p>
        )}
      </CardContent>
    </Card>
  );
}
