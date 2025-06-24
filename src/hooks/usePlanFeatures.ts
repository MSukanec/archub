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

  const can = (feature: string): boolean => {
    // Verificar si la feature existe en el plan actual
    const featureValue = planFeatures[feature];
    
    // Si es un booleano, devolver directamente
    if (typeof featureValue === 'boolean') {
      return featureValue;
    }
    
    // Si es un número, verificar que sea mayor a 0
    if (typeof featureValue === 'number') {
      return featureValue > 0;
    }
    
    // Si la feature no está definida, por defecto denegado para features específicas
    const restrictedFeatures = ['max_members', 'team_management', 'advanced_analytics', 'export_data'];
    if (restrictedFeatures.includes(feature)) {
      return false;
    }
    
    return true;
  };

  const limit = (feature: string): number => {
    const featureValue = planFeatures[feature];
    
    // Si es un número, devolver el límite
    if (typeof featureValue === 'number') {
      return featureValue === -1 ? Infinity : featureValue;
    }
    
    // Si es booleano y true, asumir límite ilimitado
    if (featureValue === true) {
      return Infinity;
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