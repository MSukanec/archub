import { useCurrentUser } from '@/hooks/use-current-user';

interface PlanFeatures {
  features: Record<string, any>;
  can: (feature: string) => boolean;
  limit: (feature: string) => number;
}

export function usePlanFeatures(): PlanFeatures {
  const { data: userData } = useCurrentUser();
  
  // Obtener plan desde la organización actual
  const organizationId = userData?.preferences?.last_organization_id;
  const currentOrganization = userData?.organizations?.find(org => org.id === organizationId);
  const currentPlan = currentOrganization?.plan;
  

  
  // Obtener features del plan actual
  const planFeatures = currentPlan?.features || {};

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
    
    // Features específicas con restricción por nombre de plan
    const planName = currentPlan?.name?.toLowerCase();
    
    // Products Analysis - solo para Pro y superiores
    if (feature === 'products_analysis') {
      return planName !== 'free';
    }
    
    // Custom Project Color - solo para Pro y superiores
    if (feature === 'custom_project_color') {
      return planName === 'pro' || planName === 'teams';
    }
    
    // Si la feature no está definida, permitir por defecto (compatibilidad)
    return true;
  };

  const limit = (feature: string): number => {
    const featureValue = planFeatures[feature];
    
    // Si es un número en features, devolver el límite exacto
    if (typeof featureValue === 'number') {
      return featureValue === -1 ? Infinity : featureValue;
    }
    
    // Si es booleano y true, asumir límite ilimitado
    if (featureValue === true) {
      return Infinity;
    }
    
    // PRIORIDAD 1: Leer límites directamente de las columnas del plan (desde la DB)
    // Estos valores vienen de: plans.max_projects, plans.max_members, plans.max_storage_mb, plans.max_ai_tokens
    if (feature === 'max_members') {
      const dbValue = currentPlan?.max_members;
      if (dbValue !== undefined && dbValue !== null) {
        return dbValue === -1 ? Infinity : dbValue;
      }
    }
    
    if (feature === 'max_projects') {
      const dbValue = currentPlan?.max_projects;
      if (dbValue !== undefined && dbValue !== null) {
        return dbValue === -1 ? Infinity : dbValue;
      }
    }
    
    if (feature === 'max_storage_mb') {
      const dbValue = currentPlan?.max_storage_mb;
      if (dbValue !== undefined && dbValue !== null) {
        return dbValue === -1 ? Infinity : dbValue;
      }
    }
    
    if (feature === 'max_ai_tokens') {
      const dbValue = currentPlan?.max_ai_tokens;
      if (dbValue !== undefined && dbValue !== null) {
        return dbValue === -1 ? Infinity : dbValue;
      }
    }
    
    if (feature === 'max_kanban_boards') {
      const dbValue = currentPlan?.max_kanban_boards;
      if (dbValue !== undefined && dbValue !== null) {
        return dbValue === -1 ? Infinity : dbValue;
      }
      // Fallback: use max_projects as proxy for kanban boards if not defined
      const projectsLimit = currentPlan?.max_projects;
      if (projectsLimit !== undefined && projectsLimit !== null) {
        return projectsLimit === -1 ? Infinity : projectsLimit;
      }
    }
    
    // FALLBACK: Si no hay valor en la DB, devolver 0 (más restrictivo)
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