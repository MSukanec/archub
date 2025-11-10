// api/organization-members/[organizationId].ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { extractToken, requireUser, HttpError } from "../_lib/auth-helpers";
import { getOrganizationMembers } from "../_lib/handlers/organization/getOrganizationMembers";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const token = extractToken(req.headers.authorization as string);
    const { userId, supabase } = await requireUser(token);
    
    const { organizationId } = req.query;
    
    if (!organizationId || typeof organizationId !== 'string') {
      return res.status(400).json({ error: "Organization ID is required" });
    }

    const members = await getOrganizationMembers(supabase, organizationId, userId);
    return res.status(200).json(members);
  } catch (err: any) {
    if (err instanceof HttpError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error("Error in organization-members:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}
