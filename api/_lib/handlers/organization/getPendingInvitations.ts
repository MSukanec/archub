// api/_lib/handlers/organization/getPendingInvitations.ts
import { SupabaseClient } from "@supabase/supabase-js";
import { HttpError } from "../../auth-helpers.js";

export interface PendingInvitation {
  id: string;
  organization_id: string;
  organization_name: string;
  organization_avatar: string | null;
  role_id: string;
  role_name: string;
  invited_by: string;
  created_at: string;
  members: Array<{
    id: string;
    full_name: string;
    avatar_url: string | null;
  }>;
}

export async function getPendingInvitations(
  supabase: SupabaseClient,
  userId: string
): Promise<PendingInvitation[]> {
  if (!userId) {
    throw new HttpError(400, "User ID is required");
  }

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
    throw new HttpError(500, 'Failed to fetch pending invitations');
  }

  if (!invitations || invitations.length === 0) {
    return [];
  }

  // Enrich each invitation with organization, role, and member data
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

      // Transform members
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

  return enrichedInvitations;
}
