/**
 * Enterprise Autosave Controller
 * 
 * Centralized controller for form autosave with enterprise-grade behavior:
 * - NEVER saves on onChange (only maintains draft state)
 * - Saves on: onBlur, Enter, select/toggle change, or explicit save
 * - Validates and normalizes data before saving
 * - Dirty checking to avoid unnecessary saves
 * 
 * This is the "brain" that coordinates saves. Individual fields use useAutosaveField.
 */

import { useCallback, useRef, useState } from 'react';
import { useQueryClient, QueryKey } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { normalizeFormData, hasMeaningfulDiff } from './normalizeValue';

export interface AutosaveControllerOptions<TData extends Record<string, any>> {
  queryKey: QueryKey;
  saveFn: (data: TData) => Promise<void>;
  additionalQueryKeys?: QueryKey[];
  onSaveSuccess?: () => void;
  onSaveError?: (error: Error) => void;
  errorMessage?: string;
  debounceMs?: number;
}

export interface AutosaveControllerReturn<TData extends Record<string, any>> {
  isSaving: boolean;
  lastSavedAt: Date | null;
  hasUnsavedChanges: boolean;
  save: (data: TData) => Promise<void>;
  saveDebounced: (data: TData) => void;
  cancelPendingSave: () => void;
  lastPersistedData: TData | null;
  setLastPersistedData: (data: TData) => void;
}

export function useAutosaveController<TData extends Record<string, any>>({
  queryKey,
  saveFn,
  additionalQueryKeys = [],
  onSaveSuccess,
  onSaveError,
  errorMessage = "No se pudieron guardar los cambios",
  debounceMs = 800,
}: AutosaveControllerOptions<TData>): AutosaveControllerReturn<TData> {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastPersistedData, setLastPersistedData] = useState<TData | null>(null);
  
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const savingRef = useRef(false);

  const cancelPendingSave = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
  }, []);

  const save = useCallback(async (data: TData) => {
    cancelPendingSave();
    
    const normalizedData = normalizeFormData(data);
    
    if (lastPersistedData && !hasMeaningfulDiff(normalizedData, lastPersistedData)) {
      setHasUnsavedChanges(false);
      return;
    }
    
    if (savingRef.current) return;
    savingRef.current = true;
    setIsSaving(true);
    
    try {
      await saveFn(normalizedData);
      setLastSavedAt(new Date());
      setHasUnsavedChanges(false);
      setLastPersistedData(normalizedData);
      
      queryClient.invalidateQueries({ queryKey });
      additionalQueryKeys.forEach(key => {
        queryClient.invalidateQueries({ queryKey: key });
      });
      
      onSaveSuccess?.();
    } catch (error) {
      console.error('[AutosaveController] Error:', error);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      onSaveError?.(error as Error);
    } finally {
      setIsSaving(false);
      savingRef.current = false;
    }
  }, [saveFn, queryClient, queryKey, additionalQueryKeys, lastPersistedData, cancelPendingSave, onSaveSuccess, onSaveError, errorMessage, toast]);

  const saveDebounced = useCallback((data: TData) => {
    setHasUnsavedChanges(true);
    cancelPendingSave();
    
    debounceTimeoutRef.current = setTimeout(() => {
      save(data);
    }, debounceMs);
  }, [save, debounceMs, cancelPendingSave]);

  return {
    isSaving,
    lastSavedAt,
    hasUnsavedChanges,
    save,
    saveDebounced,
    cancelPendingSave,
    lastPersistedData,
    setLastPersistedData,
  };
}
