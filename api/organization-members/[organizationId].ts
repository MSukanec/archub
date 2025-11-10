// api/organization-members/[organizationId].ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

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

    // Get organization ID from query
    const { organizationId } = req.query;
    
    if (!organizationId || typeof organizationId !== 'string') {
      return res.status(400).json({ error: "Organization ID is required" });
    }

    // AUTHORIZATION: Verify user is a member of this organization
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('id, is_active')
      .eq('user_id', dbUser.id)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .maybeSingle();

    if (membershipError) {
      console.error('Error checking membership:', membershipError);
      return res.status(500).json({ error: 'Failed to verify organization membership' });
    }

    if (!membership) {
      return res.status(403).json({ error: 'User is not a member of this organization' });
    }

    // Query organization members
    const { data: members, error } = await supabase
      .from('organization_members')
      .select(`
        id,
        user_id,
        users!inner (
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching organization members:', error);
      return res.status(500).json({ error: 'Failed to fetch organization members' });
    }

    // Transform to flat structure
    const transformedMembers = (members || []).map((m: any) => ({
      id: m.id,
      user_id: m.users?.id || m.user_id,
      full_name: m.users?.full_name || 'Usuario',
      email: m.users?.email || '',
      avatar_url: m.users?.avatar_url || null,
    }));

    return res.status(200).json(transformedMembers);
  } catch (err: any) {
    console.error("Error in organization-members:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}
