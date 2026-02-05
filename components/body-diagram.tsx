"use client";

import React, { useState, useMemo } from "react";
import BodyHighlighter from "@mjcdev/react-body-highlighter";

interface BodyPartData {
  name: string;
  slug: string;
  intensity: "none" | "light" | "moderate" | "heavy";
  lastWorked?: string;
  sets?: number;
  side?: "left" | "right";
}

interface BodyDiagramProps {
  bodyParts?: BodyPartData[];
  interactive?: boolean;
  onBodyPartClick?: (bodyPart: BodyPartData) => void;
  size?: "sm" | "md" | "lg";
  colors?: string[];
  defaultFill?: string;
  showLabels?: boolean;
  gender?: "male" | "female";
  view?: "front" | "back";
  dualView?: boolean; // Show both front and back side by side
  legendLabels?: string[]; // Custom legend labels [light, moderate, heavy]
  showLegend?: boolean;
}

const getIntensityColor = (
  intensity: "none" | "light" | "moderate" | "heavy",
  colors?: string[],
) => {
  const defaultColors = colors || ["#eab308", "#f97316", "#ef4444"];

  switch (intensity) {
    case "heavy":
      return defaultColors[2];
    case "moderate":
      return defaultColors[1];
    case "light":
      return defaultColors[0];
    case "none":
      return "#6b7280";
  }
};

