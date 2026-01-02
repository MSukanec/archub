import { SupabaseClient } from "@supabase/supabase-js";
import { HttpError } from "../../auth/helpers.js";
import { registerMemberEvent } from "../../billing/events.js";
import { suspendUserBonusCourseEnrollment } from "../checkout/shared/user-enrollments.js";
import { isPrivilegedRole, isOwnerRole } from "./roleHelpers.js";
import { logOrganizationActivity, ACTIVITY_ACTIONS, TARGET_TABLES } from "./logActivity.js";

export interface RemoveMemberParams {
  organizationId: string;
  memberId: string;
  performedByUserId: string;
}

export interface RemoveMemberResult {
  success: boolean;
  enrollmentSuspended?: boolean;
}

/**
 * Remove a member from an organization (soft delete).
 * This handler:
 * 1. Validates the performing user is an admin/owner of the organization
 * 2. Validates the member exists and is active
 * 3. Sets is_active = false (soft delete)
 * 4. Suspends bonus course enrollment if org is founder
 * 5. Registers billing event
 */
export async function removeMember(
  supabase: SupabaseClient,
  params: RemoveMemberParams
): Promise<RemoveMemberResult> {
  const { organizationId, memberId, performedByUserId } = params;

  // AUTHORIZATION: Verify the performing user is an admin or owner of the organization
  const { data: performingMember, error: authError } = await supabase
    .from('organization_members')
    .select(`
      id, 
      is_active,
      roles!inner (name)
    `)
    .eq('user_id', performedByUserId)
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .single();

  if (authError || !performingMember) {
    throw new HttpError(403, "No tienes permiso para eliminar miembros de esta organización");
  }

  const performingRoleName = (performingMember.roles as any)?.name || '';
  if (!isPrivilegedRole(performingRoleName)) {
    throw new HttpError(403, "Solo los propietarios y administradores pueden eliminar miembros");
  }

  const { data: member, error: memberError } = await supabase
    .from('organization_members')
    .select('id, user_id, is_active, is_billable, role_id')
    .eq('id', memberId)
    .eq('organization_id', organizationId)
    .single();

  if (memberError || !member) {
    throw new HttpError(404, "Miembro no encontrado");
  }

  if (!member.is_active) {
    return { success: true, enrollmentSuspended: false };
  }

  const { data: role } = await supabase
    .from('roles')
    .select('name')
    .eq('id', member.role_id)
    .single();

  const memberRoleName = role?.name || '';
  
  if (isOwnerRole(memberRoleName)) {
    throw new HttpError(400, "No se puede eliminar al propietario de la organización");
  }

  if (isPrivilegedRole(memberRoleName)) {
    const { data: activeAdmins, error: adminsError } = await supabase
      .from('organization_members')
      .select(`
        id,
        roles!inner (name)
      `)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .neq('id', memberId);

    if (adminsError) {
      console.error('[removeMember] Error checking active admins:', adminsError);
      throw new HttpError(500, 'Error verificando estado de administradores');
    }

    const remainingAdmins = activeAdmins?.filter((m: any) => {
      const mRoleName = (m.roles as any)?.name || '';
      return isPrivilegedRole(mRoleName);
    }) || [];

    if (remainingAdmins.length === 0) {
      throw new HttpError(400, "No se puede eliminar al último administrador. Promueve a otro miembro primero.");
    }
  }

  const { error: updateError } = await supabase
    .from('organization_members')
    .update({ 
      is_active: false,
      updated_at: new Date().toISOString()
    })
    .eq('id', memberId);

  if (updateError) {
    console.error('[removeMember] Error deactivating member:', updateError);
    throw new HttpError(500, 'Error al eliminar miembro');
  }

  const enrollmentResult = await suspendUserBonusCourseEnrollment(
    supabase,
    member.user_id,
    organizationId
  );

  await registerMemberEvent(supabase, {
    organizationId,
    memberId: member.id,
    userId: member.user_id,
    eventType: 'member_removed',
    wasBillable: member.is_billable,
    isBillable: false,
    performedBy: performedByUserId,
  });

  await logOrganizationActivity(supabase, {
    organization_id: organizationId,
    user_id: performedByUserId,
    action: ACTIVITY_ACTIONS.REMOVE_MEMBER,
    target_table: TARGET_TABLES.ORGANIZATION_MEMBERS,
    target_id: member.id,
    metadata: { removed_user_id: member.user_id }
  });

  console.log(`[removeMember] Member ${memberId} removed from org ${organizationId}, enrollment suspended: ${enrollmentResult.suspended}`);

  return { 
    success: true, 
    enrollmentSuspended: enrollmentResult.suspended 
  };
}
