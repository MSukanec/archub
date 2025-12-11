import { supabase } from '@/lib/supabase';
import type { Partner, PartnerContact } from '../types';

export async function getPartners(organizationId: string): Promise<Partner[]> {
  if (!organizationId) {
    console.log('[getPartners] No organizationId provided');
    return [];
  }
  
  console.log('[getPartners] Fetching partners for organization:', organizationId);
  
  const { data, error } = await supabase
    .from('partners')
    .select(`
      id, 
      created_at, 
      updated_at,
      contact_id,
      organization_id,
      notes,
      status,
      created_by,
      is_deleted,
      deleted_at,
      contacts(
        id, 
        first_name, 
        last_name, 
        full_name,
        email, 
        phone, 
        company_name,
        linked_user_id,
        image_bucket,
        image_path
      )
    `)
    .eq('organization_id', organizationId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[getPartners] Error fetching partners:', error);
    throw error;
  }
  
  console.log('[getPartners] Raw data received:', data?.length, 'partners');
  
  if (!data) return [];
  
  return data.map((partner: any) => {
    const rawContacts = partner.contacts;
    const contact: PartnerContact = Array.isArray(rawContacts) ? rawContacts[0] : rawContacts;
    
    return {
      ...partner,
      contacts: contact || null,
    } as Partner;
  });
}
