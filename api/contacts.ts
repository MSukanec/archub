// api/contacts.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { extractToken, getUserFromToken } from "./_lib/auth-helpers.js";

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

    const { supabase } = userResult;
    
    // Get all contacts for organization
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('organization_id', organization_id as string)
      .order('first_name', { ascending: true });
    
    if (error) {
      console.error('Error fetching contacts:', error);
      return res.status(500).json({ error: error.message || "Failed to fetch contacts" });
    }
    
    return res.status(200).json({ contacts: data || [] });
  } catch (error: any) {
    console.error('Error in contacts handler:', error);
    return res.status(500).json({ error: error.message || "Failed to fetch contacts" });
  }
}
