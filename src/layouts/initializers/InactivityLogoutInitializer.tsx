import { useCurrentUser } from '@/features/users/hooks';
import { useInactivityLogout } from '@/hooks/useInactivityLogout';

/**
 * Inicializador de logout por inactividad
 * Debe estar DENTRO del QueryClientProvider para que funcione correctamente
 */
export function InactivityLogoutInitializer() {
  const { data: userData } = useCurrentUser();
  
  // Activar logout por inactividad solo si el usuario está autenticado
  useInactivityLogout(!!userData?.user);

  // Este componente no renderiza nada
  return null;
}
