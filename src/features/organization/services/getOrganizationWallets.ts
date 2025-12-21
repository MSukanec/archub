import { supabase } from '@/lib/supabase';
import type { OrganizationWallet } from '../types';

/**
 * Obtiene todas las billeteras activas de una organización con sus relaciones.
 * 
 * Incluye información de la billetera relacionada (wallet):
 * - ID, nombre, fecha de creación y estado activo
 * 
 * Los resultados se ordenan primero por billetera predeterminada,
 * luego por fecha de creación (más antigua primero).
 * 
 * @param organizationId - ID de la organización
 * @returns Array de billeteras de la organización, o array vacío si no hay datos
 * @throws {Error} Si falla la query principal
 */
export async function getOrganizationWallets(
  organizationId: string
): Promise<OrganizationWallet[]> {
  if (!organizationId) return [];
  
  const { data, error } = await supabase
    .from('organization_wallets')
    .select(`
      *,
      wallets:wallet_id (
        id,
        name,
        created_at,
        is_active
      )
    `)
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error('Error fetching organization wallets:', error);
    throw error;
  }
  
  return data as OrganizationWallet[];
}
