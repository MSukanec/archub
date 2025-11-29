import type { SupabaseClient } from '@supabase/supabase-js';
import { getFileUrl } from '@/lib/storage/getFileUrl';
import type { BucketName } from '@/lib/storage/types';

export interface CommunityHandlerContext {
  supabase: SupabaseClient;
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
    const { supabase } = ctx;

    const { data, error } = await supabase
      .from('organizations')
      .select('id, name, image_bucket, image_path, created_at')
      .eq('is_deleted', false)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    // Generate logo URLs from bucket+path
    const organizations = await Promise.all(
      (data || []).map(async (org: any) => {
        let logoUrl: string | null = null;
        if (org.image_bucket && org.image_path) {
          try {
            logoUrl = await getFileUrl(org.image_bucket as BucketName, org.image_path);
          } catch (error) {
            console.error('Error generating logo URL for org', org.id, error);
          }
        }
        return {
          id: org.id,
          name: org.name,
          logo_url: logoUrl,
          created_at: org.created_at
        } as CommunityOrganization;
      })
    );

    return {
      success: true,
      data: organizations
    };
  } catch (error: any) {
    console.error('Error in getOrganizations handler:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch community organizations'
    };
  }
}
