// api/pending-invitations/[userId].ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { extractToken, requireUser } from "../_lib/auth-helpers";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get environment variables
    const url = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      return res.status(500).json({ error: "Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY" });
    }

    // Extract and validate user token
    const token = extractToken(req.headers.authorization);
    const { userId: authenticatedUserId } = await requireUser(token);

    const { userId } = req.query;
    
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Verify authenticated user matches requested userId
    if (authenticatedUserId !== userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Create service_role client for database queries (bypasses RLS)
    const supabase = createClient(url, serviceKey, {
      auth: { persistSession: false }
    });

    // Query pending invitations
    const { data: invitations, error: invError } = await supabase
      .from('organization_invitations')
      .select(`
        id,
        organization_id,
        role_id,
        invited_by,
        created_at,
        status
      `)
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (invError) {
      console.error('Error fetching pending invitations:', invError);
      return res.status(500).json({ error: 'Failed to fetch pending invitations' });
    }

    if (!invitations || invitations.length === 0) {
      return res.json([]);
    }

    // Enrich each invitation
    const enrichedInvitations = await Promise.all(
      invitations.map(async (inv) => {
        // Get organization data
        const { data: org } = await supabase
          .from('organizations')
          .select('name, logo_url')
          .eq('id', inv.organization_id)
          .single();

        // Get role name
        const { data: role } = await supabase
          .from('roles')
          .select('name')
          .eq('id', inv.role_id)
          .single();

        // Get organization members (up to 10)
        const { data: members } = await supabase
          .from('organization_members')
          .select(`
            id,
            user_id,
            users (
              id,
              full_name,
              avatar_url
            )
          `)
          .eq('organization_id', inv.organization_id)
          .eq('is_active', true)
          .limit(10);

        const transformedMembers = (members || []).map((m: any) => ({
          id: m.users?.id || m.id,
          full_name: m.users?.full_name || 'Usuario',
          avatar_url: m.users?.avatar_url,
        }));

        return {
          id: inv.id,
          organization_id: inv.organization_id,
          organization_name: org?.name || 'Organización',
          organization_avatar: (org?.logo_url && org.logo_url.trim() !== '') ? org.logo_url : null,
          role_id: inv.role_id,
          role_name: role?.name || 'Miembro',
          invited_by: inv.invited_by,
          created_at: inv.created_at,
          members: transformedMembers,
        };
      })
    );

    return res.json(enrichedInvitations);
  } catch (err: any) {
    console.error("Error in pending-invitations:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}
