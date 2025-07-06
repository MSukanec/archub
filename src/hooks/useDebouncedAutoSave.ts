import { useEffect, useRef, useState, useCallback } from 'react';

interface AutoSaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<void>;
  dependencies: any[];
  delay?: number;
}

export function useDebouncedAutoSave<T>({
  data,
  onSave,
  dependencies,
  delay = 750
}: AutoSaveOptions<T>) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstRender = useRef(true);
  const lastDataRef = useRef<T>(data);

  const save = useCallback(async (dataToSave: T) => {
    try {
      setIsSaving(true);
      await onSave(dataToSave);
      setLastSavedAt(new Date());
      lastDataRef.current = dataToSave;
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsSaving(false);
    }
  }, [onSave]);

  useEffect(() => {
    // Skip on first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      lastDataRef.current = data;
      return;
    }

    // Deep comparison to prevent unnecessary saves
    if (JSON.stringify(data) === JSON.stringify(lastDataRef.current)) {
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      save(data);
    }, delay);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, dependencies);

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
    lastSavedAt
  };
}