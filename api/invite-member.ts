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

    const { data: member } = await supabase
      .from("organization_members")
      .select("role")
      .eq("user_id", dbUser.id)
      .eq("organization_id", organizationId)
      .single();

    if (!member || member.role !== "admin") {
      return res.status(403).json({ 
        error: "Only organization admins can invite members" 
      });
    }

    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id, auth_id")
      .eq("email", email.toLowerCase())
      .single();

    let userId: string;
    let authId: string;

    if (existingUser) {
      userId = existingUser.id;
      authId = existingUser.auth_id;
    } else {
      const { data: invitation, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        email,
        {
          redirectTo: `${env.SUPABASE_URL}/auth/v1/verify`,
        }
      );

      if (inviteError) {
        console.error("Invite error:", inviteError);
        return res.status(500).json({ error: inviteError.message });
      }

      if (!invitation?.user?.id) {
        return res.status(500).json({ error: "Failed to create invitation" });
      }

      authId = invitation.user.id;

      const { data: newUser, error: userError } = await supabaseAdmin
        .from("users")
        .insert({
          auth_id: authId,
          email: email.toLowerCase(),
          full_name: email.split("@")[0],
        })
        .select("id")
        .single();

      if (userError || !newUser) {
        console.error("User creation error:", userError);
        return res.status(500).json({ error: "Failed to create user record" });
      }

      userId = newUser.id;
    }

    const { data: existingMembership } = await supabaseAdmin
      .from("organization_members")
      .select("id")
      .eq("user_id", userId)
      .eq("organization_id", organizationId)
      .single();

    if (existingMembership) {
      return res.status(400).json({ 
        error: "User is already a member of this organization" 
      });
    }

    const { data: memberData, error: memberError } = await supabaseAdmin
      .from("organization_members")
      .insert({
        organization_id: organizationId,
        user_id: userId,
        role_id: roleId,
        role: "member",
        joined_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (memberError) {
      console.error("Member creation error:", memberError);
      return res.status(500).json({ error: memberError.message });
    }

    return res.status(200).json({ 
      success: true, 
      member: memberData,
      isNewUser: !existingUser 
    });
  } catch (err: any) {
    console.error("Invite member error:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}
