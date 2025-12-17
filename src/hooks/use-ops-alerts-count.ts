import { useQuery } from '@tanstack/react-query';

/**
 * Hook para contar alertas críticas/altas abiertas en el Ops Center
 * Solo disponible para admins
 */
export function useOpsAlertsCount(isAdmin: boolean) {
  return useQuery({
    queryKey: ['ops-alerts-critical-count'],
    queryFn: async () => {
      const res = await fetch('/api/admin/ops/stats', {
        credentials: 'include'
      });
      
      if (!res.ok) return 0;
      
      const stats = await res.json();
      return (stats.critical || 0) + (stats.high || 0);
    },
    enabled: isAdmin,
    staleTime: 60000, // 1 minuto
    refetchInterval: 60000, // Refetch cada minuto
  });
}
