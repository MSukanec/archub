/**
 * Hook to get AI-powered column mapping suggestions.
 * Calls the backend endpoint that combines memory + OpenAI.
 */
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { TargetField } from '../types';
interface AISuggestMappingParams {
  headers: string[];
  sampleRows: any[];
  targetSchema: TargetField[];
  entity: string;
  organizationId?: string | null;
}
interface AISuggestMappingResult {
  mapping: Record<string, string>;
  confidence: Record<string, number>;
}
interface SaveMappingsParams {
  organizationId: string;
  entity: string;
  mappings: Array<{ sourceHeader: string; targetField: string }>;
}
interface UseAISuggestMappingReturn {
  suggestMapping: (params: AISuggestMappingParams) => Promise<AISuggestMappingResult>;
  saveMappings: (params: SaveMappingsParams) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}
export function useAISuggestMapping(): UseAISuggestMappingReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const suggestMapping = useCallback(async (params: AISuggestMappingParams): Promise<AISuggestMappingResult> => {
    const { data } = await supabase.auth.getSession();
    const session = data?.session;
    if (!session?.access_token) {
      console.warn('No authorization token available - returning empty mapping');
      return { mapping: {}, confidence: {} };
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/import/ai-suggest-mapping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(params)
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      const result = await response.json();
      return result as AISuggestMappingResult;
    } catch (err: any) {
      const errorMessage = err.message || 'Error getting AI suggestions';
      setError(errorMessage);
      console.error('AI suggest mapping error:', err);
      return { mapping: {}, confidence: {} };
    } finally {
      setIsLoading(false);
    }
  }, []);
  const saveMappings = useCallback(async (params: SaveMappingsParams): Promise<void> => {
    const { data } = await supabase.auth.getSession();
    const session = data?.session;
    if (!session?.access_token) {
      console.warn('No auth token - skipping save mappings');
      return;
    }
    try {
      const response = await fetch('/api/import/save-mappings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(params)
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Save mappings failed:', errorData.error);
      }
    } catch (err: any) {
      console.error('Save mappings error:', err);
    }
  }, []);
  return { suggestMapping, saveMappings, isLoading, error };
}
