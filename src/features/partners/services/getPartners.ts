import { supabase } from '@/lib/supabase';
import type { Partner, PartnerContact } from '../types';

export async function getPartners(organizationId: string): Promise<Partner[]> {
  if (!organizationId) return [];
  
  const { data, error } = await supabase
    .from('partners')
    .select(`
      id, 
      created_at, 
      contact_id,
      organization_id,
      contacts(
        id, 
        first_name, 
        last_name, 
        full_name,
        email, 
        phone, 
        company_name,
        avatar_url,
        linked_user_id
      )
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  
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
