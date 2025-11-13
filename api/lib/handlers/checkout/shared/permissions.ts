import { SupabaseClient } from "@supabase/supabase-js";

export type AdminCheckResult = 
  | { success: true; isAdmin: true }
  | { success: false; error: string };

export async function verifyAdminRoleForOrganization(
  supabase: SupabaseClient,
  userId: string,
  organizationId: string
): Promise<AdminCheckResult> {
  const { data: membership, error: memberError } = await supabase
    .from("organization_members")
    .select("id, role_id, roles!inner(name)")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .eq("is_active", true)
    .single();

  if (memberError || !membership) {
    console.error('[permissions] User not member of organization:', memberError);
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
