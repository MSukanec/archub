// api/invite-member.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { extractToken, getUserFromToken } from "./lib/auth-helpers.js";
import { inviteMember } from "./lib/handlers/organization/inviteMember.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Extract token and authenticate user
    const token = extractToken(req.headers.authorization);
    
    if (!token) {
      return res.status(401).json({ error: "No authorization token provided" });
    }
    
    const userAuth = await getUserFromToken(token);

    if (!userAuth) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { userId, supabase } = userAuth;

    // Parse request body
    const { email, roleId, organizationId } = req.body;

    // Create context and call handler
    const ctx = { supabase };
    const params = {
      email,
      roleId,
      organizationId,
      userId
    };

    const result = await inviteMember(ctx, params);

    if (result.success) {
      return res.status(200).json(result.data);
    } else {
      return res.status(400).json({ error: result.error });
    }

  } catch (err: any) {
    console.error("Invite member error:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}
