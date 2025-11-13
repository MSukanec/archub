import { SupabaseClient } from "@supabase/supabase-js";

export type AdminCheckResult = 
  | { success: true; isAdmin: true }
  | { success: false; error: string };

export async function verifyAdminRoleForOrganization(
  supabase: SupabaseClient,
  authUserId: string,
  organizationId: string
): Promise<AdminCheckResult> {
  // CRITICAL: Convert auth_id to public.users.id first
  const { data: userProfile, error: profileError } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", authUserId)
    .single();

  if (profileError || !userProfile) {
    console.error('[permissions] User profile not found:', profileError);
    return { 
      success: false, 
      error: "Perfil de usuario no encontrado" 
    };
  }

  const userId = userProfile.id;

  const { data: membership, error: memberError } = await supabase
    .from("organization_members")
    .select("id, role_id, roles!inner(name)")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .eq("is_active", true)
    .single();

  if (memberError || !membership) {
    console.error('[permissions] User not member of organization:', { 
      authUserId, 
      userId, 
      organizationId, 
      error: memberError 
    });
    return { 
      success: false, 
      error: "No tienes permisos para modificar esta organización" 
    };
  }

  const roleName = (membership.roles as any)?.name?.toLowerCase();
  const validAdminRoles = ['admin', 'owner', 'administrador'];
  
  if (!validAdminRoles.includes(roleName)) {
    console.error('[permissions] User is not admin:', { roleName });
    return { 
      success: false, 
      error: "Solo los administradores pueden upgradear el plan de la organización" 
    };
  }

  return { success: true, isAdmin: true };
}
