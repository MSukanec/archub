import { useEffect, useRef, useState, useCallback } from 'react';

interface UseDebouncedAutoSaveOptions<T> {
  data: T;
  saveFn: (data: T) => Promise<void>;
  delay?: number;
  enabled?: boolean;
}

interface UseDebouncedAutoSaveReturn {
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

  useEffect(() => {
    // Skip first render to avoid saving initial data
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      previousDataRef.current = data;
      return;
    }

    // Deep comparison to avoid unnecessary saves
    const hasChanged = JSON.stringify(data) !== JSON.stringify(previousDataRef.current);
    
    console.log('useDebouncedAutoSave effect:', {
      hasChanged,
      enabled,
      data,
      previousData: previousDataRef.current
    });
    
    if (!hasChanged || !enabled || !data) {
      console.log('Skipping save:', { hasChanged, enabled, dataExists: !!data });
      return;
    }

    // Clear any existing timeout
    if (timeoutRef.current) {
      console.log('Clearing existing timeout');
      clearTimeout(timeoutRef.current);
    }

    console.log('Setting timeout for auto-save in', delay, 'ms');
    
    // Set new timeout for debounced save
    timeoutRef.current = setTimeout(() => {
      console.log('Executing auto-save...');
      debouncedSave(data);
    }, delay);

    // Update previous data reference
    previousDataRef.current = data;

    // Cleanup function
    return () => {
      console.log('useEffect cleanup called - clearing timeout');
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [data, delay, enabled, debouncedSave]);

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