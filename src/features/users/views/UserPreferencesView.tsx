import { useState, useEffect, useRef, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings } from 'lucide-react';
import { useCurrentUser, type UserData } from '@/features/users/hooks';
import { useSidebarStore } from '@/stores/sidebarStore';
import { useThemeStore } from '@/stores/themeStore';
import { supabase } from '@/lib/supabase';
import { useSaveEngine } from '@/core/save-engine';
import { usersKeys } from '@/core/query-keys';
import { LoadingSpinner } from '@/components/shared/layout/LoadingSpinner';

interface PreferencesData {
  sidebarDocked: boolean;
  theme: 'light' | 'dark';
}

export function UserPreferencesView() {
  const { data: userData, isLoading } = useCurrentUser();
  const { isDocked: sidebarDockedFromStore, setDocked: setMainSidebarDocked } = useSidebarStore();
  const { isDark, setTheme } = useThemeStore();
  
  const [sidebarDocked, setSidebarDocked] = useState(false);
  const [themeValue, setThemeValue] = useState<'light' | 'dark'>('light');
  const [isHydrated, setIsHydrated] = useState(false);

  const hasHydratedRef = useRef(false);
  const lastHydratedIdRef = useRef<string | null>(null);

  const formData = useMemo<PreferencesData>(() => ({
    sidebarDocked,
    theme: themeValue,
  }), [sidebarDocked, themeValue]);

  useSaveEngine<PreferencesData>({
    data: formData,
    queryKey: usersKeys.current(),
    delay: 500,
    enabled: isHydrated && !!userData?.user?.id,
    saveFn: async (dataToSave) => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        throw new Error('No se pudo obtener el token de autenticación');
      }
      
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          user_id: userData?.user?.id,
          sidebar_docked: dataToSave.sidebarDocked,
          theme: dataToSave.theme,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
    },
    optimisticUpdate: (oldData: UserData | null, newData: PreferencesData) => {
      if (!oldData) return oldData;
      
      return {
        ...oldData,
        preferences: {
          ...oldData.preferences,
          sidebar_docked: newData.sidebarDocked,
          theme: newData.theme,
        },
      };
    },
  });

  useEffect(() => {
    setSidebarDocked(sidebarDockedFromStore);
  }, [sidebarDockedFromStore]);

  useEffect(() => {
    if (!userData?.preferences) return;
    
    const userId = userData.user?.id;
    if (hasHydratedRef.current && lastHydratedIdRef.current === userId) {
      return;
    }
    
    hasHydratedRef.current = true;
    lastHydratedIdRef.current = userId ?? null;
    
    const initialSidebarDocked = userData.preferences.sidebar_docked || false;
    const initialTheme = userData.preferences.theme === 'dark' ? 'dark' : 'light';
    
    setSidebarDocked(initialSidebarDocked);
    setThemeValue(initialTheme);
    setTheme(initialTheme === 'dark');
    
    setTimeout(() => {
      setIsHydrated(true);
    }, 100);
  }, [userData?.preferences, setTheme]);

  const handleSidebarDockedChange = (value: boolean) => {
    setSidebarDocked(value);
    setMainSidebarDocked(value);
  };

  const handleThemeChange = (value: boolean) => {
    const newTheme = value ? 'dark' : 'light';
    setThemeValue(newTheme);
    setTheme(value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!userData?.user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Usuario no encontrado</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-[var(--accent)]" />
              <h3 className="text-lg font-semibold">Preferencias</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Configura las preferencias de tu aplicación.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Modo oscuro</Label>
                <div className="text-xs text-muted-foreground">
                  Cambiar entre tema claro y oscuro
                </div>
              </div>
              <Switch
                checked={isDark}
                onCheckedChange={handleThemeChange}
                data-testid="switch-dark-mode"
              />
            </div>
            
            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Sidebar fijo</Label>
                <div className="text-xs text-muted-foreground">
                  Mantener el sidebar siempre visible
                </div>
              </div>
              <Switch
                checked={sidebarDocked}
                onCheckedChange={handleSidebarDockedChange}
                data-testid="switch-sidebar-docked"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
