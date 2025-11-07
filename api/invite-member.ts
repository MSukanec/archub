// api/invite-member.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "./_lib/supabase-admin";
import { createClient } from "@supabase/supabase-js";
import { env } from "./_lib/env";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

    if (!token) {
      return res.status(401).json({ error: "No authorization token provided" });
    }

    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !currentUser) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { data: dbUser } = await supabase
      .from("users")
      .select("id")
      .eq("auth_id", currentUser.id)
      .single();

    if (!dbUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const { email, roleId, organizationId } = req.body;

    if (!email || !roleId || !organizationId) {
      return res.status(400).json({ 
        error: "Missing required fields: email, roleId, organizationId" 
      });
    }

    const { data: member, error: memberError } = await supabase
      .from("organization_members")
      .select("id, role_id, roles(name, type)")
      .eq("user_id", dbUser.id)
      .eq("organization_id", organizationId)
      .single();

    if (memberError || !member) {
      console.error("Member lookup error:", memberError);
      return res.status(403).json({ 
        error: "User is not a member of this organization" 
      });
    }

    // Check if user is admin by role name
    const roles = Array.isArray(member.roles) ? member.roles[0] : member.roles;
    const roleName = roles?.name?.toLowerCase() || '';
    const isAdmin = roleName.includes("admin");

    console.log("Admin check:", { roleName, isAdmin, userId: dbUser.id });

    if (!isAdmin) {
      return res.status(403).json({ 
        error: "Only organization admins can invite members" 
      });
    }

    // Buscar usuario existente por email
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id, auth_id")
      .eq("email", email.toLowerCase())
      .single();

    // Si el usuario existe, verificar que no sea ya miembro
    if (existingUser) {
      const { data: existingMembership } = await supabaseAdmin
        .from("organization_members")
        .select("id")
        .eq("user_id", existingUser.id)
        .eq("organization_id", organizationId)
        .single();

      if (existingMembership) {
        return res.status(400).json({ 
          error: "User is already a member of this organization" 
        });
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
      return res.status(400).json({ 
        error: "There is already a pending invitation for this email" 
      });
    }

    // Obtener el member_id del invitador para guardarlo
    const { data: inviterMember } = await supabaseAdmin
      .from("organization_members")
      .select("id")
      .eq("user_id", dbUser.id)
      .eq("organization_id", organizationId)
      .single();

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
      return res.status(500).json({ error: invitationError.message });
    }

    // Si el usuario NO existe en Archub, enviar invitación por email de Supabase Auth
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

    return res.status(200).json({ 
      success: true, 
      invitation: invitationData,
      message: existingUser 
        ? "Invitation created successfully. User will be notified." 
        : "Invitation created and email sent to register."
    });
  } catch (err: any) {
    console.error("Invite member error:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}
