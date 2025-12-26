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
      return planName === 'pro'|| planName === 'teams';
    }
    
    // Si la feature no está definida, permitir por defecto (compatibilidad)
    return true;
  };
  const limit = (feature: string): number => {
    // Todos los límites están en el JSON features
    const featureValue = planFeatures[feature];
    
    if (typeof featureValue === 'number') {
      // -1 significa ilimitado
      return featureValue === -1 ? Infinity : featureValue;
    }
    
    if (featureValue === true) {
      return Infinity;
    }
    
    // Si no hay valor definido, retornar 0 (sin acceso)
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