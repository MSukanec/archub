import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { extractToken, requireUser } from '../_lib/auth-helpers';

const sql = neon(process.env.DATABASE_URL!);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = extractToken(req.headers.authorization);
    await requireUser(token);

    const projects = await sql`
      SELECT 
        p.id,
        p.name,
        p.organization_id as "organizationId",
        o.name as "organizationName",
        o.logo_url as "organizationLogo",
        p.color,
        COALESCE(
          (p.project_data->>'latitude')::float,
          (p.project_data->'location'->>'latitude')::float
        ) as lat,
        COALESCE(
          (p.project_data->>'longitude')::float,
          (p.project_data->'location'->>'longitude')::float
        ) as lng,
        COALESCE(
          p.project_data->>'address',
          p.project_data->'location'->>'address'
        ) as address,
        COALESCE(
          p.project_data->>'city',
          p.project_data->'location'->>'city'
        ) as city,
        COALESCE(
          p.project_data->>'state',
          p.project_data->'location'->>'state'
        ) as state,
        COALESCE(
          p.project_data->>'country',
          p.project_data->'location'->>'country'
        ) as country,
        p.project_data->>'project_image_url' as "imageUrl"
      FROM projects p
      INNER JOIN organizations o ON o.id = p.organization_id
      WHERE 
        p.is_active = true
        AND o.is_active = true
        AND (
          (p.project_data->>'latitude') IS NOT NULL
          OR (p.project_data->'location'->>'latitude') IS NOT NULL
        )
        AND (
          (p.project_data->>'longitude') IS NOT NULL
          OR (p.project_data->'location'->>'longitude') IS NOT NULL
        )
      ORDER BY p.created_at DESC
      LIMIT 500
    `;

    return res.status(200).json(projects);

  } catch (error: any) {
    console.error('Error fetching community projects:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error'
    });
  }
}
