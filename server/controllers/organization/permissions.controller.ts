import type { Request, Response } from "express";
import { extractToken, requireUser, HttpError } from '../../lib/auth/helpers';

export async function handleGetRolesWithPermissions(req: Request, res: Response) {
  try {
    const token = extractToken(req.headers.authorization);
    const { userId, supabase } = await requireUser(token);
    
    const organizationId = req.params.organizationId;
    
    if (!organizationId) {
      return res.status(400).json({ error: 'organizationId is required' });
    }

    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('id')
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .maybeSingle();

    if (membershipError) {
      console.error('[PermissionsController] Membership query error:', membershipError);
      return res.status(500).json({ error: 'Failed to verify membership' });
    }

    if (!membership) {
      return res.status(403).json({ error: 'You are not a member of this organization' });
    }

    const { data: roles, error: rolesError } = await supabase
      .from('roles')
      .select('id, name, description, type, is_system')
      .eq('type', 'organization')
      .or(`organization_id.eq.${organizationId},is_system.eq.true`)
      .order('is_system', { ascending: false })
      .order('name');

    if (rolesError) {
      console.error('Error fetching roles:', rolesError);
      return res.status(500).json({ error: 'Failed to fetch roles' });
    }

    const { data: permissions, error: permissionsError } = await supabase
      .from('permissions')
      .select('id, key, description, category, is_system')
      .order('category')
      .order('key');

    if (permissionsError) {
      console.error('Error fetching permissions:', permissionsError);
      return res.status(500).json({ error: 'Failed to fetch permissions' });
    }

    const roleIds = roles?.map(r => r.id) || [];
    
    const { data: rolePermissions, error: rpError } = await supabase
      .from('role_permissions')
      .select('role_id, permission_id')
      .in('role_id', roleIds);

    if (rpError) {
      console.error('Error fetching role_permissions:', rpError);
      return res.status(500).json({ error: 'Failed to fetch role permissions' });
    }

    const rolePermissionsMap: Record<string, string[]> = {};
    for (const rp of rolePermissions || []) {
      if (!rolePermissionsMap[rp.role_id]) {
        rolePermissionsMap[rp.role_id] = [];
      }
      rolePermissionsMap[rp.role_id].push(rp.permission_id);
    }

    const rolesWithPermissions = roles?.map(role => ({
      ...role,
      permissionIds: rolePermissionsMap[role.id] || [],
    })) || [];

    const permissionsByCategory: Record<string, typeof permissions> = {};
    for (const permission of permissions || []) {
      if (!permissionsByCategory[permission.category]) {
        permissionsByCategory[permission.category] = [];
      }
      permissionsByCategory[permission.category].push(permission);
    }

    return res.json({
      roles: rolesWithPermissions,
      permissions: permissions || [],
      permissionsByCategory,
    });
  } catch (error: any) {
    console.error('Error in handleGetRolesWithPermissions:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

export async function handleUpdateRolePermissions(req: Request, res: Response) {
  try {
    const token = extractToken(req.headers.authorization);
    const { userId, supabase } = await requireUser(token);
    
    const roleId = req.params.roleId;
    const { permissionIds, organizationId } = req.body;
    
    if (!roleId) {
      return res.status(400).json({ error: 'roleId is required' });
    }

    if (!Array.isArray(permissionIds)) {
      return res.status(400).json({ error: 'permissionIds must be an array' });
    }

    const { data: role, error: roleError } = await supabase
      .from('roles')
      .select('id, name, is_system, organization_id')
      .eq('id', roleId)
      .single();

    if (roleError || !role) {
      console.error('Error fetching role:', roleError);
      return res.status(404).json({ error: 'Role not found' });
    }

    if (role.name?.toLowerCase().includes('admin')) {
      return res.status(403).json({ error: 'Cannot modify permissions for Administrator role' });
    }

    const targetOrgId = role.organization_id || organizationId;
    if (!targetOrgId) {
      return res.status(400).json({ error: 'Cannot determine organization for this role' });
    }

    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select(`
        id,
        role_id,
        roles (
          id,
          name,
          role_permissions (
            permissions (
              key
            )
          )
        )
      `)
      .eq('user_id', userId)
      .eq('organization_id', targetOrgId)
      .eq('is_active', true)
      .single();

    if (membershipError || !membership) {
      return res.status(403).json({ error: 'You are not a member of this organization' });
    }

    const memberRole = membership.roles as any;
    const isAdmin = memberRole?.name?.toLowerCase().includes('admin');
    const hasRolesManage = memberRole?.role_permissions?.some(
      (rp: any) => rp.permissions?.key === 'roles.manage'
    );

    if (!isAdmin && !hasRolesManage) {
      return res.status(403).json({ error: 'You do not have permission to manage roles' });
    }

    const { error: deleteError } = await supabase
      .from('role_permissions')
      .delete()
      .eq('role_id', roleId);

    if (deleteError) {
      console.error('Error deleting role_permissions:', deleteError);
      return res.status(500).json({ error: 'Failed to update permissions' });
    }

    if (permissionIds.length > 0) {
      const uniquePermissionIds = Array.from(new Set(permissionIds as string[]));
      const insertData = uniquePermissionIds.map((permissionId: string) => ({
        role_id: roleId,
        permission_id: permissionId,
      }));

      const { error: insertError } = await supabase
        .from('role_permissions')
        .upsert(insertData, { onConflict: 'role_id,permission_id' });

      if (insertError) {
        console.error('Error inserting role_permissions:', insertError);
        return res.status(500).json({ error: 'Failed to update permissions' });
      }
    }

    return res.json({ 
      success: true, 
      message: 'Permissions updated successfully',
      role: role.name,
      permissionCount: permissionIds.length,
    });
  } catch (error: any) {
    console.error('Error in handleUpdateRolePermissions:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
