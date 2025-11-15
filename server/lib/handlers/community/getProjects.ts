import type { SupabaseClient } from '@supabase/supabase-js';

export interface CommunityHandlerContext {
  supabase: SupabaseClient;
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
    const { supabase } = ctx;

    const { data, error } = await supabase
      .from('projects')
      .select(`
        id,
        name,
        organization_id,
        color,
        organizations!inner(id, name, logo_url),
        project_data!left(lat, lng, address, city, state, country, project_image_url)
      `)
      .eq('is_active', true)
      .eq('organizations.is_active', true)
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) throw error;

    const projects = (data || [])
      .map((p: any) => {
        const pd = Array.isArray(p.project_data) ? p.project_data[0] : p.project_data;
        
        const lat = pd?.lat ?? null;
        const lng = pd?.lng ?? null;

        if (lat === null || lng === null) {
          return null;
        }

        return {
          id: p.id,
          name: p.name,
          organizationId: p.organization_id,
          organizationName: p.organizations.name,
          organizationLogo: p.organizations.logo_url,
          color: p.color,
          lat: Number(lat),
          lng: Number(lng),
          address: pd?.address ?? null,
          city: pd?.city ?? null,
          state: pd?.state ?? null,
          country: pd?.country ?? null,
          imageUrl: pd?.project_image_url ?? null
        } as CommunityProject;
      })
      .filter((p): p is CommunityProject => p !== null);

    return {
      success: true,
      data: projects
    };
  } catch (error: any) {
    console.error('Error in getProjects handler:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch community projects'
    };
  }
}
