// api/_lib/handlers/organization/getOrganizationMembers.ts
import { SupabaseClient } from "@supabase/supabase-js";
import { HttpError } from "../../auth-helpers.js";

export interface OrganizationMember {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string;
  email: string;
}

export async function getOrganizationMembers(
  supabase: SupabaseClient,
  organizationId: string,
  userId: string
): Promise<OrganizationMember[]> {
  if (!organizationId) {
    throw new HttpError(400, "Organization ID is required");
  }

  // AUTHORIZATION: Verify the user is a member of this organization
  const { data: membership, error: membershipError } = await supabase
    .from('organization_members')
    .select('id, is_active')
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .maybeSingle();

  if (membershipError) {
    console.error('Error checking membership:', membershipError);
    throw new HttpError(500, 'Failed to verify organization membership');
  }

  if (!membership) {
    throw new HttpError(403, 'User is not a member of this organization');
  }

  // Query organization members with user information
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
    throw new HttpError(500, 'Failed to fetch organization members');
  }

  // Transform to flat structure
  const transformedMembers = (members || []).map((m: any) => ({
    id: m.id,
    user_id: m.users?.id || m.user_id,
    full_name: m.users?.full_name || 'Usuario',
    email: m.users?.email || '',
    avatar_url: m.users?.avatar_url || null,
  }));

  return transformedMembers;
}
