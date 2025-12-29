import type { Request, Response } from 'express';
import { extractToken, requireUser, HttpError } from '../../lib/auth/helpers.js';

export async function handleCreateOrganization(req: Request, res: Response) {
  try {
    const token = extractToken(req.headers.authorization);
    const { userId, supabase } = await requireUser(token);

    const { name } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'El nombre de organización es requerido' });
    }

    // Call Supabase RPC to create organization
    const { data: organizationId, error } = await supabase.rpc('handle_new_organization', {
      _organization_name: name.trim(),
      _user_id: userId,
    });

    if (error) {
      console.error('Error creating organization:', error);
      return res.status(400).json({ error: error.message || 'Error al crear la organización' });
    }

    if (!organizationId) {
      return res.status(400).json({ error: 'No se pudo crear la organización' });
    }

    return res.status(201).json({ id: organizationId, name });
  } catch (error: any) {
    console.error('Error in handleCreateOrganization:', error);

    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    return res.status(500).json({ error: error.message || 'Error al crear la organización' });
  }
}
