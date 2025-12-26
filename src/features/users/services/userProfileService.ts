import { supabase } from '@/lib/supabase';
export interface UpdateProfileData {
  user_id: string;
  first_name?: string;
  last_name?: string;
  country?: string;
  birthdate?: string | null;
  avatar_url?: string;
}
export interface UpdatePreferencesData {
  user_id: string;
  theme?: 'light'| 'dark';
  sidebar_docked?: boolean;
  last_organization_id?: string;
  last_project_id?: string;
}
async function getAuthToken(): Promise<string> {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session?.access_token) {
    throw new Error('No se pudo obtener el token de autenticación');
  }
  return session.access_token;
}
export async function updateUserProfile(data: UpdateProfileData): Promise<void> {
  const token = await getAuthToken();
  
  const response = await fetch('/api/user/profile', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }
}
export async function updateUserPreferences(data: UpdatePreferencesData): Promise<void> {
  const token = await getAuthToken();
  
  const response = await fetch('/api/user/profile', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }
}
export async function switchOrganization(userId: string, organizationId: string): Promise<void> {
  const { error } = await supabase
    .from('user_preferences')
    .update({ last_organization_id: organizationId })
    .eq('user_id', userId);
  
  if (error) throw error;
}
