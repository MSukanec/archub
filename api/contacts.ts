// api/contacts.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { extractToken, getUserFromToken } from "../lib/auth-helpers";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Only GET method allowed
    if (req.method !== 'GET') {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { organization_id } = req.query;
    
    if (!organization_id) {
      return res.status(400).json({ error: "organization_id is required" });
    }
    
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: "No authorization token provided" });
    }
    
    const userResult = await getUserFromToken(token);
    if (!userResult) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { userId, supabase } = userResult;
    
    // Query 1: Get all contacts for organization (NO nested relations)
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('*')
      .eq('organization_id', organization_id as string)
      .order('first_name', { ascending: true });
    
    if (contactsError) {
      return res.status(500).json({ error: "Failed to fetch contacts" });
    }
    
    if (!contacts || contacts.length === 0) {
      return res.json([]);
    }
    
    // Get unique linked user IDs and contact IDs
    const linkedUserIds = Array.from(new Set(contacts.map((c: any) => c.linked_user_id).filter(Boolean)));
    const contactIds = contacts.map((c: any) => c.id);
    
    // Query 2: Get linked users info (if any)
    let linkedUsersMap = new Map();
    if (linkedUserIds.length > 0) {
      const { data: linkedUsers } = await supabase
        .from('users')
        .select('id, full_name, email, avatar_url')
        .in('id', linkedUserIds);
      
      if (linkedUsers) {
        linkedUsersMap = new Map(linkedUsers.map((u: any) => [u.id, u]));
      }
    }
    
    // Query 3: Get contact type links
    const { data: contactTypeLinks } = await supabase
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
      const { data: contactTypes } = await supabase
        .from('contact_types')
        .select('id, name')
        .in('id', uniqueContactTypeIds);
      
      if (contactTypes) {
        contactTypesMap = new Map(contactTypes.map((ct: any) => [ct.id, ct]));
      }
    }
    
    // Query 5: Get attachments count for each contact
    const { data: attachmentCounts } = await supabase
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
    
    res.json(enrichedContacts);
  } catch (error) {
    console.error('Error in contacts handler:', error);
    res.status(500).json({ error: "Failed to fetch contacts" });
  }
}
