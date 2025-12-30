import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

type FeatureFlags = Record<string, boolean>;

export function useFeatureFlags() {
  return useQuery<FeatureFlags>({
    queryKey: ['/api/feature-flags'],
    staleTime: 1 * 1000,
    gcTime: 15 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function useFeatureFlag(key: string, defaultValue: boolean = true): { 
  value: boolean; 
  isLoading: boolean;
} {
  const { data: flags, isLoading } = useFeatureFlags();
  
  const value = useMemo(() => {
    if (!flags) return defaultValue;
    return flags[key] ?? defaultValue;
  }, [flags, key, defaultValue]);
  
  return { value, isLoading };
}

export function useMultipleFeatureFlags(keys: string[], defaultValue: boolean = true): { 
  flags: Record<string, boolean>;
  isLoading: boolean;
  isReady: boolean;
} {
  const { data: flagsData, isLoading } = useFeatureFlags();
  
  const flags = useMemo(() => {
    const result: Record<string, boolean> = {};
    for (const key of keys) {
      result[key] = flagsData?.[key] ?? defaultValue;
    }
    return result;
  }, [flagsData, keys, defaultValue]);
  
  return { 
    flags, 
    isLoading,
    isReady: !isLoading && !!flagsData
  };
}
