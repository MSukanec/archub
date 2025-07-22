import { Layout } from '@/components/layout/desktop/Layout'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Settings, UserCircle } from 'lucide-react'
import { FeatureIntroduction } from '@/components/ui-custom/FeatureIntroduction'
import { useState, useEffect } from 'react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useDebouncedAutoSave } from '@/hooks/useDebouncedAutoSave'
import { supabase } from '@/lib/supabase'
import { useMutation } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { useToast } from '@/hooks/use-toast'
import { useSidebarStore, useSecondarySidebarStore } from '@/stores/sidebarStore'
import { useThemeStore } from '@/stores/themeStore'

export default function ProfileSettings() {
  const { data: userData, isLoading } = useCurrentUser()
  const { toast } = useToast()
  const { setDocked: setSecondarySidebarDocked } = useSecondarySidebarStore()
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
      
      // Handle user_preferences updates
      if (data.sidebarDocked !== userData?.preferences?.sidebar_docked ||
          data.theme !== userData?.preferences?.theme) {
        
        const preferencesUpdates = {
          sidebar_docked: data.sidebarDocked,
          theme: data.theme,
        }
        
        const { error: preferencesError } = await supabase!
          .from('user_preferences')
          .update(preferencesUpdates)
          .eq('user_id', userData?.user?.id)
        
        if (preferencesError) throw preferencesError
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

  // Set up debounced auto-save with 3 second delay
  const { isSaving } = useDebouncedAutoSave({
    data: settingsData,
    saveFn: async (data) => { await saveSettingsMutation.mutateAsync(data); },
    delay: 3000,
    enabled: !!userData
  })

  const handleSidebarDockedChange = (value: boolean) => {
    setSidebarDocked(value)
    setSecondarySidebarDocked(value)
  }

  const handleThemeChange = (value: boolean) => {
    // Update theme immediately in UI
    setTheme(value)
    // The auto-save system will handle the database update automatically
  }

  // Load settings data
  useEffect(() => {
    if (userData) {
      setSidebarDocked(userData.preferences?.sidebar_docked || false)
    }
  }, [userData])

  const headerProps = {
    title: "Configuración",
  }

  if (isLoading) {
    return (
      <Layout headerProps={headerProps}>
        <div className="text-center text-muted-foreground">
          Loading settings...
        </div>
      </Layout>
    )
  }

  return (
    <Layout headerProps={headerProps}>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Feature Introduction */}
        <FeatureIntroduction
          title="Configuración de Preferencias"
          icon={<UserCircle className="h-6 w-6" />}
          features={[
            {
              icon: <Settings className="h-4 w-4" />,
              title: "Preferencias de Aplicación",
              description: "Configura el tema visual (claro/oscuro) y el comportamiento de la barra lateral según tus preferencias."
            }
          ]}
        />

        {/* Saving indicator */}
        {isSaving && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
            <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
            Guardando...
          </div>
        )}

        <hr className="border-t border-[var(--section-divider)] my-8" />

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
                  onCheckedChange={handleThemeChange}
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
                  checked={userData?.preferences?.sidebar_docked || false}
                  onCheckedChange={handleSidebarDockedChange}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}