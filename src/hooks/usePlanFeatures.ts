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
    // PRIORIDAD 1: Leer límites directamente de las columnas del plan (desde la DB)
    // La tabla `plans` es la ÚNICA fuente de verdad para los límites
    // Estas columnas tienen prioridad sobre cualquier valor en el JSON features
    
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
      // Fallback: use max_projects as proxy for kanban boards
      const projectsLimit = currentPlan?.max_projects;
      if (projectsLimit !== undefined && projectsLimit !== null) {
        return projectsLimit === -1 ? Infinity : projectsLimit;
      }
    }
    
    // PRIORIDAD 2: Solo para features NO cubiertas por columnas de la DB,
    // verificar el JSON features como fallback
    const featureValue = planFeatures[feature];
    
    if (typeof featureValue === 'number') {
      return featureValue === -1 ? Infinity : featureValue;
    }
    
    if (featureValue === true) {
      return Infinity;
    }
    
    // FALLBACK: Si no hay valor en la DB ni en features, devolver 0 (más restrictivo)
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