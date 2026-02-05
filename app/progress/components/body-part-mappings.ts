/**
 * Shared body part slug ↔ display-name mappings used across
 * the progress dashboard, photo upload, filter, and body diagram.
 *
 * Photos are stored with **slugs** (e.g. "hamstring").
 * Filters / UI show **display names** (e.g. "Hamstrings").
 */

export interface BodyPartEntry {
  name: string; // Display name (e.g. "Hamstrings")
  slug: string; // Slug stored in DB (e.g. "hamstring")
}

/** Canonical list – keep in sync with the upload component. */
export const BODY_PARTS: BodyPartEntry[] = [
  { name: "Chest", slug: "chest" },
  { name: "Abs", slug: "abs" },
  { name: "Biceps", slug: "biceps" },
  { name: "Triceps", slug: "triceps" },
  { name: "Forearms", slug: "forearms" },
  { name: "Front Deltoids", slug: "front-deltoids" },
  { name: "Back Deltoids", slug: "back-deltoids" },
  { name: "Shoulders", slug: "deltoids" },
  { name: "Trapezius", slug: "trapezius" },
  { name: "Lats", slug: "lats" },
  { name: "Upper Back", slug: "upper-back" },
  { name: "Lower Back", slug: "lower-back" },
  { name: "Back", slug: "back" },
  { name: "Obliques", slug: "obliques" },
  { name: "Neck", slug: "neck" },
  { name: "Glutes", slug: "gluteal" },
  { name: "Quads", slug: "quadriceps" },
  { name: "Hamstrings", slug: "hamstring" },
  { name: "Calves", slug: "calves" },
  { name: "Ankles", slug: "ankles" },
];

/** slug → display name */
export const SLUG_TO_NAME: Record<string, string> = Object.fromEntries(
  BODY_PARTS.map(({ name, slug }) => [slug, name]),
);

/** lowercase display name → slug */
export const NAME_TO_SLUG: Record<string, string> = Object.fromEntries(
  BODY_PARTS.map(({ name, slug }) => [name.toLowerCase(), slug]),
);

/** Display names only, for the dropdown */
export const BODY_PART_NAMES = BODY_PARTS.map((bp) => bp.name);

/**
 * Given a stored slug, return its display name (falls back to
 * title-casing the slug itself).
 */
export function slugToName(slug: string): string {
  return (
    SLUG_TO_NAME[slug] ||
    slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

/**
 * Given a display name, return the slug (falls back to
 * lowering + dashing the name).
 */
export function nameToSlug(name: string): string {
  return (
    NAME_TO_SLUG[name.toLowerCase()] || name.toLowerCase().replace(/\s+/g, "-")
  );
}

/**
 * Check if a photo's stored body-part slugs match any of the
 * selected filter slugs (case-insensitive, partial match).
 */
export function photoMatchesFilter(
  photoSlugs: string[],
  filterSlugs: string[],
): boolean {
  if (filterSlugs.length === 0) return true;

  const normalised = photoSlugs.map((s) => s.toLowerCase());
  return filterSlugs.some((filterSlug) => {
    const lower = filterSlug.toLowerCase();
    return normalised.some(
      (ps) => ps === lower || ps.includes(lower) || lower.includes(ps),
    );
  });
}

/**
 * Muscle name → body diagram slug mapping
 * Used to map workout muscle names to body diagram part slugs
 */
export const MUSCLE_TO_BODY_PART: Record<string, string> = {
  // Chest variations
  chest: "chest",
  pectorals: "chest",
  "pectoralis major": "chest",
  pecs: "chest",

  // Back variations
  back: "upper-back", // general back maps to upper-back
  lats: "lats", // keep lats separate for better mapping
  latissimus: "lats",
  "latissimus dorsi": "lats",
  rhomboids: "upper-back",
  "upper back": "upper-back",
  "lower back": "lower-back",

  // Shoulders
  shoulders: "deltoids",
  deltoids: "deltoids",
  "anterior deltoid": "front-deltoids",
  "posterior deltoid": "back-deltoids",
  "front deltoids": "front-deltoids",
  "back deltoids": "back-deltoids",

  // Neck
  neck: "neck",
  "neck muscles": "neck",
  sternocleidomastoid: "neck",

  // Arms
  biceps: "biceps",
  triceps: "triceps",
  forearms: "forearms", // use plural to match body parts list
  forearm: "forearms",
  wrists: "forearms", // map wrists to forearms
  wrist: "forearms",
  "wrist flexors": "forearms",
  "wrist extensors": "forearms",

  // Core
  abs: "abs",
  abdominals: "abs",
  obliques: "obliques",
  core: "abs",

  // Legs
  quads: "quadriceps",
  quadriceps: "quadriceps",
  hamstrings: "hamstring",
  hamstring: "hamstring",
  glutes: "gluteal",
  gluteus: "gluteal",
  "gluteus maximus": "gluteal",

  // Lower legs
  calves: "calves", // use plural to match body parts list
  calf: "calves",
  "calf muscles": "calves",
  gastrocnemius: "calves",
  soleus: "calves",

  // Ankles and feet
  ankles: "ankles",
  ankle: "ankles",
  feet: "ankles", // map feet to ankles for simplicity
  foot: "ankles",
};

/**
 * Get the body diagram slug for a muscle name
 */
export function getBodyPartSlug(muscleName: string): string {
  const normalizedName = muscleName.toLowerCase().trim();
  return (
    MUSCLE_TO_BODY_PART[normalizedName] || normalizedName.replace(/\s+/g, "_")
  );
}
