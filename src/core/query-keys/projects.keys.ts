/**
 * Centralized Query Keys for Projects Feature
 * 
 * ARQUITECTURA ENTERPRISE DE CACHE
 * ================================
 * 
 * Una entidad = una familia única y centralizada de query keys
 * Las mutaciones actualizan el cache directamente, no dependen de invalidaciones sueltas
 * 
 * REGLAS ESTRICTAS:
 * 1. TODAS las queries de projects DEBEN usar estas keys
 * 2. PROHIBIDO crear query keys inline en componentes
 * 3. PROHIBIDO keys paralelas como ['projects-lite'], ['project-info'], etc.
 * 4. Las mutaciones DEBEN usar queryClient.setQueryData() para actualizar cache
 * 5. Cero invalidaciones masivas
 * 
 * @example
 * // En queries:
 * useQuery({ queryKey: projectsKeys.list(organizationId) })
 * useQuery({ queryKey: projectsKeys.detail(projectId) })
 * 
 * @example
 * // En mutaciones:
 * onSuccess(updatedProject) {
 *   queryClient.setQueryData(projectsKeys.detail(projectId), updatedProject)
 *   queryClient.setQueryData(projectsKeys.list(orgId), (old) => 
 *     old?.map(p => p.id === projectId ? updatedProject : p)
 *   )
 * }
 */

export const projectsKeys = {
  /** Base key para todos los datos de projects */
  all: ['projects'] as const,

  // ═══════════════════════════════════════════════════════════════
  // LISTAS DE PROYECTOS
  // ═══════════════════════════════════════════════════════════════
  
  /** Base para todas las listas */
  lists: () => [...projectsKeys.all, 'list'] as const,
  
  /** Lista de proyectos por organización (FUENTE ÚNICA DE VERDAD) */
  list: (organizationId: string | undefined) => 
    [...projectsKeys.lists(), organizationId] as const,
  
  /** Conteo de proyectos */
  count: (organizationId: string | undefined) => 
    [...projectsKeys.all, 'count', organizationId] as const,

  // ═══════════════════════════════════════════════════════════════
  // DETALLES DE PROYECTO INDIVIDUAL
  // ═══════════════════════════════════════════════════════════════
  
  /** Base para todos los detalles */
  details: () => [...projectsKeys.all, 'detail'] as const,
  
  /** Detalle completo de un proyecto (incluye project_data) */
  detail: (projectId: string | undefined) => 
    [...projectsKeys.details(), projectId] as const,
  
  /** Datos básicos del proyecto (tabla projects) */
  info: (projectId: string | undefined) => 
    [...projectsKeys.details(), projectId, 'info'] as const,
  
  /** Datos extendidos del proyecto (tabla project_data) */
  data: (projectId: string | undefined) => 
    [...projectsKeys.details(), projectId, 'data'] as const,

  // ═══════════════════════════════════════════════════════════════
  // ASSETS DEL PROYECTO (IMÁGENES)
  // ═══════════════════════════════════════════════════════════════
  
  /** Base para todos los assets */
  assets: () => [...projectsKeys.all, 'assets'] as const,
  
  /** URL de imagen del proyecto */
  image: (projectId: string | undefined) => 
    [...projectsKeys.assets(), projectId, 'image'] as const,

  // ═══════════════════════════════════════════════════════════════
  // ESTADÍSTICAS Y ACTIVIDAD
  // ═══════════════════════════════════════════════════════════════
  
  /** Estadísticas del proyecto */
  stats: (organizationId: string | undefined, projectId: string | undefined) => 
    [...projectsKeys.all, 'stats', organizationId, projectId] as const,
  
  /** Historial de actividad */
  activity: (organizationId: string | undefined, projectId: string | undefined) => 
    [...projectsKeys.all, 'activity', organizationId, projectId] as const,

  // ═══════════════════════════════════════════════════════════════
  // CONFIGURACIÓN (TIPOS Y MODALIDADES)
  // ═══════════════════════════════════════════════════════════════
  
  /** Base para tipos de proyecto */
  types: () => [...projectsKeys.all, 'types'] as const,
  
  /** Lista de tipos por organización */
  typeList: (organizationId: string | undefined) => 
    [...projectsKeys.types(), organizationId] as const,
  
  /** Base para modalidades */
  modalities: () => [...projectsKeys.all, 'modalities'] as const,
  
  /** Lista de modalidades por organización */
  modalityList: (organizationId: string | undefined) => 
    [...projectsKeys.modalities(), organizationId] as const,
} as const;

/** Tipo de las query keys de projects */
export type ProjectsQueryKey = readonly (string | undefined)[];
