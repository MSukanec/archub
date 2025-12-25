import { useState, useEffect, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings } from 'lucide-react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useToast } from '@/hooks/use-toast';
import { useSidebarStore } from '@/stores/sidebarStore';
import { useThemeStore } from '@/stores/themeStore';
import { supabase } from '@/lib/supabase';
import { useAutosaveController } from '@/core/autosave';
import { usersKeys } from '@/core/query-keys';
import { LoadingSpinner } from '@/components/shared/layout/LoadingSpinner';

export function UserPreferencesView() {
  const { data: userData, isLoading } = useCurrentUser();
  const { toast } = useToast();
  const { isDocked: sidebarDockedFromStore, setDocked: setMainSidebarDocked } = useSidebarStore();
  const { isDark, setTheme } = useThemeStore();
  
  const [sidebarDocked, setSidebarDocked] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  const hasHydratedRef = useRef(false);
  const lastHydratedIdRef = useRef<string | null>(null);

  const saveController = useAutosaveController({
    queryKey: usersKeys.current(),
    saveFn: async (dataToSave: any) => {
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
    additionalQueryKeys: [],
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
    
    setSidebarDocked(userData.preferences.sidebar_docked || false);
    setTheme(userData.preferences.theme === 'dark');
    
    setTimeout(() => {
      setIsHydrated(true);
      saveController.setLastPersistedData({
        sidebarDocked: userData.preferences?.sidebar_docked || false,
        theme: userData.preferences?.theme || 'light',
      });
    }, 100);
  }, [userData?.preferences, setTheme]);

  const handleSidebarDockedChange = (value: boolean) => {
    setSidebarDocked(value);
    setMainSidebarDocked(value);
    
    if (isHydrated && userData?.user?.id) {
      setTimeout(() => {
        saveController.save({
          sidebarDocked: value,
          theme: isDark ? 'dark' : 'light',
        });
      }, 10);
    }
  };

  const handleThemeChange = (value: boolean) => {
    setTheme(value);
    
    if (isHydrated && userData?.user?.id) {
      setTimeout(() => {
        saveController.save({
          sidebarDocked,
          theme: value ? 'dark' : 'light',
        });
      }, 10);
    }
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
