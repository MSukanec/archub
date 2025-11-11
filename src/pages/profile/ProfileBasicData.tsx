import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Upload, Link as LinkIcon, LogOut, Crown, MessageCircle, Camera, User, Settings, Building, Package, Hammer, Eye } from 'lucide-react'
import DatePickerField from '@/components/ui-custom/fields/DatePickerField'

import { useState, useEffect } from 'react'
import { useLocation } from 'wouter'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useDebouncedAutoSave } from '@/components/save'
import { useMutation } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { useToast } from '@/hooks/use-toast'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import { useCountries } from '@/hooks/use-countries'

interface ProfileBasicDataProps {
  user: any;
}

export function ProfileBasicData({ user }: ProfileBasicDataProps) {
  const { data: userData, isLoading } = useCurrentUser()
  const { toast } = useToast()
  const [, navigate] = useLocation()
  const { logout } = useAuthStore()
  
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
  const [birthdate, setBirthdate] = useState<Date | undefined>(undefined)
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
      
      if (!supabase) throw new Error('Supabase not initialized');
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session');
      
      // Use the server endpoint to update user data and avatar
      const profileUpdates: any = {
        user_id: userData?.user?.id,
      }
      
      // Handle user_data updates
      // Usar componentes de fecha en lugar de toISOString() para evitar problemas de timezone
      let birthdateString: string | null = null;
      if (data.birthdate) {
        const year = data.birthdate.getFullYear();
        const month = String(data.birthdate.getMonth() + 1).padStart(2, '0');
        const day = String(data.birthdate.getDate()).padStart(2, '0');
        birthdateString = `${year}-${month}-${day}`;
      }
      const currentBirthdateString = userData?.user_data?.birthdate || null
      
      if (data.firstName !== userData?.user_data?.first_name ||
          data.lastName !== userData?.user_data?.last_name ||
          data.country !== userData?.user_data?.country ||
          birthdateString !== currentBirthdateString) {
        
        profileUpdates.first_name = data.firstName
        profileUpdates.last_name = data.lastName
        profileUpdates.country = data.country || null
        profileUpdates.birthdate = birthdateString
      }
      
      // Handle avatar URL update if changed
      if (data.avatarUrl !== userData?.user?.avatar_url) {
        profileUpdates.avatar_url = data.avatarUrl
      }
      
      // Only make request if there are updates beyond user_id
      if (Object.keys(profileUpdates).length > 1) {
        const response = await fetch('/api/user/profile', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify(profileUpdates),
        })
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
        }
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
  const handleBirthdateChange = (value: Date | undefined) => setBirthdate(value)

  // Countries query - using optimized hook
  const { data: countries = [] } = useCountries()

  // Load profile data
  useEffect(() => {
    if (userData) {
      setFirstName(userData.user_data?.first_name || '')
      setLastName(userData.user_data?.last_name || '')
      setCountry(userData.user_data?.country || '')
      
      // Parsear fecha correctamente para evitar problemas de timezone
      if (userData.user_data?.birthdate) {
        const [year, month, day] = userData.user_data.birthdate.split('-').map(Number);
        setBirthdate(new Date(year, month - 1, day, 12, 0, 0, 0));
      } else {
        setBirthdate(undefined);
      }
      
      setAvatarUrl(userData.user?.avatar_url || '')
    }
  }, [userData])

  // Handle logout using authStore
  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
      toast({
        title: "Error",
        description: "No se pudo cerrar la sesión. Inténtalo de nuevo.",
        variant: "destructive",
      })
    }
  }

  const getInitials = () => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
    }
    return userData?.user?.full_name?.charAt(0)?.toUpperCase() || 'U'
  }

  if (isLoading) {
    return (
      <div className="text-center text-muted-foreground">
        Loading profile...
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Perfil Section */}
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Left Column - Title and Description */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-[var(--accent)]" />
              <h3 className="text-lg font-semibold">Perfil</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Esta información se mostrará públicamente, así que ten cuidado con lo que compartes.
            </p>
          </div>

          {/* Right Column - Form Fields */}
          <div className="space-y-6">
            {/* Avatar */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Avatar</Label>
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={avatarUrl} />
                  <AvatarFallback className="text-lg font-medium">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Button
                    size="sm"
                    onClick={() => setShowAvatarUpload(!showAvatarUpload)}
                  >
                    Cambiar
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Sube una foto o proporciona una URL
                  </p>
                </div>
              </div>
            </div>
            
            {/* Name */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Nombre completo</Label>
              <Input
                value={userData?.user?.full_name || ''}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Este es tu nombre para mostrar. Puede ser tu nombre real o un seudónimo.
              </p>
            </div>
            
            {/* Email */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Dirección de email</Label>
              <Input
                value={userData?.user?.email || ''}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Esta es la dirección de email de tu cuenta.
              </p>
            </div>
          </div>
        </div>
      </div>

      <hr className="border-t border-[var(--section-divider)] my-8" />

      {/* Información Personal Section */}
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Left Column - Title and Description */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-[var(--accent)]" />
              <h3 className="text-lg font-semibold">Información Personal</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Actualiza tus datos personales aquí.
            </p>
          </div>

          {/* Right Column - Form Fields */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Nombre</Label>
                <Input
                  value={firstName}
                  onChange={(e) => handleFirstNameChange(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Apellido</Label>
                <Input
                  value={lastName}
                  onChange={(e) => handleLastNameChange(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">País</Label>
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
              <div className="space-y-2">
                <Label className="text-sm font-medium">Fecha de nacimiento</Label>
                <DatePickerField
                  value={birthdate}
                  onChange={handleBirthdateChange}
                  placeholder="Seleccionar fecha"
                  disableFuture={true}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <hr className="border-t border-[var(--section-divider)] my-8" />

      {/* Modo de Usuario */}
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Left Column - Title and Description */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-[var(--accent)]" />
              <h3 className="text-lg font-semibold">Modo de uso</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Personaliza tu experiencia según tu tipo de actividad.
            </p>
          </div>

          {/* Right Column - Current Mode and Change Button */}
          <div className="space-y-6">
            <div className="space-y-4 p-4 border border-[var(--accent)] rounded-lg">
              {(() => {
                const modeInfo = getUserModeInfo(userData?.preferences?.last_user_type);
                const ModeIcon = modeInfo.icon;
                return (
                  <>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-[var(--accent)]">Modo de uso actual</Label>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-md bg-[var(--accent)]/10">
                          <ModeIcon className="h-5 w-5 text-[var(--accent)]" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{modeInfo.label}</p>
                          <p className="text-xs text-muted-foreground">{modeInfo.description}</p>
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
                      className="hover:opacity-90"
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

      <hr className="border-t border-[var(--section-divider)] my-8" />

      {/* Zona de Peligro */}
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Left Column - Title and Description */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-[var(--accent)]" />
              <h3 className="text-lg font-semibold">Zona de peligro</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Acciones irreversibles y destructivas.
            </p>
          </div>

          {/* Right Column - Form Fields */}
          <div className="space-y-6">
            <div className="space-y-4 p-4 border border-destructive rounded-lg">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-destructive">Cerrar sesión</Label>
                <p className="text-xs text-muted-foreground">
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
                      onClick={handleLogout}
                    >
                      Cerrar sesión
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}