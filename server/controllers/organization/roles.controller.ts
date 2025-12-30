import type { Request, Response } from "express";
import { createAuthenticatedClient } from '../../routes/_base';

export async function handleGetOrganizationRoles(req: Request, res: Response) {
  try {
    const organizationId = req.query.organizationId as string || req.params.organizationId;
    
    if (!organizationId) {
      return res.status(400).json({ error: 'organizationId is required' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const token = authHeader.split(' ')[1];
    const supabase = createAuthenticatedClient(token);

    const { data: roles, error } = await supabase
      .from('roles')
      .select('id, name, type, description, is_system')
      .eq('type', 'organization')
      .or(`and(organization_id.eq.${organizationId}),and(is_system.eq.true,organization_id.is.null)`)
      .order('is_system', { ascending: false })
      .order('name');

    if (error) {
      console.error('Error fetching roles:', error);
      return res.status(500).json({ error: 'Failed to fetch roles' });
    }

    return res.json(roles || []);
  } catch (error: any) {
    console.error('Error in handleGetOrganizationRoles:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
