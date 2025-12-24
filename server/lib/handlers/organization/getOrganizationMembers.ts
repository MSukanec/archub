// api/lib/handlers/organization/getOrganizationMembers.ts
import { SupabaseClient } from "@supabase/supabase-js";
import { HttpError } from "../../auth/helpers.js";

export interface OrganizationMemberUser {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
}

export interface OrganizationMemberRole {
  id: string;
  name: string;
  type: string;
}

export interface OrganizationMember {
  id: string;
  user_id: string;
  organization_id: string;
  role_id: string | null;
  joined_at: string | null;
  last_active_at: string | null;
  is_active: boolean;
  is_over_limit: boolean;
  users: OrganizationMemberUser | null;
  roles: OrganizationMemberRole | null;
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

  // Query organization members with user and role information (nested structure)
  const { data: members, error } = await supabase
    .from('organization_members')
    .select(`
      id,
      user_id,
      organization_id,
      role_id,
      joined_at,
      last_active_at,
      is_active,
      is_over_limit,
      users (
        id,
        full_name,
        email,
        avatar_url
      ),
      roles (
        id,
        name,
        type
      )
    `)
    .eq('organization_id', organizationId)
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching organization members:', error);
    throw new HttpError(500, 'Failed to fetch organization members');
  }

  // Transform arrays to objects (Supabase returns arrays for relations)
  const transformedMembers = (members || []).map((m: any) => ({
    id: m.id,
    user_id: m.user_id,
    organization_id: m.organization_id,
    role_id: m.role_id,
    joined_at: m.joined_at,
    last_active_at: m.last_active_at,
    is_active: m.is_active,
    is_over_limit: m.is_over_limit,
    users: Array.isArray(m.users) ? m.users[0] : m.users,
    roles: Array.isArray(m.roles) ? m.roles[0] : m.roles,
  }));

  return transformedMembers as OrganizationMember[];
}
