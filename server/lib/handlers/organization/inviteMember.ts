// server/lib/handlers/organization/inviteMember.ts
import { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "../../supabase/admin.js";
import { env } from "../../env.js";

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
    const roleName = roles?.name?.toLowerCase() || '';
    const isAdmin = roleName.includes("admin");

    if (!isAdmin) {
      return {
        success: false,
        error: "Only organization admins can invite members"
      };
    }

    // Verificar límite de miembros del plan
    const { data: orgData } = await supabaseAdmin
      .from("organizations")
      .select("id, name, plan_id, plans(id, name, slug, features)")
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
    const maxMembers = features.max_members ?? 1; // Default to 1 if not set

    // -1 means unlimited
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

    // Si el usuario existe, verificar que no sea ya miembro
    if (existingUser) {
      const { data: existingMembership } = await supabaseAdmin
        .from("organization_members")
        .select("id")
        .eq("user_id", existingUser.id)
        .eq("organization_id", organizationId)
        .maybeSingle();

      if (existingMembership) {
        return {
          success: false,
          error: "User is already a member of this organization"
        };
      }
    }

    // Verificar si ya existe una invitación pendiente
    const { data: existingInvitation } = await supabaseAdmin
      .from("organization_invitations")
      .select("id, status")
      .eq("email", email.toLowerCase())
      .eq("organization_id", organizationId)
      .eq("status", "pending")
      .single();

    if (existingInvitation) {
      return {
        success: false,
        error: "There is already a pending invitation for this email"
      };
    }

    // Obtener el member_id del invitador para guardarlo
    const { data: inviterMember } = await supabaseAdmin
      .from("organization_members")
      .select("id")
      .eq("user_id", userId)
      .eq("organization_id", organizationId)
      .maybeSingle();

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
      const { data: orgData } = await supabaseAdmin
        .from("organizations")
        .select("name")
        .eq("id", organizationId)
        .single();

      const { error: notificationError } = await supabaseAdmin
        .from("notifications")
        .insert({
          type: "organization_invitation",
          title: `Te invitaron a ${orgData?.name || 'una organización'}`,
          body: `Has sido invitado a unirte a la organización "${orgData?.name || 'sin nombre'}". Aceptá la invitación para comenzar a colaborar.`,
          data: {
            invitation_id: invitationData.id,
            organization_id: organizationId,
            organization_name: orgData?.name,
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

    // Si el usuario NO existe en Seencel, enviar invitación por email de Supabase Auth
    if (!existingUser) {
      const { error: authInviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        email,
        {
          redirectTo: `${env.SUPABASE_URL}/auth/v1/verify`,
        }
      );

      if (authInviteError) {
        console.warn("Auth invitation email failed (user can still register manually):", authInviteError);
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
