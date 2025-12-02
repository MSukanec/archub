// server/lib/handlers/organization/inviteMember.ts
import { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "../../supabase/admin.js";
import { sendInvitationEmail } from "../../email/sendInvitationEmail.js";

export interface InviteMemberParams {
  email: string;
  roleId: string;
  organizationId: string;
  userId: string;
}

export interface InviteMemberResult {
  success: boolean;
  data?: {
    invitation: any;
    message: string;
    isNewUser?: boolean;
  };
  error?: string;
}

export async function inviteMember(
  ctx: { supabase: SupabaseClient },
  params: InviteMemberParams
): Promise<InviteMemberResult> {
  try {
    const { email, roleId, organizationId, userId } = params;

    // Validate input
    if (!email || !roleId || !organizationId) {
      return {
        success: false,
        error: "Missing required fields: email, roleId, organizationId"
      };
    }

    // Check if user is admin member using authenticated client
    const { data: member, error: memberError } = await ctx.supabase
      .from("organization_members")
      .select("id, role_id, roles(name, type)")
      .eq("user_id", userId)
      .eq("organization_id", organizationId)
      .single();

    if (memberError || !member) {
      console.error("Member lookup error:", memberError);
      return {
        success: false,
        error: "User is not a member of this organization"
      };
    }

    // Check if user is admin by role name
    const roles = Array.isArray(member.roles) ? member.roles[0] : member.roles;
    const inviterRoleName = roles?.name?.toLowerCase() || '';
    const isAdmin = inviterRoleName.includes("admin");

    if (!isAdmin) {
      return {
        success: false,
        error: "Only organization admins can invite members"
      };
    }

    // Verificar límite de miembros del plan
    const { data: orgData } = await supabaseAdmin
      .from("organizations")
      .select("id, name, plan_id, plans!left(id, name, slug, features)")
      .eq("id", organizationId)
      .single();

    if (!orgData) {
      return {
        success: false,
        error: "Organization not found"
      };
    }

    const planData = (orgData as any).plans;
    const features = planData?.features || {};
    // If no plan or no max_members defined, default to 1 (FREE plan behavior)
    // -1 means unlimited (typically PRO and above)
    const maxMembers: number = features.max_members !== undefined ? features.max_members : 1;

    // -1 means unlimited, skip limit check
    if (maxMembers !== -1) {
      // Count current active members
      const { count: activeMembersCount } = await supabaseAdmin
        .from("organization_members")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .eq("is_active", true);

      // Count pending invitations (these will become members if accepted)
      const { count: pendingInvitationsCount } = await supabaseAdmin
        .from("organization_invitations")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .eq("status", "pending");

      const currentCount = (activeMembersCount || 0) + (pendingInvitationsCount || 0);

      if (currentCount >= maxMembers) {
        const planName = planData?.name || "actual";
        return {
          success: false,
          error: `Has alcanzado el límite de ${maxMembers} ${maxMembers === 1 ? 'miembro' : 'miembros'} para el plan ${planName}. Mejora tu plan para agregar más miembros.`
        };
      }
    }

    // Buscar usuario existente por email (using admin client)
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id, auth_id")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    // Si el usuario existe, verificar que no sea ya miembro ACTIVO
    if (existingUser) {
      const { data: existingMembership } = await supabaseAdmin
        .from("organization_members")
        .select("id, is_active")
        .eq("user_id", existingUser.id)
        .eq("organization_id", organizationId)
        .maybeSingle();

      if (existingMembership && existingMembership.is_active) {
        return {
          success: false,
          error: "User is already a member of this organization"
        };
      }
    }

    // Verificar si ya existe una invitación para este email en esta organización
    const { data: existingInvitation } = await supabaseAdmin
      .from("organization_invitations")
      .select("id, status")
      .eq("email", email.toLowerCase())
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (existingInvitation) {
      if (existingInvitation.status === "pending") {
        return {
          success: false,
          error: "There is already a pending invitation for this email"
        };
      }
      
      // Si la invitación está en otro estado (accepted, rejected, registered)
      // y el usuario ya no es miembro activo, podemos re-invitarlo
      // reseteando la invitación existente
      const { error: resetError } = await supabaseAdmin
        .from("organization_invitations")
        .update({
          status: "pending",
          role_id: roleId,
          accepted_at: null,
          updated_at: new Date().toISOString(),
          user_id: existingUser?.id || null, // CRITICAL: Update user_id for RLS to work on accept
        })
        .eq("id", existingInvitation.id);

      if (resetError) {
        console.error("Error resetting invitation:", resetError);
        return {
          success: false,
          error: "Failed to reset previous invitation"
        };
      }

      // Obtener datos para la notificación/email
      const inviterMemberData = await supabaseAdmin
        .from("organization_members")
        .select("id, users!left(first_name, last_name)")
        .eq("user_id", userId)
        .eq("organization_id", organizationId)
        .maybeSingle();

      const roleDataForReinvite = await supabaseAdmin
        .from("roles")
        .select("name")
        .eq("id", roleId)
        .maybeSingle();

      const inviterUserData = (inviterMemberData?.data as any)?.users;
      const inviterNameReinvite = inviterUserData?.first_name && inviterUserData?.last_name 
        ? `${inviterUserData.first_name} ${inviterUserData.last_name}`
        : inviterUserData?.first_name || 'Un administrador';
      const roleNameReinvite = roleDataForReinvite?.data?.name || 'Miembro';

      // Si el usuario existe, crear notificación in-app
      if (existingUser) {
        await supabaseAdmin
          .from("notifications")
          .insert({
            type: "organization_invitation",
            title: `Te invitaron nuevamente a ${orgData?.name || 'una organización'}`,
            body: `Has sido invitado a unirte a la organización "${orgData?.name || 'una organización'}". Aceptá la invitación para comenzar a colaborar.`,
            data: {
              invitation_id: existingInvitation.id,
              organization_id: organizationId,
              organization_name: orgData?.name,
              user_id: existingUser.id,
            },
            audience: "direct",
            created_by: userId,
          });
      } else {
        // Si el usuario NO existe, enviar email
        await sendInvitationEmail({
          inviteeEmail: email.toLowerCase(),
          organizationName: orgData?.name || 'una organización',
          inviterName: inviterNameReinvite,
          roleName: roleNameReinvite,
          invitationId: existingInvitation.id,
        });
      }

      return {
        success: true,
        data: {
          invitation: { id: existingInvitation.id },
          message: "Invitation resent successfully",
          isNewUser: !existingUser,
        }
      };
    }

    // Obtener el member_id del invitador para guardarlo, junto con su nombre
    const { data: inviterMember, error: inviterError } = await supabaseAdmin
      .from("organization_members")
      .select("id, users!left(first_name, last_name)")
      .eq("user_id", userId)
      .eq("organization_id", organizationId)
      .eq("is_active", true)
      .maybeSingle();

    console.log('[inviteMember] Inviter lookup:', { userId, organizationId, inviterMember, inviterError });

    // Obtener el nombre del rol para el email
    const { data: roleData } = await supabaseAdmin
      .from("roles")
      .select("name")
      .eq("id", roleId)
      .maybeSingle();

    const inviterUser = (inviterMember as any)?.users;
    const inviterName = inviterUser?.first_name && inviterUser?.last_name 
      ? `${inviterUser.first_name} ${inviterUser.last_name}`
      : inviterUser?.first_name || 'Un administrador';
    const roleName = roleData?.name || 'Miembro';

    // Crear la invitación
    const { data: invitationData, error: invitationError } = await supabaseAdmin
      .from("organization_invitations")
      .insert({
        organization_id: organizationId,
        email: email.toLowerCase(),
        role_id: roleId,
        user_id: existingUser?.id || null,
        invited_by: inviterMember?.id || null,
        status: "pending",
      })
      .select()
      .single();

    if (invitationError) {
      console.error("Invitation creation error:", invitationError);
      return {
        success: false,
        error: invitationError.message
      };
    }

    // Si el usuario existe en Seencel, crear notificación in-app
    if (existingUser) {
      const orgName = orgData?.name || 'una organización';
      const { error: notificationError } = await supabaseAdmin
        .from("notifications")
        .insert({
          type: "organization_invitation",
          title: `Te invitaron a ${orgName}`,
          body: `Has sido invitado a unirte a la organización "${orgName}". Aceptá la invitación para comenzar a colaborar.`,
          data: {
            invitation_id: invitationData.id,
            organization_id: organizationId,
            organization_name: orgName,
            user_id: existingUser.id,
          },
          audience: "direct",
          created_by: userId,
        });

      if (notificationError) {
        console.error("Notification creation error:", notificationError);
        // No retornamos error porque la invitación ya fue creada
      }
    }

    // Si el usuario NO existe en Seencel, enviar invitación por email usando Resend
    if (!existingUser) {
      const emailResult = await sendInvitationEmail({
        inviteeEmail: email.toLowerCase(),
        organizationName: orgData?.name || 'una organización',
        inviterName,
        roleName,
        invitationId: invitationData.id,
      });

      if (!emailResult.success) {
        console.warn("Invitation email failed:", emailResult.error);
        // No retornamos error porque la invitación ya fue creada en la DB
      }
    }

    return {
      success: true,
      data: {
        invitation: invitationData,
        message: existingUser 
          ? "Invitation created successfully. User will be notified." 
          : "Invitation created and email sent to register."
      }
    };
  } catch (err: any) {
    console.error("Invite member handler error:", err);
    return {
      success: false,
      error: err.message || "Internal server error"
    };
  }
}
