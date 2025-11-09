import { useEffect, useRef, useState, useCallback } from 'react';

export interface UseDebouncedAutoSaveOptions<T> {
  data: T;
  saveFn: (data: T) => Promise<void>;
  delay?: number;
  enabled?: boolean;
}

export interface UseDebouncedAutoSaveReturn {
  isSaving: boolean;
  lastSavedAt: Date | null;
}

export function useDebouncedAutoSave<T>({
  data,
  saveFn,
  delay = 750,
  enabled = true,
}: UseDebouncedAutoSaveOptions<T>): UseDebouncedAutoSaveReturn {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousDataRef = useRef<T>(data);
  const isFirstRenderRef = useRef(true);
  const hasUserEditedRef = useRef(false);

  const debouncedSave = useCallback(async (dataToSave: T) => {
    if (!enabled || !dataToSave) {
      return;
    }

    setIsSaving(true);
    try {
      await saveFn(dataToSave);
      setLastSavedAt(new Date());
      console.log('Auto-save completed successfully');
    } catch (error) {
      console.error('Auto-save error:', error);
    } finally {
      setIsSaving(false);
    }
  }, [saveFn, enabled]);

  // Check if the data contains meaningful values (not just empty strings)
  const hasNonEmptyValues = useCallback((data: any): boolean => {
    if (!data || typeof data !== 'object') return false;
    
    return Object.values(data).some(value => {
      if (typeof value === 'string') return value.trim() !== '';
      if (typeof value === 'number') return value !== 0;
      if (typeof value === 'boolean') return true;
      return value != null;
    });
  }, []);

  useEffect(() => {
    // Skip first render to avoid saving initial data
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      previousDataRef.current = data;
      return;
    }

    // Deep comparison to avoid unnecessary saves
    const hasChanged = JSON.stringify(data) !== JSON.stringify(previousDataRef.current);
    
    if (!hasChanged || !enabled || !data) {
      return;
    }

    // Skip auto-save if this looks like initial data loading
    // (previous data was mostly empty and current data has values)
    const previousHadValues = hasNonEmptyValues(previousDataRef.current);
    const currentHasValues = hasNonEmptyValues(data);
    
    if (!previousHadValues && currentHasValues && !hasUserEditedRef.current) {
      // This looks like initial data loading, not user editing
      console.log('Skipping auto-save: detected initial data loading');
      previousDataRef.current = data;
      // Set a flag to enable saves after a delay (allowing for user interactions)
      setTimeout(() => {
        hasUserEditedRef.current = true;
      }, 1000);
      return;
    }

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Update previous data reference immediately
    previousDataRef.current = data;
    
    // Set new timeout for debounced save with shorter delay
    timeoutRef.current = setTimeout(() => {
      debouncedSave(data);
    }, delay);

  }, [JSON.stringify(data), delay, enabled, hasNonEmptyValues]); // Removed debouncedSave from dependencies

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isSaving,
    lastSavedAt,
  };
}