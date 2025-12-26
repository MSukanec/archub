/**
 * Enterprise Autosave - Value Normalization Utilities
 * 
 * Normalizes form values before saving to prevent DB constraint violations.
 * Empty strings become null, strings are trimmed, etc.
 */
export function normalizeStringValue(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = value.trim();
  return trimmed === ''? null : trimmed;
}
export function normalizeFormData<T extends Record<string, any>>(data: T): T {
  const normalized = { ...data };
  
  for (const key of Object.keys(normalized)) {
    const value = normalized[key];
    
    if (typeof value === 'string') {
      (normalized as any)[key] = normalizeStringValue(value);
    }
  }
  
  return normalized;
}
export function hasFieldChanged<T>(current: T, previous: T): boolean {
  const normalizedCurrent = typeof current === 'string'? normalizeStringValue(current) : current;
  const normalizedPrevious = typeof previous === 'string'? normalizeStringValue(previous) : previous;
  
  return normalizedCurrent !== normalizedPrevious;
}
export function hasMeaningfulDiff<T extends Record<string, any>>(
  current: T,
  previous: T
): boolean {
  const normalizedCurrent = normalizeFormData(current);
  const normalizedPrevious = normalizeFormData(previous);
  
  return JSON.stringify(normalizedCurrent) !== JSON.stringify(normalizedPrevious);
}
