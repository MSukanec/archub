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
        image_path,
        avatar_attachment_id
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

  // Get contact IDs and fetch their attachments in parallel
  const contactIds = data
    .map((p: any) => (Array.isArray(p.contacts) ? p.contacts[0]?.id : p.contacts?.id))
    .filter(Boolean);

  let attachmentsMap = new Map<string, any[]>();
  if (contactIds.length > 0) {
    const { data: attachments, error: attachmentsError } = await supabase
      .from('contact_attachments')
      .select('contact_id, id, storage_bucket, storage_path')
      .in('contact_id', contactIds);

    if (attachmentsError) {
      console.error('[getPartners] Error fetching attachments:', attachmentsError);
    } else {
      // Group attachments by contact_id
      attachments?.forEach((att: any) => {
        if (!attachmentsMap.has(att.contact_id)) {
          attachmentsMap.set(att.contact_id, []);
        }
        attachmentsMap.get(att.contact_id)!.push(att);
      });
    }
  }
  
  return data.map((partner: any) => {
    const rawContacts = partner.contacts;
    const contact: any = Array.isArray(rawContacts) ? rawContacts[0] : rawContacts;
    
    // Add contact_attachments from our map
    if (contact) {
      contact.contact_attachments = attachmentsMap.get(contact.id) || [];
    }
    
    return {
      ...partner,
      contacts: contact || null,
    } as Partner;
  });
}
