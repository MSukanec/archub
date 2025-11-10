// api/pending-invitations/[userId].ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { extractToken, requireUser, HttpError } from "../_lib/auth-helpers";
import { getPendingInvitations } from "../_lib/handlers/organization/getPendingInvitations";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const token = extractToken(req.headers.authorization as string);
    const { userId: authenticatedUserId, supabase } = await requireUser(token);
    
    const { userId } = req.query;
    
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Verify the authenticated user matches the requested userId
    if (authenticatedUserId !== userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const invitations = await getPendingInvitations(supabase, userId);
    return res.status(200).json(invitations);
  } catch (err: any) {
    if (err instanceof HttpError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error("Error in pending-invitations:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}
