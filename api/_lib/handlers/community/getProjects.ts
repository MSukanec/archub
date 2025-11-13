// api/_lib/handlers/community/getProjects.ts
import type { NeonQueryFunction } from '@neondatabase/serverless';

export interface CommunityHandlerContext {
  sql: NeonQueryFunction<false, false>;
}

export interface CommunityProject {
  id: string;
  name: string;
  organizationId: string;
  organizationName: string;
  organizationLogo: string | null;
  color: string | null;
  lat: number | null;
  lng: number | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  imageUrl: string | null;
}

export type GetProjectsResult =
  | { success: true; data: CommunityProject[] }
  | { success: false; error: string };

export async function getProjects(
  ctx: CommunityHandlerContext
): Promise<GetProjectsResult> {
  try {
    const { sql } = ctx;

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

    return {
      success: true,
      data: projects as CommunityProject[]
    };
  } catch (error: any) {
    console.error('Error in getProjects handler:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch community projects'
    };
  }
}
