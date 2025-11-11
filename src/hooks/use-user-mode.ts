import { useCurrentUser } from './use-current-user';
import type { UserMode } from '@/config/modes';

/**
 * Hook para obtener el modo de uso actual del usuario
 * El modo se almacena en user_preferences.last_user_type
 * 
 * Modos disponibles:
 * - 'professional': Acceso completo a organización y proyectos
 * - 'learner': Solo acceso a capacitaciones
 * - 'provider': Para proveedores (futuro)
 * - 'worker': Para mano de obra (futuro)
 */
export function useUserMode(): UserMode {
  const { data: userData } = useCurrentUser();
  
  // Obtener el modo desde user_preferences, por defecto 'professional'
  const mode = userData?.preferences?.last_user_type as UserMode | undefined;
  
  return mode || 'professional';
}
