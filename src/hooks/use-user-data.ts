import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface UserData {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  country: string | null;
  birthdate: string | null;
  created_at: string;
  updated_at: string;
}

export function useUserData() {
  return useQuery({
    queryKey: ['/api/user-data'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return null;

      const response = await fetch('/api/user-data', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) return null;
      return response.json() as Promise<UserData | null>;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
