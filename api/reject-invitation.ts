// api/reject-invitation.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get environment variables
    const url = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      return res.status(500).json({ error: "Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY" });
    }

    // Extract token
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

    if (!token) {
      return res.status(401).json({ error: "No authorization token provided" });
    }

    // Create authenticated Supabase client
    const supabase = createClient(url, serviceKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get database user
    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (dbError || !dbUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const { invitationId } = req.body;

    if (!invitationId) {
      return res.status(400).json({ error: "invitationId is required" });
    }

    // Verify the invitation belongs to the current user and is pending
    const { data: invitation, error: invError } = await supabase
      .from('organization_invitations')
      .select('id, user_id, status')
      .eq('id', invitationId)
      .eq('user_id', dbUser.id)
      .eq('status', 'pending')
      .maybeSingle();

    if (invError || !invitation) {
      return res.status(404).json({ error: "Invitation not found or already processed" });
    }

    // Update invitation status to rejected
    const { error: updateError } = await supabase
      .from('organization_invitations')
      .update({ 
        status: 'rejected',
        updated_at: new Date().toISOString()
      })
      .eq('id', invitationId);

    if (updateError) {
      console.error('Error updating invitation status:', updateError);
      return res.status(500).json({ error: 'Failed to reject invitation' });
    }

    return res.json({ success: true });
  } catch (err: any) {
    console.error("Error in reject-invitation:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}
