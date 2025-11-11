/**
 * Layout width utilities
 * Shared between Layout.tsx and PageLayout.tsx to avoid circular dependencies
 */

export type WidthMode = "normal" | "wide" | "full";
export type WidthProp = boolean | "full";

/**
 * Resolves width prop value to internal width mode
 * @param wide - Width prop value (false | true | "full")
 * @returns Internal width mode ("normal" | "wide" | "full")
 */
export function resolveWidthMode(wide?: WidthProp): WidthMode {
  if (wide === "full") return "full";
  if (wide === true) return "wide";
  return "normal";
}

/**
 * Gets container classes based on width mode
 * @param mode - Width mode
 * @returns Container class string
 */
export function getContainerClasses(mode: WidthMode): string {
  return mode === "normal" ? "max-w-[1440px] mx-auto" : "";
}

/**
 * Gets padding classes for header based on width mode
 * In full mode, header maintains wide padding (px-24)
 * @param mode - Width mode
 * @returns Padding class string
 */
export function getHeaderPaddingClasses(mode: WidthMode): string {
  if (mode === "full") return "px-24"; // Header keeps padding in full mode
  if (mode === "wide") return "px-24";
  return "px-20";
}

/**
 * Gets padding classes for content based on width mode
 * In full mode, content has zero padding (px-0)
 * @param mode - Width mode
 * @returns Padding class string
 */
export function getContentPaddingClasses(mode: WidthMode): string {
  if (mode === "full") return "px-0"; // Content has no padding in full mode
  if (mode === "wide") return "px-24";
  return "px-20";
}
