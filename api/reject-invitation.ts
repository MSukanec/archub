// api/reject-invitation.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { extractToken, requireUser, HttpError } from "./_lib/auth-helpers";
import { rejectInvitation } from "./_lib/handlers/organization/rejectInvitation";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const token = extractToken(req.headers.authorization as string);
    const { userId, supabase } = await requireUser(token);

    const { invitationId } = req.body;

    if (!invitationId) {
      return res.status(400).json({ error: "invitationId is required" });
    }

    const result = await rejectInvitation(supabase, userId, invitationId);
    return res.status(200).json(result);
  } catch (err: any) {
    if (err instanceof HttpError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error("Error in reject-invitation:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}
