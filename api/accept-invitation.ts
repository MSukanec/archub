// api/accept-invitation.ts
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

    // Get the invitation
    const { data: invitation, error: invError } = await supabase
      .from('organization_invitations')
      .select('id, organization_id, role_id, user_id, status')
      .eq('id', invitationId)
      .eq('user_id', dbUser.id)
      .maybeSingle();

    if (invError || !invitation) {
      return res.status(404).json({ error: "Invitation not found" });
    }

    // If already accepted, check if member exists (idempotency)
    if (invitation.status === 'accepted') {
      const { data: existingMember } = await supabase
        .from('organization_members')
        .select('id')
        .eq('user_id', dbUser.id)
        .eq('organization_id', invitation.organization_id)
        .eq('is_active', true)
        .maybeSingle();

      if (existingMember) {
        return res.json({ success: true });
      }
    } else if (invitation.status !== 'pending') {
      return res.status(400).json({ error: "Invitation already processed" });
    }

    // Check for existing membership
    const { data: existingMember } = await supabase
      .from('organization_members')
      .select('id')
      .eq('user_id', dbUser.id)
      .eq('organization_id', invitation.organization_id)
      .maybeSingle();

    if (existingMember) {
      // Just mark as accepted
      await supabase
        .from('organization_invitations')
        .update({ 
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', invitationId);

      return res.json({ success: true });
    }

    // Update status FIRST (prevents duplicate accepts)
    const { error: updateError } = await supabase
      .from('organization_invitations')
      .update({ 
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('id', invitationId)
      .eq('status', 'pending');

    if (updateError) {
      console.error('Error updating invitation status:', updateError);
      return res.status(500).json({ error: 'Failed to update invitation status' });
    }

    // Create member AFTER status update
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: invitation.organization_id,
        user_id: dbUser.id,
        role_id: invitation.role_id,
        is_active: true,
      });

    if (memberError) {
      console.error('Error creating organization member:', memberError);
      return res.status(500).json({ error: 'Failed to create organization member. Please contact support.' });
    }

    return res.json({ success: true });
  } catch (err: any) {
    console.error("Error in accept-invitation:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}
