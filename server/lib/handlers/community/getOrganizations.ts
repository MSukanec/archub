// api/lib/handlers/community/getOrganizations.ts
import type { NeonQueryFunction } from '@neondatabase/serverless';

export interface CommunityHandlerContext {
  sql: NeonQueryFunction<false, false>;
}

export interface CommunityOrganization {
  id: string;
  name: string;
  logo_url: string | null;
  created_at: string;
}

export type GetOrganizationsResult =
  | { success: true; data: CommunityOrganization[] }
  | { success: false; error: string };

export async function getOrganizations(
  ctx: CommunityHandlerContext
): Promise<GetOrganizationsResult> {
  try {
    const { sql } = ctx;

    const organizations = await sql`
      SELECT 
        id,
        name,
        logo_url,
        created_at
      FROM organizations
      WHERE is_active = true
      ORDER BY created_at DESC
      LIMIT 20
    `;

    return {
      success: true,
      data: organizations as CommunityOrganization[]
    };
  } catch (error: any) {
    console.error('Error in getOrganizations handler:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch community organizations'
    };
  }
}
