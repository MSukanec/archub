import { SupabaseClient } from "@supabase/supabase-js";
import { HttpError } from "../../auth/helpers.js";
import { registerMemberEvent } from "../../billing/events.js";
import { suspendUserBonusCourseEnrollment } from "../checkout/shared/user-enrollments.js";
import { isPrivilegedRole, isOwnerRole } from "./roleHelpers.js";
import { logOrganizationActivity, ACTIVITY_ACTIONS, TARGET_TABLES } from "./logActivity.js";

export interface LeaveOrganizationParams {
  organizationId: string;
  userId: string;
}

export interface LeaveOrganizationResult {
  success: boolean;
  enrollmentSuspended?: boolean;
}

export async function leaveOrganization(
  supabase: SupabaseClient,
  params: LeaveOrganizationParams
): Promise<LeaveOrganizationResult> {
  const { organizationId, userId } = params;

  const { data: member, error: memberError } = await supabase
    .from('organization_members')
    .select(`
      id, 
      user_id,
      is_active, 
      is_billable, 
      role_id,
      roles!inner (name)
    `)
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .single();

  if (memberError || !member) {
    throw new HttpError(404, "No eres miembro activo de esta organización");
  }

  const roleName = (member.roles as any)?.name || '';
  
  if (isOwnerRole(roleName)) {
    throw new HttpError(400, "El propietario no puede abandonar la organización. Transfiere la propiedad primero.");
  }

  if (isPrivilegedRole(roleName)) {
    const { data: activeAdmins, error: adminsError } = await supabase
      .from('organization_members')
      .select(`
        id,
        roles!inner (name)
      `)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .neq('id', member.id);

    if (adminsError) {
      console.error('[leaveOrganization] Error checking active admins:', adminsError);
      throw new HttpError(500, 'Error verificando administradores');
    }

    const remainingAdmins = activeAdmins?.filter((m: any) => {
      const mRoleName = (m.roles as any)?.name || '';
      return isPrivilegedRole(mRoleName);
    }) || [];

    if (remainingAdmins.length === 0) {
      throw new HttpError(400, "No puedes abandonar la organización siendo el único administrador. Promueve a otro miembro primero.");
    }
  }

  const { error: updateError } = await supabase
    .from('organization_members')
    .update({ 
      is_active: false,
      updated_at: new Date().toISOString()
    })
    .eq('id', member.id);

  if (updateError) {
    console.error('[leaveOrganization] Error deactivating member:', updateError);
    throw new HttpError(500, 'Error al abandonar la organización');
  }

  const enrollmentResult = await suspendUserBonusCourseEnrollment(
    supabase,
    userId,
    organizationId
  );

  await registerMemberEvent(supabase, {
    organizationId,
    memberId: member.id,
    userId: userId,
    eventType: 'member_removed',
    wasBillable: member.is_billable,
    isBillable: false,
    performedBy: userId,
  });

  await logOrganizationActivity(supabase, {
    organization_id: organizationId,
    user_id: userId,
    action: ACTIVITY_ACTIONS.REMOVE_MEMBER,
    target_table: TARGET_TABLES.ORGANIZATION_MEMBERS,
    target_id: member.id,
    metadata: { left_voluntarily: true }
  });

  console.log(`[leaveOrganization] User ${userId} left org ${organizationId}, enrollment suspended: ${enrollmentResult.suspended}`);

  return { 
    success: true, 
    enrollmentSuspended: enrollmentResult.suspended 
  };
}
