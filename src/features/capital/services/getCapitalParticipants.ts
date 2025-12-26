import { supabase } from '@/lib/supabase';
import type { CapitalParticipant, CapitalParticipantContact } from '../types';
export async function getCapitalParticipants(organizationId: string): Promise<CapitalParticipant[]> {
  if (!organizationId) {
    return [];
  }
  
  const { data, error } = await supabase
    .from('capital_participants')
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
      ownership_percentage,
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
        image_path,
        linked_user:users!linked_user_id(id, full_name, avatar_url)
      )
    `)
    .eq('organization_id', organizationId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });
  if (error) {
    throw error;
  }
  
  if (!data) return [];
  
  return data.map((participant: any) => {
    const rawContacts = participant.contacts;
    const contact: CapitalParticipantContact = Array.isArray(rawContacts) ? rawContacts[0] : rawContacts;
    
    return {
      ...participant,
      contacts: contact || null,
    } as CapitalParticipant;
  });
}
// Backward compatibility alias
export const getPartners = getCapitalParticipants;
