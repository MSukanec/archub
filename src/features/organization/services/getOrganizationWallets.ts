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
  
  // Query from optimized view (organization_wallets_view)
  const { data, error } = await supabase
    .from('organization_wallets_view')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error('Error fetching organization wallets:', error);
    throw error;
  }
  
  // Transform flat view data to nested structure expected by frontend
  const transformedData = (data || []).map((w: any) => ({
    id: w.id,
    organization_id: w.organization_id,
    wallet_id: w.wallet_id,
    is_active: w.is_active,
    is_default: w.is_default,
    is_deleted: w.is_deleted,
    deleted_at: w.deleted_at,
    created_at: w.created_at,
    updated_at: w.updated_at,
    created_by: w.created_by,
    wallets: {
      id: w.wallet_id,
      name: w.wallet_name,
      created_at: w.wallet_created_at,
      is_active: w.wallet_is_active,
    },
  }));
  
  return transformedData as OrganizationWallet[];
}
