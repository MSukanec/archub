import { useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient, QueryKey } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
export interface SaveEngineOptions<TData> {
  data: TData;
  queryKey: QueryKey;
  saveFn: (data: TData) => Promise<void>;
  delay?: number;
  enabled?: boolean;
  optimisticUpdate?: (oldData: any, newData: TData) => any;
  additionalQueryKeys?: QueryKey[];
  showSuccessToast?: boolean;
  successMessage?: string;
  errorMessage?: string;
}
export interface SaveEngineReturn {
  isSaving: boolean;
  lastSavedAt: Date | null;
  hasUnsavedChanges: boolean;
  saveNow: () => void;
}
export function useSaveEngine<TData>({
  data,
  queryKey,
  saveFn,
  delay = 2000,
  enabled = true,
  optimisticUpdate,
  additionalQueryKeys = [],
  showSuccessToast = false,
  successMessage = "Cambios guardados",
  errorMessage = "No se pudieron guardar los cambios",
}: SaveEngineOptions<TData>): SaveEngineReturn {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousDataRef = useRef<TData>(data);
  const isInitialLoadRef = useRef(true);
  const pendingDataRef = useRef<TData | null>(null);
  const hasNonEmptyValues = useCallback((obj: any): boolean => {
    if (!obj || typeof obj !== 'object') return false;
    return Object.values(obj).some(value => {
      if (typeof value === 'string') return value.trim() !== '';
      if (typeof value === 'number') return true;
      if (typeof value === 'boolean') return true;
      return value != null;
    });
  }, []);
  const executeSave = useCallback(async (dataToSave: TData) => {
    if (!enabled) return;
    setIsSaving(true);
    
    const previousCacheData = queryClient.getQueryData(queryKey);
    if (optimisticUpdate) {
      queryClient.setQueryData(queryKey, (oldData: any) => 
        optimisticUpdate(oldData, dataToSave)
      );
    }
    try {
      await saveFn(dataToSave);
      setLastSavedAt(new Date());
      setHasUnsavedChanges(false);
      
      queryClient.invalidateQueries({ queryKey });
      additionalQueryKeys.forEach(key => {
        queryClient.invalidateQueries({ queryKey: key });
      });
      if (showSuccessToast) {
        toast({
          title: "Guardado",
          description: successMessage,
        });
      }
    } catch (error) {
      console.error('[SaveEngine] Error:', error);
      
      if (optimisticUpdate && previousCacheData !== undefined) {
        queryClient.setQueryData(queryKey, previousCacheData);
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [enabled, saveFn, queryClient, queryKey, optimisticUpdate, additionalQueryKeys, showSuccessToast, successMessage, errorMessage, toast]);
  const saveNow = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (pendingDataRef.current) {
      executeSave(pendingDataRef.current);
      pendingDataRef.current = null;
    }
  }, [executeSave]);
  useEffect(() => {
    if (!enabled) return;
    const dataString = JSON.stringify(data);
    const previousString = JSON.stringify(previousDataRef.current);
    if (dataString === previousString) return;
    const previousHadValues = hasNonEmptyValues(previousDataRef.current);
    const currentHasValues = hasNonEmptyValues(data);
    if (isInitialLoadRef.current && !previousHadValues && currentHasValues) {
      previousDataRef.current = data;
      setTimeout(() => {
        isInitialLoadRef.current = false;
      }, 300);
      return;
    }
    isInitialLoadRef.current = false;
    previousDataRef.current = data;
    pendingDataRef.current = data;
    setHasUnsavedChanges(true);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      executeSave(data);
      pendingDataRef.current = null;
    }, delay);
  }, [JSON.stringify(data), delay, enabled, executeSave, hasNonEmptyValues]);
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
    hasUnsavedChanges,
    saveNow,
  };
}
