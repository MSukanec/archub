import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Settings, UserCircle, Palette, Shield, Monitor } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useDebouncedAutoSave } from '@/components/save'
import { useMutation } from '@tanstack/react-query'
import { queryClient, apiRequest } from '@/lib/queryClient'
import { useToast } from '@/hooks/use-toast'
import { useSidebarStore, useSecondarySidebarStore } from '@/stores/sidebarStore'
import { useThemeStore } from '@/stores/themeStore'
import { supabase } from '@/lib/supabase'

interface ProfilePreferencesProps {
  user: any;
}

export function ProfilePreferences({ user }: ProfilePreferencesProps) {
  const { data: userData, isLoading } = useCurrentUser()
  const { toast } = useToast()
  const { setDocked: setMainSidebarDocked } = useSidebarStore()
  const { isDark, setTheme } = useThemeStore()
  
  const [sidebarDocked, setSidebarDocked] = useState(false)

  // Settings data object for debounced auto-save
  const settingsData = {
    sidebarDocked,
    theme: isDark ? 'dark' : 'light'
  }

  // Auto-save mutation for settings data
  const saveSettingsMutation = useMutation({
    mutationFn: async (data: typeof settingsData) => {
      console.log('Saving settings data:', data)
      
      // Use the server endpoint to update preferences
      if (data.sidebarDocked !== userData?.preferences?.sidebar_docked ||
          data.theme !== userData?.preferences?.theme) {
        
        // Get the auth token from Supabase session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError || !session?.access_token) {
          throw new Error('No se pudo obtener el token de autenticación')
        }
        
        const response = await fetch('/api/user/profile', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            user_id: userData?.user?.id,
            sidebar_docked: data.sidebarDocked,
            theme: data.theme,
          }),
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
        }
      }
      
      return data
    },
    onSuccess: () => {
      console.log('Settings auto-save completed successfully')
      queryClient.invalidateQueries({ queryKey: ['current-user'] })
    },
    onError: (error) => {
      console.error('Settings auto-save error:', error)
      toast({
        title: "Error",
        description: "No se pudieron guardar las preferencias automáticamente.",
        variant: "destructive",
      })
    },
  })

  // Set up debounced auto-save with 1 second delay for faster saving
  const { isSaving } = useDebouncedAutoSave({
    data: settingsData,
    saveFn: async (data) => { await saveSettingsMutation.mutateAsync(data); },
    delay: 1000,
    enabled: !!userData
  })

  const handleSidebarDockedChange = (value: boolean) => {
    setSidebarDocked(value)
    setMainSidebarDocked(value)
  }

  // Load settings data
  useEffect(() => {
    if (userData?.preferences) {
      setSidebarDocked(userData.preferences.sidebar_docked || false)
      // Set theme from user preferences
      setTheme(userData.preferences.theme === 'dark')
    }
  }, [userData?.preferences, setTheme])

  if (isLoading) {
    return (
      <div className="text-center text-muted-foreground">
        Loading settings...
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Preferencias Section */}
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Left Column - Title and Description */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-[var(--accent)]" />
              <h3 className="text-lg font-semibold">Preferencias</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Configura las preferencias de tu aplicación.
            </p>
          </div>

          {/* Right Column - Form Fields */}
          <div className="space-y-6">
            {/* Tema */}
            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Modo oscuro</Label>
                <div className="text-xs text-muted-foreground">
                  Cambiar entre tema claro y oscuro
                </div>
              </div>
              <Switch
                checked={isDark}
                onCheckedChange={(checked) => setTheme(checked)}
              />
            </div>
            
            {/* Sidebar fixed */}
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
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}