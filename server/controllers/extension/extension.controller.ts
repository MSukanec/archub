import type { Request, Response } from 'express';
import { supabaseAdmin } from '../../lib/supabase/admin';
import { extractToken, createAuthenticatedClient } from '../../lib/auth/helpers';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function setCorsHeaders(res: Response) {
  res.set(CORS_HEADERS);
}

interface ExtensionContextResponse {
  user: {
    id: string;
    email: string;
  };
  organization: {
    id: string;
    name: string;
  };
  projects: Array<{
    id: string;
    name: string;
    default_board: {
      id: string;
      name: string;
    };
  }>;
}

const DEFAULT_BOARD_NAME = 'Inspiración';

export async function getExtensionContext(req: Request, res: Response) {
  setCorsHeaders(res);
  
  try {
    // 1. Validar autenticación JWT
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const authenticatedSupabase = createAuthenticatedClient(token);
    const { data: { user }, error: authError } = await authenticatedSupabase.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // 2. Resolver usuario interno (users.auth_id)
    const { data: dbUser, error: dbUserError } = await authenticatedSupabase
      .from('users')
      .select('id, email')
      .eq('auth_id', user.id)
      .single();

    if (dbUserError || !dbUser) {
      return res.status(404).json({ error: 'User not found in database' });
    }

    // 3. Obtener organización activa desde user_preferences
    const { data: userPrefs, error: prefsError } = await authenticatedSupabase
      .from('user_preferences')
      .select('last_organization_id')
      .eq('user_id', dbUser.id)
      .single();

    if (prefsError || !userPrefs?.last_organization_id) {
      return res.status(400).json({ error: 'No active organization found. Please select an organization in the app first.' });
    }
    const organizationId = userPrefs.last_organization_id;

    // 4. Verificar membership en la organización
    const { data: member, error: memberError } = await authenticatedSupabase
      .from('organization_members')
      .select('id')
      .eq('user_id', dbUser.id)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .maybeSingle();

    if (memberError || !member) {
      return res.status(403).json({ error: 'User is not a member of the active organization' });
    }
    const organizationMemberId = member.id;

    // 5. Obtener datos de la organización
    const { data: organization, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('id, name')
      .eq('id', organizationId)
      .single();

    if (orgError || !organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // 6. Obtener proyectos de la organización (solo activos/no eliminados)
    const { data: projects, error: projectsError } = await supabaseAdmin
      .from('projects')
      .select('id, name')
      .eq('organization_id', organizationId)
      .eq('is_deleted', false)
      .order('name', { ascending: true });

    if (projectsError) {
      console.error('[Extension] Error fetching projects:', projectsError);
      return res.status(500).json({ error: 'Failed to fetch projects' });
    }

    // 7. Para cada proyecto, obtener o crear el tablero por defecto
    const projectsWithBoards: ExtensionContextResponse['projects'] = [];

    for (const project of projects || []) {
      // Buscar tablero existente con nombre "Inspiración"
      let { data: board } = await supabaseAdmin
        .from('pin_boards')
        .select('id, name')
        .eq('project_id', project.id)
        .eq('name', DEFAULT_BOARD_NAME)
        .maybeSingle();

      // Si no existe, crearlo automáticamente
      if (!board) {
        const { data: newBoard, error: createBoardError } = await supabaseAdmin
          .from('pin_boards')
          .insert({
            organization_id: organizationId,
            project_id: project.id,
            name: DEFAULT_BOARD_NAME,
            description: 'Tablero de inspiración por defecto',
            created_by: organizationMemberId,
          })
          .select('id, name')
          .single();

        if (createBoardError) {
          console.error('[Extension] Error creating default board for project:', project.id, createBoardError);
          // Si falla crear el board, buscar cualquier board existente
          const { data: fallbackBoard } = await supabaseAdmin
            .from('pin_boards')
            .select('id, name')
            .eq('project_id', project.id)
            .limit(1)
            .maybeSingle();

          if (fallbackBoard) {
            board = fallbackBoard;
          } else {
            // Si no hay ningún board, omitir este proyecto
            continue;
          }
        } else {
          board = newBoard;
        }
      }

      projectsWithBoards.push({
        id: project.id,
        name: project.name,
        default_board: {
          id: board.id,
          name: board.name,
        },
      });
    }

    // 8. Construir respuesta
    const response: ExtensionContextResponse = {
      user: {
        id: dbUser.id,
        email: dbUser.email || user.email || '',
      },
      organization: {
        id: organization.id,
        name: organization.name,
      },
      projects: projectsWithBoards,
    };

    console.log('[Extension] Context fetched for user:', dbUser.id, '- Projects:', projectsWithBoards.length);
    return res.json(response);

  } catch (error: any) {
    console.error('[Extension] Unexpected error in getExtensionContext:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

// CORS preflight handler for extension
export function extensionContextPreflight(req: Request, res: Response) {
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  return res.status(204).send();
}
