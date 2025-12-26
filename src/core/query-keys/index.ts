/**
 * Centralized Query Keys System
 * 
 * ARQUITECTURA ENTERPRISE DE CACHE - SEENCEL
 * ==========================================
 * 
 * Este directorio contiene las query keys centralizadas para todas las entidades.
 * 
 * REGLAS OBLIGATORIAS:
 * 1. Una entidad = un archivo de keys (e.g., projects.keys.ts)
 * 2. TODAS las queries DEBEN importar sus keys desde aquí
 * 3. PROHIBIDO crear query keys inline en componentes
 * 4. Las mutaciones actualizan cache directamente con setQueryData
 * 5. Cero invalidaciones masivas o keys paralelas
 * 
 * @example
 * import { projectsKeys } from '@/core/query-keys'
 * 
 * // En queries:
 * useQuery({ queryKey: projectsKeys.list(organizationId) })
 * 
 * // En mutaciones:
 * queryClient.setQueryData(projectsKeys.detail(projectId), updatedData)
 */

export { projectsKeys } from './projects.keys';
export type { ProjectsQueryKey } from './projects.keys';

export { contactsKeys, contactTypesKeys } from './contacts.keys';
export type { ContactsQueryKey, ContactTypesQueryKey } from './contacts.keys';

export { organizationKeys, userOrgPreferencesKeys } from './organization.keys';
export type { OrganizationQueryKey, UserOrgPreferencesQueryKey } from './organization.keys';

export { generalCostsKeys } from './general-costs.keys';
export type { GeneralCostsQueryKey } from './general-costs.keys';

export { usersKeys } from './users.keys';
export type { UsersQueryKey } from './users.keys';

export { capitalKeys } from './capital.keys';
export type { CapitalQueryKey } from './capital.keys';
