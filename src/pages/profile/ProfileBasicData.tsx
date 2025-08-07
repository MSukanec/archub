import { Layout } from '@/components/layout/desktop/Layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Upload, Link as LinkIcon, LogOut, Crown, MessageCircle, Camera, User, Settings, Building, Package, Hammer, Eye, UserCircle, Shield } from 'lucide-react'
import { FeatureIntroduction } from '@/components/ui-custom/FeatureIntroduction'
import { ActionBarDesktop } from '@/components/layout/desktop/ActionBarDesktop'
import { useState, useEffect } from 'react'
import { useLocation } from 'wouter'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useDebouncedAutoSave } from '@/hooks/useDebouncedAutoSave'
import { supabase } from '@/lib/supabase'
import { useMutation, useQuery } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { useToast } from '@/hooks/use-toast'

interface Country {
  id: string;
  name: string;
  code: string;
}

export default function ProfileBasicData() {
  const { data: userData, isLoading } = useCurrentUser()
  const { toast } = useToast()
  const [, navigate] = useLocation()
  
  // Function to get user mode info
  const getUserModeInfo = (userType: string | null) => {
    switch (userType) {
      case 'professional':
        return { icon: Building, label: 'Profesional', description: 'Estudios y constructoras' };
      case 'provider':
        return { icon: Package, label: 'Proveedor de Materiales', description: 'Suministro de materiales' };
      case 'worker':
        return { icon: Hammer, label: 'Mano de Obra', description: 'Contratistas y maestros' };
      case 'visitor':
        return { icon: Eye, label: 'Solo Exploración', description: 'Modo exploración' };
      default:
        return { icon: Settings, label: 'No definido', description: 'Selecciona tu modo de uso' };
    }
  };
  
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [country, setCountry] = useState('')
  const [birthdate, setBirthdate] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [showAvatarUpload, setShowAvatarUpload] = useState(false)

  // Profile data object for debounced auto-save
  const profileData = {
    firstName,
    lastName,
    country,
    birthdate,
    avatarUrl
  }

  // Auto-save mutation for profile data
  const saveProfileMutation = useMutation({
    mutationFn: async (data: typeof profileData) => {
      console.log('Saving profile data:', data)
      
      const updates: any = {}
      
      // Handle user_data updates
      if (data.firstName !== userData?.user_data?.first_name ||
          data.lastName !== userData?.user_data?.last_name ||
          data.country !== userData?.user_data?.country ||
          data.birthdate !== userData?.user_data?.birthdate) {
        
        const userDataUpdates = {
          first_name: data.firstName,
          last_name: data.lastName,
          country: data.country || null,
          birthdate: data.birthdate || null,
        }
        
        const { error: userDataError } = await supabase!
          .from('user_data')
          .update(userDataUpdates)
          .eq('user_id', userData?.user?.id)
        
        if (userDataError) throw userDataError
      }
      
      // Handle avatar URL update if changed
      if (data.avatarUrl !== userData?.user?.avatar_url) {
        const { error: avatarError } = await supabase!.auth.updateUser({
          data: { avatar_url: data.avatarUrl }
        })
        
        if (avatarError) throw avatarError
      }
      
      return data
    },
    onSuccess: () => {
      console.log('Auto-save completed successfully')
      queryClient.invalidateQueries({ queryKey: ['current-user'] })
    },
    onError: (error) => {
      console.error('Auto-save error:', error)
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios automáticamente.",
        variant: "destructive",
      })
    },
  })

  // Set up debounced auto-save with 3 second delay
  const { isSaving } = useDebouncedAutoSave({
    data: profileData,
    saveFn: async (data) => { await saveProfileMutation.mutateAsync(data); },
    delay: 3000,
    enabled: !!userData
  })

  // Handle changes
  const handleFirstNameChange = (value: string) => setFirstName(value)
  const handleLastNameChange = (value: string) => setLastName(value)
  const handleCountryChange = (value: string) => setCountry(value)
  const handleBirthdateChange = (value: string) => setBirthdate(value)

  // Countries query
  const { data: countries = [] } = useQuery<Country[]>({
    queryKey: ['countries'],
    queryFn: async () => {
      const response = await fetch('/api/countries')
      if (!response.ok) {
        throw new Error('Failed to fetch countries')
      }
      return response.json()
    },
  })

  // Load profile data
  useEffect(() => {
    if (userData) {
      setFirstName(userData.user_data?.first_name || '')
      setLastName(userData.user_data?.last_name || '')
      setCountry(userData.user_data?.country || '')
      setBirthdate(userData.user_data?.birthdate || '')
      setAvatarUrl(userData.user?.avatar_url || '')
    }
  }, [userData])

  // Sign out mutation
  const signOutMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase!.auth.signOut()
      if (error) throw error
    },
    onSuccess: () => {
      window.location.href = '/'
    },
    onError: (error) => {
      console.error('Sign out error:', error)
      toast({
        title: "Error",
        description: "No se pudo cerrar la sesión. Inténtalo de nuevo.",
        variant: "destructive",
      })
    },
  })

  const getInitials = () => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
    }
    return userData?.user?.full_name?.charAt(0)?.toUpperCase() || 'U'
  }

  const headerProps = {
    title: "Mi Perfil",
  }

  if (isLoading) {
    return (
      <Layout headerProps={headerProps}>
          Loading profile...
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
            title: "Información Personal",
            description: "Administra tu información personal básica como nombre, apellido, país de origen y fecha de nacimiento."
          },
          {
            title: "Avatar y Personalización", 
            description: "Sube y personaliza tu foto de perfil para identificarte mejor en la plataforma."
          },
          {
            title: "Modo de Uso y Seguridad",
            description: "Define tu perfil profesional y gestiona la seguridad de tu cuenta con opciones de cierre de sesión."
          },
          {
            title: "Configuración de Cuenta",
            description: "Accede a preferencias avanzadas y gestiona la configuración de tu cuenta de usuario."
          }
        ]}
      />
      
        {/* Feature Introduction */}
        <FeatureIntroduction
          features={[
            {
              title: "Información Personal",
              description: "Administra tu información personal básica como nombre, apellido, país de origen y fecha de nacimiento."
            },
            {
              title: "Avatar y Personalización", 
              description: "Sube y personaliza tu foto de perfil para identificarte mejor en la plataforma."
            },
            {
              title: "Modo de Uso y Seguridad",
              description: "Define tu perfil profesional y gestiona la seguridad de tu cuenta con opciones de cierre de sesión."
            }
          ]}
        />

        {/* Saving indicator */}
        {isSaving && (
            Guardando...
          </div>
        )}

        {/* Perfil Section */}
        <div>
            {/* Left Column - Title and Description */}
              </div>
                Esta información se mostrará públicamente, así que ten cuidado con lo que compartes.
              </p>
            </div>

            {/* Right Column - Form Fields */}
              {/* Avatar */}
                    <AvatarImage src={avatarUrl} />
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAvatarUpload(!showAvatarUpload)}
                    >
                      Cambiar
                    </Button>
                      Sube una foto o proporciona una URL
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Name */}
                <Input
                  value={userData?.user?.full_name || ''}
                  disabled
                />
                  Este es tu nombre para mostrar. Puede ser tu nombre real o un seudónimo.
                </p>
              </div>
              
              {/* Email */}
                <Input
                  value={userData?.user?.email || ''}
                  disabled
                />
                  Esta es la dirección de email de tu cuenta.
                </p>
              </div>
            </div>
          </div>
        </div>


        {/* Información Personal Section */}
        <div>
            {/* Left Column - Title and Description */}
              </div>
                Actualiza tus datos personales aquí.
              </p>
            </div>

            {/* Right Column - Form Fields */}
                  <Input
                    value={firstName}
                    onChange={(e) => handleFirstNameChange(e.target.value)}
                  />
                </div>
                  <Input
                    value={lastName}
                    onChange={(e) => handleLastNameChange(e.target.value)}
                  />
                </div>
              </div>

                  <Select value={country} onValueChange={handleCountryChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un país" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Sin seleccionar</SelectItem>
                      {countries.map((country) => (
                        <SelectItem key={country.id} value={country.id}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                  <Input
                    type="date"
                    value={birthdate}
                    onChange={(e) => handleBirthdateChange(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* Modo de Usuario */}
        <div>
            {/* Left Column - Title and Description */}
              </div>
                Personaliza tu experiencia según tu tipo de actividad.
              </p>
            </div>

            {/* Right Column - Current Mode and Change Button */}
                {(() => {
                  const modeInfo = getUserModeInfo(userData?.preferences?.last_user_type);
                  const ModeIcon = modeInfo.icon;
                  return (
                    <>
                          </div>
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        onClick={() => navigate('/select-mode')}
                        size="sm"
                        style={{
                          backgroundColor: 'var(--accent)',
                          color: 'var(--accent-foreground)'
                        }}
                      >
                        Elegir modo de uso
                      </Button>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>


        {/* Zona de Peligro */}
        <div>
            {/* Left Column - Title and Description */}
              </div>
                Acciones irreversibles y destructivas.
              </p>
            </div>

            {/* Right Column - Form Fields */}
                    Cerrar sesión de tu cuenta. Serás redirigido a la página de inicio de sesión.
                  </p>
                </div>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      Cerrar sesión
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Estás a punto de cerrar tu sesión. Necesitarás iniciar sesión nuevamente para acceder a tu cuenta.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => signOutMutation.mutate()}
                        disabled={signOutMutation.isPending}
                      >
                        {signOutMutation.isPending ? 'Cerrando sesión...' : 'Cerrar sesión'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}