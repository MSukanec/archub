import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Upload, Link as LinkIcon, LogOut, Crown, MessageCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { supabase } from '@/lib/supabase'
import { useMutation, useQuery } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { useToast } from '@/hooks/use-toast'
import { useSidebarStore } from '@/stores/sidebarStore'

interface Country {
  id: string
  name: string
}

export default function Profile() {
  const { data: userData, isLoading } = useCurrentUser()
  const { toast } = useToast()
  const { setDocked } = useSidebarStore()

  // Form states
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [country, setCountry] = useState('')
  const [birthdate, setBirthdate] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [sidebarDocked, setSidebarDocked] = useState(false)

  // Avatar upload states
  const [showAvatarUpload, setShowAvatarUpload] = useState(false)
  const [avatarUrlInput, setAvatarUrlInput] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  // Load countries
  const { data: countries = [] } = useQuery({
    queryKey: ['countries'],
    queryFn: async () => {
      if (!supabase) return []
      const { data, error } = await supabase
        .from('countries')
        .select('id, name')
        .order('name')
      
      if (error) throw error
      return data || []
    }
  })

  // Load user data into form when available
  useEffect(() => {
    if (userData) {
      setFirstName(userData.user_data?.first_name || '')
      setLastName(userData.user_data?.last_name || '')
      setCountry(userData.user_data?.country || '')
      setBirthdate(userData.user_data?.birthdate || '')
      setAvatarUrl(userData.user?.avatar_url || '')
      setSidebarDocked(userData.preferences?.sidebar_docked || false)
    }
  }, [userData])

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: {
      firstName: string
      lastName: string
      country: string
      birthdate: string
      avatarUrl: string
      sidebarDocked: boolean
    }) => {
      if (!userData?.user?.id || !userData?.preferences?.id) {
        throw new Error('Missing user data')
      }

      // Update user avatar
      if (profileData.avatarUrl !== userData.user.avatar_url) {
        if (!supabase) throw new Error('Supabase no disponible')
        
        const { error: userError } = await supabase
          .from('users')
          .update({ avatar_url: profileData.avatarUrl })
          .eq('id', userData.user.id)
        
        if (userError) throw userError
      }

      // Update user_data
      if (profileData.firstName || profileData.lastName || profileData.country || profileData.birthdate) {
        if (!supabase) throw new Error('Supabase no disponible')
        
        const updateData: any = {}
        if (profileData.firstName.trim()) updateData.first_name = profileData.firstName.trim()
        if (profileData.lastName.trim()) updateData.last_name = profileData.lastName.trim()
        if (profileData.country) updateData.country = profileData.country
        if (profileData.birthdate) updateData.birthdate = profileData.birthdate

        const { error: dataError } = await supabase
          .from('user_data')
          .update(updateData)
          .eq('user_id', userData.user.id)
        
        if (dataError) throw dataError
      }

      // Update user_preferences
      if (!supabase) throw new Error('Supabase no disponible')
      
      const { error: prefsError } = await supabase
        .from('user_preferences')
        .update({ sidebar_docked: profileData.sidebarDocked })
        .eq('id', userData.preferences.id)
      
      if (prefsError) throw prefsError
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] })
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully"
      })
    },
    onError: (error) => {
      console.error('Error updating profile:', error)
      toast({
        title: "Error",
        description: "There was a problem updating your profile",
        variant: "destructive"
      })
    }
  })

  // Theme toggle mutation
  const toggleThemeMutation = useMutation({
    mutationFn: async () => {
      if (!userData?.preferences?.id) throw new Error('Missing preferences data')
      if (!supabase) throw new Error('Supabase no disponible')
      
      const newTheme = userData.preferences.theme === 'dark' ? 'light' : 'dark'
      
      const { error } = await supabase
        .from('user_preferences')
        .update({ theme: newTheme })
        .eq('id', userData.preferences.id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] })
      toast({
        title: "Theme updated",
        description: "Your theme has been changed successfully"
      })
    },
    onError: () => {
      toast({
        title: "Error", 
        description: "Could not change theme",
        variant: "destructive"
      })
    }
  })

  // Sign out mutation
  const signOutMutation = useMutation({
    mutationFn: async () => {
      if (!supabase) throw new Error('Supabase no disponible')
      
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    },
    onSuccess: () => {
      window.location.href = '/'
    },
    onError: (error) => {
      console.error('Error signing out:', error)
      toast({
        title: "Error",
        description: "There was a problem signing out",
        variant: "destructive"
      })
    }
  })

  const handleSaveProfile = () => {
    updateProfileMutation.mutate({
      firstName,
      lastName,
      country,
      birthdate,
      avatarUrl,
      sidebarDocked
    })
  }

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      // For now, just show the file name - full upload implementation would go here
      toast({
        title: "File selected",
        description: `Selected: ${file.name}. Upload functionality coming soon.`
      })
    }
  }

  const handleApplyAvatarUrl = () => {
    if (avatarUrlInput.trim()) {
      setAvatarUrl(avatarUrlInput.trim())
      setAvatarUrlInput('')
      setShowAvatarUpload(false)
      toast({
        title: "Avatar updated",
        description: "Avatar URL has been applied"
      })
    }
  }

  const getInitials = () => {
    if (userData?.user_data?.first_name && userData?.user_data?.last_name) {
      return `${userData.user_data.first_name[0]}${userData.user_data.last_name[0]}`.toUpperCase()
    }
    if (userData?.user?.full_name) {
      const names = userData.user.full_name.split(' ')
      return names.length > 1 ? `${names[0][0]}${names[1][0]}`.toUpperCase() : names[0][0].toUpperCase()
    }
    return 'U'
  }

  const headerProps = {
    title: 'Configuración de la cuenta',
    showSearch: false,
    showFilters: false,
    actions: [
      <Button 
        key="save"
        onClick={handleSaveProfile}
        disabled={updateProfileMutation.isPending}
      >
        {updateProfileMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
      </Button>
    ]
  }

  if (isLoading) {
    return (
      <Layout headerProps={headerProps}>
        <div className="text-center text-muted-foreground">
          Loading profile...
        </div>
      </Layout>
    )
  }

  return (
    <Layout headerProps={headerProps}>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Plan Card */}
        <Card className="bg-muted/30">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1 flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">
                  Tu aplicación está actualmente en el plan gratuito
                </p>
                <p className="text-xs text-muted-foreground break-words">
                  Los planes pagos ofrecen límites de uso más altos, ramas adicionales y mucho más. 
                  <span className="text-primary underline cursor-pointer ml-1">Aprende más aquí.</span>
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 shrink-0">
                <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Chatear con nosotros</span>
                  <span className="sm:hidden">Chat</span>
                </Button>
                <Button size="sm" className="w-full sm:w-auto">
                  Actualizar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator className="my-8" />

        {/* Perfil Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="space-y-1">
              <h3 className="text-lg font-medium">Perfil</h3>
              <p className="text-sm text-muted-foreground">
                Esta información se mostrará públicamente, así que ten cuidado con lo que compartes.
              </p>
            </div>
          </div>
          
          <div className="lg:col-span-2 space-y-6">
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
                    variant="outline"
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
              
              {showAvatarUpload && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                  <div>
                    <Label className="text-sm font-medium">Subir archivo</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarFileChange}
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">URL de imagen</Label>
                    <div className="flex gap-2">
                      <Input
                        value={avatarUrlInput}
                        onChange={(e) => setAvatarUrlInput(e.target.value)}
                        placeholder="https://ejemplo.com/imagen.jpg"
                      />
                      <Button
                        size="sm"
                        onClick={handleApplyAvatarUrl}
                        disabled={!avatarUrlInput.trim()}
                      >
                        Aplicar
                      </Button>
                    </div>
                  </div>
                </div>
              )}
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

        <Separator className="my-8" />

        {/* Información Personal Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="space-y-1">
              <h3 className="text-lg font-medium">Información Personal</h3>
              <p className="text-sm text-muted-foreground">
                Actualiza tus datos personales aquí.
              </p>
            </div>
          </div>
          
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Nombre</Label>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Apellido</Label>
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">País</Label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un país" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country: Country) => (
                      <SelectItem key={country.id} value={country.id}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Fecha de nacimiento</Label>
                <Input
                  type="date"
                  value={birthdate}
                  onChange={(e) => setBirthdate(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Preferencias Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="space-y-1">
              <h3 className="text-lg font-medium">Preferencias</h3>
              <p className="text-sm text-muted-foreground">
                Configura las preferencias de tu aplicación.
              </p>
            </div>
          </div>
          
          <div className="lg:col-span-2 space-y-6">
            {/* Theme */}
            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Modo oscuro</Label>
                <div className="text-xs text-muted-foreground">
                  Alterna entre temas claro y oscuro
                </div>
              </div>
              <Switch
                checked={userData?.preferences?.theme === 'dark'}
                onCheckedChange={() => toggleThemeMutation.mutate()}
                disabled={toggleThemeMutation.isPending}
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
                onCheckedChange={(newValue) => {
                  setSidebarDocked(newValue);
                  setDocked(newValue);
                  // Guardar inmediatamente en la base de datos
                  if (userData?.preferences?.id) {
                    updateProfileMutation.mutate({
                      firstName,
                      lastName,
                      country,
                      birthdate,
                      avatarUrl,
                      sidebarDocked: newValue
                    });
                  }
                }}
              />
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Zona de Peligro */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="space-y-1">
              <h3 className="text-lg font-medium">Zona de peligro</h3>
              <p className="text-sm text-muted-foreground">
                Acciones irreversibles y destructivas.
              </p>
            </div>
          </div>
          
          <div className="lg:col-span-2">
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
                    <AlertDialogTitle>¿Cerrar sesión?</AlertDialogTitle>
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
    </Layout>
  )
}