export function BodyDiagram({
  bodyParts = [],
  interactive = false,
  onBodyPartClick,
  size = "md",
  colors = ["#eab308", "#f97316", "#ef4444"],
  defaultFill = "#6b7280",
  gender = "male",
  view = "front",
  dualView = false,
  legendLabels,
  showLegend = true,
}: BodyDiagramProps) {
  const [mobileView, setMobileView] = useState<"front" | "back">("front");

  const sizeConfig = {
    sm: { scale: 0.7 },
    md: { scale: 0.9 },
    lg: { scale: 1.1 },
  };

  const config = sizeConfig[size];

  // Memoize slug normalization to avoid recreating on every render
  const slugNormalization = useMemo<Record<string, string>>(
    () => ({
      back: "upper-back",
      "lower back": "lower-back",
      "lower-back": "lower-back",
      "upper back": "upper-back",
      "upper-back": "upper-back",
      shoulders: "deltoids",
      shoulder: "deltoids",
      "shoulder-deltoids": "deltoids",
      "front deltoids": "front-deltoids",
      "front-deltoids": "front-deltoids",
      "back deltoids": "back-deltoids",
      "back-deltoids": "back-deltoids",
      legs: "quadriceps",
      leg: "quadriceps",
      quads: "quadriceps",
      hamstring: "hamstring",
      hamstrings: "hamstring",
      glutes: "gluteal",
      gluteal: "gluteal",
      glute: "gluteal",
      calves: "calf",
      calf: "calf",
      forearm: "forearms",
      forearms: "forearms",
    }),
    [],
  );

  // Memoize slug sets to avoid recreating on every render
  const backOnlySlugs = useMemo(
    () =>
      new Set([
        "upper-back",
        "lower-back",
        "lats",
        "back-deltoids",
        "trapezius",
        "triceps", // Can be on back, but library may treat it differently
      ]),
    [],
  );

  const frontOnlySlugs = useMemo(
    () =>
      new Set([
        "chest",
        "front-deltoids",
        "biceps",
        "forearms",
        "abs",
        "quadriceps",
        "quads",
      ]),
    [],
  );

  // Map body parts to the library's ExtendedBodyPart format
  const highlightedParts = useMemo(() => {
    return bodyParts.map((part) => {
      const normalizedSlug =
        slugNormalization[String(part.slug).toLowerCase()] ||
        String(part.slug).toLowerCase();
      return {
        slug: normalizedSlug as any,
        intensity:
          part.intensity === "heavy"
            ? 3
            : part.intensity === "moderate"
              ? 2
              : part.intensity === "light"
                ? 1
                : 0,
        color: getIntensityColor(part.intensity, colors),
      };
    });
  }, [bodyParts, colors, slugNormalization]);

  // Filter body parts based on view
  const frontParts = useMemo(() => {
    return highlightedParts.filter(
      (part) => !backOnlySlugs.has(String(part.slug).toLowerCase()),
    );
  }, [highlightedParts, backOnlySlugs]);

  const backParts = useMemo(() => {
    return highlightedParts.filter(
      (part) => !frontOnlySlugs.has(String(part.slug).toLowerCase()),
    );
  }, [highlightedParts, frontOnlySlugs]);

  const handleBodyPartClick = (part: any) => {
    const normalizedSlug =
      slugNormalization[String(part.slug).toLowerCase()] ||
      String(part.slug).toLowerCase();
    const matchedPart = bodyParts.find((bp) => {
      const bpSlug =
        slugNormalization[String(bp.slug).toLowerCase()] ||
        String(bp.slug).toLowerCase();
      return bpSlug === normalizedSlug;
    });
    if (matchedPart && interactive) {
      onBodyPartClick?.(matchedPart);
    }
  };

  if (dualView) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 w-full">
        {/* Mobile: Single view with toggle */}
        <div className="flex flex-col gap-4 md:hidden w-full">
          <div className="flex justify-center gap-2">
            <button
              onClick={() => setMobileView("front")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                mobileView === "front"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              Front
            </button>
            <button
              onClick={() => setMobileView("back")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                mobileView === "back"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              Back
            </button>
          </div>
          <div className="bg-gradient-to-b from-slate-900/20 to-slate-900/10 rounded-xl border border-border/40 p-4 flex justify-center">
            <BodyHighlighter
              gender={gender}
              side={mobileView}
              scale={config.scale}
              data={mobileView === "front" ? frontParts : backParts}
              colors={colors}
              onBodyPartClick={interactive ? handleBodyPartClick : undefined}
              border="none"
            />
          </div>
        </div>

        {/* Desktop: Side by side */}
        <div className="hidden md:grid md:grid-cols-2 gap-6 w-full">
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium text-center text-muted-foreground">
              Front
            </h3>
            <div className="bg-gradient-to-b from-slate-900/20 to-slate-900/10 rounded-xl border border-border/40 p-4 flex justify-center">
              <BodyHighlighter
                gender={gender}
                side="front"
                scale={config.scale}
                data={frontParts}
                colors={colors}
                onBodyPartClick={interactive ? handleBodyPartClick : undefined}
                border="none"
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium text-center text-muted-foreground">
              Back
            </h3>
            <div className="bg-gradient-to-b from-slate-900/20 to-slate-900/10 rounded-xl border border-border/40 p-4 flex justify-center">
              <BodyHighlighter
                gender={gender}
                side="back"
                scale={config.scale}
                data={backParts}
                colors={colors}
                onBodyPartClick={interactive ? handleBodyPartClick : undefined}
                border="none"
              />
            </div>
          </div>
        </div>

        {/* Legend */}
        {showLegend && (
          <div className="flex flex-wrap justify-center gap-4 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full shadow-sm"
                style={{ backgroundColor: colors[2] || "#ef4444" }}
              ></div>
              <span className="text-muted-foreground font-medium">
                {legendLabels?.[2] || "Heavy"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full shadow-sm"
                style={{ backgroundColor: colors[1] || "#f97316" }}
              ></div>
              <span className="text-muted-foreground font-medium">
                {legendLabels?.[1] || "Moderate"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full shadow-sm"
                style={{ backgroundColor: colors[0] || "#eab308" }}
              ></div>
              <span className="text-muted-foreground font-medium">
                {legendLabels?.[0] || "Light"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full shadow-sm"
                style={{ backgroundColor: defaultFill }}
              ></div>
              <span className="text-muted-foreground font-medium">
                Not Worked
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Single view mode
  return (
    <div className="flex flex-col items-center justify-center gap-6 w-full">
      <div className="bg-gradient-to-b from-slate-900/20 to-slate-900/10 rounded-xl border border-border/40 p-4 flex justify-center">
        <BodyHighlighter
          gender={gender}
          side={view}
          scale={config.scale}
          data={view === "front" ? frontParts : backParts}
          colors={colors}
          onBodyPartClick={interactive ? handleBodyPartClick : undefined}
          border="none"
        />
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="flex flex-wrap justify-center gap-4 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full shadow-sm"
              style={{ backgroundColor: colors[2] || "#ef4444" }}
            ></div>
            <span className="text-muted-foreground font-medium">
              {legendLabels?.[2] || "Heavy"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full shadow-sm"
              style={{ backgroundColor: colors[1] || "#f97316" }}
            ></div>
            <span className="text-muted-foreground font-medium">
              {legendLabels?.[1] || "Moderate"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full shadow-sm"
              style={{ backgroundColor: colors[0] || "#eab308" }}
            ></div>
            <span className="text-muted-foreground font-medium">
              {legendLabels?.[0] || "Light"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full shadow-sm"
              style={{ backgroundColor: defaultFill }}
            ></div>
            <span className="text-muted-foreground font-medium">Not Worked</span>
          </div>
        </div>
      )}
    </div>
  );
}
