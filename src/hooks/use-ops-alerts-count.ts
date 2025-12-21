import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Hook para contar alertas críticas/altas abiertas en el Ops Center
 * Solo disponible para admins - memoizes access token to avoid timing issues during refresh
 */
export function useOpsAlertsCount(isAdmin: boolean) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  
  // Memoize access token to avoid issues when getSession returns null during token refresh
  useEffect(() => {
    if (!isAdmin) {
      setAccessToken(null);
      return;
    }
    
    // Get initial token
    supabase.auth.getSession().then(({ data }) => {
      setAccessToken(data.session?.access_token ?? null);
    });
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setAccessToken(session?.access_token ?? null);
    });
    
    return () => subscription.unsubscribe();
  }, [isAdmin]);
  
  return useQuery({
    queryKey: ['ops-alerts-critical-count'],
    queryFn: async () => {
      // Use memoized token - already validated in enabled check
      if (!accessToken) return 0;
      
      try {
        const res = await fetch('/api/admin/ops/stats', {
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        
        if (!res.ok) return 0;
        
        const stats = await res.json();
        return (stats.critical || 0) + (stats.high || 0);
      } catch {
        // Silently fail - user may not have access or server error
        return 0;
      }
    },
    enabled: !!isAdmin && !!accessToken, // Only run if admin AND has token
    staleTime: 60000, // 1 minuto
    refetchInterval: isAdmin && accessToken ? 60000 : false, // Refetch cada minuto solo si es admin con token
    retry: false, // Don't retry on failure
  });
}
