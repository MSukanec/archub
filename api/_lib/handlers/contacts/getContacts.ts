// api/_lib/handlers/contacts/getContacts.ts
import { SupabaseClient } from "@supabase/supabase-js";

export interface GetContactsParams {
  organizationId: string;
  userId: string;
}

export interface GetContactsResult {
  success: boolean;
  data?: any[];
  error?: string;
}

export async function getContacts(
  ctx: { supabase: SupabaseClient },
  params: GetContactsParams
): Promise<GetContactsResult> {
  try {
    const { organizationId, userId } = params;
    
    // Query 1: Get all contacts for organization
    const { data: contacts, error: contactsError } = await ctx.supabase
      .from('contacts')
      .select('*')
      .eq('organization_id', organizationId)
      .order('first_name', { ascending: true });
    
    if (contactsError) {
      console.error('Error fetching contacts:', contactsError);
      return {
        success: false,
        error: contactsError.message || "Failed to fetch contacts"
      };
    }
    
    if (!contacts || contacts.length === 0) {
      return {
        success: true,
        data: []
      };
    }
    
    // Get unique linked user IDs and contact IDs
    const linkedUserIds = Array.from(new Set(contacts.map((c: any) => c.linked_user_id).filter(Boolean)));
    const contactIds = contacts.map((c: any) => c.id);
    
    // Query 2: Get linked users info (if any)
    let linkedUsersMap = new Map();
    if (linkedUserIds.length > 0) {
      const { data: linkedUsers } = await ctx.supabase
        .from('users')
        .select('id, full_name, email, avatar_url')
        .in('id', linkedUserIds);
      
      if (linkedUsers) {
        linkedUsersMap = new Map(linkedUsers.map((u: any) => [u.id, u]));
      }
    }
    
    // Query 3: Get contact type links
    const { data: contactTypeLinks } = await ctx.supabase
      .from('contact_type_links')
      .select('contact_id, contact_type_id')
      .in('contact_id', contactIds);
    
    // Group contact type IDs by contact ID
    const contactTypesByContact = new Map<string, string[]>();
    if (contactTypeLinks) {
      for (const link of contactTypeLinks as any[]) {
        if (!contactTypesByContact.has(link.contact_id)) {
          contactTypesByContact.set(link.contact_id, []);
        }
        contactTypesByContact.get(link.contact_id)!.push(link.contact_type_id);
      }
    }
    
    // Query 4: Get contact types details
    const uniqueContactTypeIds = Array.from(new Set(contactTypeLinks?.map((l: any) => l.contact_type_id) || []));
    let contactTypesMap = new Map();
    if (uniqueContactTypeIds.length > 0) {
      const { data: contactTypes } = await ctx.supabase
        .from('contact_types')
        .select('id, name')
        .in('id', uniqueContactTypeIds);
      
      if (contactTypes) {
        contactTypesMap = new Map(contactTypes.map((ct: any) => [ct.id, ct]));
      }
    }
    
    // Query 5: Get attachments count for each contact
    const { data: attachmentCounts } = await ctx.supabase
      .from('contact_attachments')
      .select('contact_id')
      .in('contact_id', contactIds);
    
    // Count attachments per contact
    const attachmentCountsByContact = new Map<string, number>();
    if (attachmentCounts) {
      for (const att of attachmentCounts as any[]) {
        const currentCount = attachmentCountsByContact.get(att.contact_id) || 0;
        attachmentCountsByContact.set(att.contact_id, currentCount + 1);
      }
    }
    
    // Combine all data
    const enrichedContacts = contacts
      .filter((contact: any) => contact.linked_user_id !== userId) // Filter out current user
      .map((contact: any) => {
        const linked_user = contact.linked_user_id 
          ? linkedUsersMap.get(contact.linked_user_id) || null
          : null;
        
        const typeIds = contactTypesByContact.get(contact.id) || [];
        const contact_types = typeIds
          .map(id => contactTypesMap.get(id))
          .filter(Boolean);
        
        const attachments_count = attachmentCountsByContact.get(contact.id) || 0;
        
        return {
          ...contact,
          linked_user,
          contact_types,
          attachments_count
        };
      });
    
    return {
      success: true,
      data: enrichedContacts
    };
  } catch (error: any) {
    console.error('Error in getContacts handler:', error);
    return {
      success: false,
      error: error.message || "Failed to fetch contacts"
    };
  }
}
