import { useCurrentUser } from '@/hooks/use-current-user';

interface PlanFeatures {
  features: Record<string, any>;
  can: (feature: string) => boolean;
  limit: (feature: string) => number;
}

export function usePlanFeatures(): PlanFeatures {
  const { data: userData } = useCurrentUser();
  
  // Obtener features reales del plan desde la base de datos
  const planFeatures = userData?.organization?.plan?.features || {};
  
  // Verificar si tenemos datos válidos del plan

  const can = (feature: string): boolean => {
    // Verificar si la feature existe en el plan actual
    const featureValue = planFeatures[feature];
    
    // Si es un booleano, devolver directamente
    if (typeof featureValue === 'boolean') {
      return featureValue;
    }
    
    // Si es un número, verificar que sea mayor a 0 (0 significa no permitido)
    if (typeof featureValue === 'number') {
      return featureValue > 0;
    }
    
    // Si la feature no está definida, permitir por defecto (compatibilidad)
    return true;
  };

  const limit = (feature: string): number => {
    const featureValue = planFeatures[feature];
    
    // Si es un número, devolver el límite exacto
    if (typeof featureValue === 'number') {
      return featureValue === -1 ? Infinity : featureValue;
    }
    
    // Si es booleano y true, asumir límite ilimitado
    if (featureValue === true) {
      return Infinity;
    }
    
    // Si no hay features o la feature no existe, usar valores por defecto basados en el plan
    const planName = userData?.organization?.plan?.name;
    if (planName === 'TEAMS' && feature === 'max_members') {
      return 999;
    }
    if (planName === 'PRO' && feature === 'max_members') {
      return Infinity;
    }
    if (planName === 'FREE' && feature === 'max_members') {
      return 5;
    }
    
    // Si es false o no existe, límite es 0
    return 0;
  };

  return {
    features: planFeatures,
    can,
    limit,
  };
}

// Hook auxiliar para verificar límites específicos
export function usePlanLimits() {
  const { limit } = usePlanFeatures();
  const { data: userData } = useCurrentUser();

  const getProjectsLimit = () => limit('max_projects');
  const getOrganizationsLimit = () => limit('max_organizations');
  const getMembersLimit = () => limit('max_members');
  const getStorageLimit = () => limit('max_storage_gb');

  const getCurrentProjects = () => userData?.organizations?.length || 0;
  const getCurrentOrganizations = () => userData?.organizations?.length || 0;

  return {
    getProjectsLimit,
    getOrganizationsLimit,
    getMembersLimit,
    getStorageLimit,
    getCurrentProjects,
    getCurrentOrganizations,
  };
}