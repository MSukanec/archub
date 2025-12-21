// api/lib/handlers/contacts/getContacts.ts
import { SupabaseClient } from "@supabase/supabase-js";

export interface GetContactsParams {
  organizationId: string;
  userId: string;
  mode?: 'full' | 'light'; // 'light' = only basic fields for selectors, 'full' = all enrichment
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
    const { organizationId, userId, mode = 'full' } = params;
    
    // LIGHT MODE: Fast query for selectors - only basic fields, no enrichment
    // NOTE: We include linked_user_id to filter out current user, but don't use .neq() 
    // because it excludes NULL values. We filter client-side instead.
    if (mode === 'light') {
      const { data: contacts, error: contactsError } = await ctx.supabase
        .from('contacts')
        .select('id, first_name, last_name, full_name, email, phone, linked_user_id, image_bucket, image_path, company_name, linked_user:users!contacts_linked_user_id_fkey(id, avatar_url)')
        .eq('organization_id', organizationId)
        .eq('is_deleted', false)
        .order('full_name', { ascending: true });
      
      if (contactsError) {
        console.error('Error fetching contacts (light):', contactsError);
        return {
          success: false,
          error: contactsError.message || "Failed to fetch contacts"
        };
      }
      
      // Filter out current user client-side (handles NULL linked_user_id correctly)
      const filteredContacts = (contacts || []).filter((c: any) => 
        !c.linked_user_id || c.linked_user_id !== userId
      );
      
      return {
        success: true,
        data: filteredContacts
      };
    }
    
    // FULL MODE: Complete enrichment with linked users, types, attachments, and signed URLs
    const { data: contacts, error: contactsError } = await ctx.supabase
      .from('contacts')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_deleted', false)
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
    
    // Parallel queries for enrichment
    const [linkedUsersResult, contactTypeLinksResult, attachmentCountsResult] = await Promise.all([
      // Query 2: Get linked users info (if any)
      linkedUserIds.length > 0 
        ? ctx.supabase.from('users').select('id, full_name, email, avatar_url').in('id', linkedUserIds)
        : Promise.resolve({ data: [] }),
      // Query 3: Get contact type links
      ctx.supabase.from('contact_type_links').select('contact_id, contact_type_id').in('contact_id', contactIds),
      // Query 5: Get attachments count for each contact
      ctx.supabase.from('contact_attachments').select('contact_id').in('contact_id', contactIds)
    ]);
    
    const linkedUsersMap = new Map((linkedUsersResult.data || []).map((u: any) => [u.id, u]));
    
    // Group contact type IDs by contact ID
    const contactTypesByContact = new Map<string, string[]>();
    if (contactTypeLinksResult.data) {
      for (const link of contactTypeLinksResult.data as any[]) {
        if (!contactTypesByContact.has(link.contact_id)) {
          contactTypesByContact.set(link.contact_id, []);
        }
        contactTypesByContact.get(link.contact_id)!.push(link.contact_type_id);
      }
    }
    
    // Query 4: Get contact types details
    const uniqueContactTypeIds = Array.from(new Set(contactTypeLinksResult.data?.map((l: any) => l.contact_type_id) || []));
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
    
    // Count attachments per contact
    const attachmentCountsByContact = new Map<string, number>();
    if (attachmentCountsResult.data) {
      for (const att of attachmentCountsResult.data as any[]) {
        const currentCount = attachmentCountsByContact.get(att.contact_id) || 0;
        attachmentCountsByContact.set(att.contact_id, currentCount + 1);
      }
    }
    
    // Generate signed URLs for contact avatars in parallel (batch of 5 at a time)
    const avatarUrlsByContactId = new Map<string, string>();
    const contactsWithAvatars = contacts.filter((c: any) => c.image_bucket && c.image_path);
    const batchSize = 5;
    for (let i = 0; i < contactsWithAvatars.length; i += batchSize) {
      const batch = contactsWithAvatars.slice(i, i + batchSize);
      const signedUrlPromises = batch.map(async (contact: any) => {
        try {
          const { data, error } = await ctx.supabase.storage
            .from(contact.image_bucket)
            .createSignedUrl(contact.image_path, 3600);
          
          if (data?.signedUrl && !error) {
            return { id: contact.id, url: data.signedUrl };
          }
        } catch (err) {
          // Silently skip
        }
        return null;
      });
      
      const results = await Promise.all(signedUrlPromises);
      results.filter(Boolean).forEach((r: any) => avatarUrlsByContactId.set(r.id, r.url));
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
        
        // Use contact avatar if available, otherwise use linked user avatar
        const avatar_url = avatarUrlsByContactId.get(contact.id) || linked_user?.avatar_url || null;
        
        return {
          ...contact,
          linked_user,
          contact_types,
          attachments_count,
          avatar_url
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
