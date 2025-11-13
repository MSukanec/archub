// api/contacts.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { extractToken, getUserFromToken } from "./lib/auth-helpers.js";
import { getContacts } from "./lib/handlers/contacts/getContacts.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
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
    
    const ctx = { supabase };
    const params = {
      organizationId: organization_id as string,
      userId
    };

    const result = await getContacts(ctx, params);

    if (result.success) {
      return res.status(200).json(result.data);
    } else {
      return res.status(500).json({ error: result.error });
    }

  } catch (error: any) {
    console.error('Error in contacts endpoint:', error);
    return res.status(500).json({ error: error.message || "Failed to fetch contacts" });
  }
}
