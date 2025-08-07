import { Layout } from '@/components/layout/desktop/Layout'
import { ActionBarDesktop } from '@/components/layout/desktop/ActionBarDesktop'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Settings, UserCircle, Palette, Shield, HelpCircle, Monitor } from 'lucide-react'
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
  const [tutorialMode, setTutorialMode] = useState(true)

  // Settings data object for debounced auto-save
  const settingsData = {
    sidebarDocked,
    theme: isDark ? 'dark' : 'light',
    tutorial: tutorialMode
  }

  // Auto-save mutation for settings data
  const saveSettingsMutation = useMutation({
    mutationFn: async (data: typeof settingsData) => {
      console.log('Saving settings data:', data)
      
      // Handle user_preferences updates
      if (data.sidebarDocked !== userData?.preferences?.sidebar_docked ||
          data.theme !== userData?.preferences?.theme ||
          data.tutorial !== userData?.preferences?.tutorial) {
        
        const preferencesUpdates = {
          sidebar_docked: data.sidebarDocked,
          theme: data.theme,
          tutorial: data.tutorial,
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

  // Set up debounced auto-save with 1 second delay for faster saving
  const { isSaving } = useDebouncedAutoSave({
    data: settingsData,
    saveFn: async (data) => { await saveSettingsMutation.mutateAsync(data); },
    delay: 1000,
    enabled: !!userData
  })

  const handleSidebarDockedChange = (value: boolean) => {
    setSidebarDocked(value)
    setSecondarySidebarDocked(value)
  }

  // Load settings data
  useEffect(() => {
    if (userData?.preferences) {
      setSidebarDocked(userData.preferences.sidebar_docked || false)
      setTutorialMode(userData.preferences.tutorial !== false) // Default to true if not set
      // Set theme from user preferences
      setTheme(userData.preferences.theme === 'dark')
    }
  }, [userData?.preferences, setTheme])

  const headerProps = {
    title: "Configuración",
  }

  if (isLoading) {
    return (
      <Layout headerProps={headerProps}>
          Loading settings...
        </div>
      </Layout>
    )
  }

  return (
    <Layout headerProps={headerProps}>
      {/* ActionBar */}
      <ActionBarDesktop
        showProjectSelector={false}
        showSearch={false}
        showGrouping={false}
        features={[
          {
            title: "Tema Visual",
            description: "Personaliza la apariencia de tu aplicación cambiando entre tema claro y oscuro según tu preferencia."
          },
          {
            title: "Sidebar y Navegación",
            description: "Configura el comportamiento de la barra lateral para mantenerla fija o permitir que se oculte automáticamente."
          },
          {
            title: "Modo Tutorial",
            description: "Activa o desactiva las ayudas visuales y explicaciones para nuevos usuarios en toda la aplicación."
          },
          {
            title: "Configuración Avanzada",
            description: "Accede a opciones avanzadas de configuración y personalización de tu experiencia de usuario."
          }
        ]}
      />

        {/* Feature Introduction */}
        <FeatureIntroduction
          features={[
            {
              title: "Preferencias de Aplicación",
              description: "Configura el tema visual (claro/oscuro) y el comportamiento de la barra lateral según tus preferencias."
            }
          ]}
        />

        {/* Saving indicator */}
        {isSaving && (
            Guardando...
          </div>
        )}

        {/* Preferencias Section */}
        <div>
            {/* Left Column - Title and Description */}
              </div>
                Configura las preferencias de tu aplicación.
              </p>
            </div>

            {/* Right Column - Form Fields */}
              {/* Tema */}
                    Cambiar entre tema claro y oscuro
                  </div>
                </div>
                <Switch
                  checked={isDark}
                  onCheckedChange={(checked) => setTheme(checked)}
                />
              </div>
              
              {/* Sidebar fixed */}
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


        {/* Tutorial Section */}
        <div>
            {/* Left Column - Title and Description */}
              </div>
                Configura la experiencia de nuevo usuario.
              </p>
            </div>

            {/* Right Column - Form Fields */}
              {/* Modo nuevo usuario */}
                    Mostrar ayudas y explicaciones en toda la aplicación
                  </div>
                </div>
                <Switch
                  checked={tutorialMode}
                  onCheckedChange={setTutorialMode}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}